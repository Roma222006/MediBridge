const { v4: uuidv4 } = require('uuid');
const DoctorLeave = require('../models/DoctorLeave');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');
const OutboxEvent = require('../models/OutboxEvent');
const AuditLog = require('../models/AuditLog');
const PatientProfile = require('../models/PatientProfile');

function generateLeaveEventId(dateStr) {
  const cleanDate = (dateStr || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LV-${cleanDate}-${rand}`;
}

class ReassignmentService {
  async recordDoctorLeave({
    hospitalId,
    doctorId,
    startDate,
    endDate,
    startTime = '00:00',
    endTime = '23:59',
    reason,
    recordedBy,
    io
  }) {
    const doctor = await Doctor.findOne({ _id: doctorId, hospitalId });
    if (!doctor) {
      const err = new Error('Doctor not found in this hospital.');
      err.code = 'DOCTOR_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const eventId = generateLeaveEventId(startDate);

    // 1. Find overlapping confirmed appointments
    const affectedAppointments = await Appointment.find({
      hospitalId,
      doctorId,
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['CONFIRMED', 'CHECKED_IN'] }
    });

    // 2. Find alternative doctors with the same specialty in this hospital
    const peerDoctors = await Doctor.find({
      hospitalId,
      specialty: doctor.specialty,
      _id: { $ne: doctor._id },
      isActive: true
    });

    const peerDoctorIds = peerDoctors.map((d) => d._id);

    // 3. Process each affected appointment
    for (const appt of affectedAppointments) {
      // Find Option A: Suggested doctor slot
      const suggestedSlot = await Slot.findOne({
        hospitalId,
        doctorId: { $in: peerDoctorIds },
        date: appt.date,
        status: 'AVAILABLE'
      }).sort({ startTime: 1 });

      // Find Option B: Same doctor's next available slot after leave
      const sameDoctorNextSlot = await Slot.findOne({
        hospitalId,
        doctorId: doctor._id,
        date: { $gt: endDate },
        status: 'AVAILABLE'
      }).sort({ date: 1, startTime: 1 });

      const prevStatus = appt.status;
      appt.status = 'REASSIGNMENT_PENDING';
      appt.reassignmentDetails = {
        originalDoctorId: doctor._id,
        eventId,
        reason,
        suggestedDoctorId: suggestedSlot ? suggestedSlot.doctorId : null,
        suggestedSlotId: suggestedSlot ? suggestedSlot._id : null,
        deadlineAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour response deadline
        resolutionChoice: 'NONE'
      };

      appt.statusHistory.push({
        fromStatus: prevStatus,
        toStatus: 'REASSIGNMENT_PENDING',
        reason: `Doctor leave [${eventId}]: ${reason}`,
        changedBy: recordedBy,
        timestamp: new Date()
      });

      await appt.save();

      // Block the affected slot so nobody else books it
      await Slot.findByIdAndUpdate(appt.slotId, {
        $set: { status: 'BLOCKED_LEAVE' }
      });

      // Outbox notification for patient
      const profile = await PatientProfile.findById(appt.patientProfileId);
      await OutboxEvent.create({
        eventType: 'DOCTOR_LEAVE_REASSIGNMENT_ALERT',
        aggregateId: appt._id.toString(),
        payload: {
          appointmentId: appt._id,
          referenceNumber: appt.referenceNumber,
          patientPhone: profile?.phone,
          originalDoctorName: doctor.name,
          reason,
          suggestedDoctorId: suggestedSlot?.doctorId,
          deadlineAt: appt.reassignmentDetails.deadlineAt
        }
      });
    }

    // 4. Record Leave
    const leave = await DoctorLeave.create({
      eventId,
      hospitalId,
      doctorId,
      startDate,
      endDate,
      startTime,
      endTime,
      reason,
      affectedAppointmentsCount: affectedAppointments.length,
      recordedBy
    });

    await AuditLog.create({
      eventType: 'DOCTOR_LEAVE_RECORDED',
      actorId: recordedBy,
      hospitalId,
      resourceType: 'DoctorLeave',
      resourceId: leave._id.toString(),
      action: 'CREATE_LEAVE',
      status: 'EXECUTED',
      metadata: { eventId, affectedCount: affectedAppointments.length }
    });

    if (io) {
      io.to(`hospital:${hospitalId}`).emit('doctor_leave_announced', {
        eventId,
        doctorId,
        startDate,
        endDate,
        affectedCount: affectedAppointments.length
      });
    }

    return {
      leave,
      affectedAppointmentsCount: affectedAppointments.length,
      affectedAppointments
    };
  }

  async resolveReassignment({ appointmentId, choice, replacementSlotId, userId, io }) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      const err = new Error('Appointment not found.');
      err.code = 'APPOINTMENT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    if (appointment.status !== 'REASSIGNMENT_PENDING') {
      const err = new Error(`Appointment is not pending reassignment (current status: ${appointment.status}).`);
      err.code = 'INVALID_STATE';
      err.statusCode = 400;
      throw err;
    }

    // Urgent Case Emergency Redirect
    if (choice === 'EMERGENCY_REDIRECT') {
      appointment.status = 'CANCELLED';
      appointment.reassignmentDetails.resolutionChoice = 'EMERGENCY_REDIRECT';
      appointment.statusHistory.push({
        fromStatus: 'REASSIGNMENT_PENDING',
        toStatus: 'CANCELLED',
        reason: 'Urgent case redirected to emergency care / 108',
        changedBy: userId,
        timestamp: new Date()
      });
      await appointment.save();

      return {
        appointment,
        resolution: 'EMERGENCY_REDIRECT',
        emergencyInstructions: {
          hotline: '108',
          guidance: 'For acute chest pain, breathlessness, or trauma, proceed directly to the nearest emergency trauma center immediately.'
        }
      };
    }

    // Choice A or Choice B: requires reserving replacement slot
    const targetSlotId = replacementSlotId || appointment.reassignmentDetails.suggestedSlotId;
    if (!targetSlotId) {
      const err = new Error('No valid replacement slot specified.');
      err.code = 'NO_REPLACEMENT_SLOT';
      err.statusCode = 400;
      throw err;
    }

    // Step 1: ATOMIC RESERVE NEW BEFORE RELEASING OLD
    const newSlot = await Slot.findOneAndUpdate(
      {
        _id: targetSlotId,
        $or: [
          { status: 'AVAILABLE' },
          { status: 'HOLD', holdExpiresAt: { $lt: new Date() } }
        ]
      },
      {
        $set: {
          status: 'BOOKED',
          bookedAppointmentId: appointment._id
        },
        $inc: { version: 1 }
      },
      { new: true }
    );

    // Rollback check: If replacement slot is taken, old appointment remains REASSIGNMENT_PENDING!
    if (!newSlot) {
      const err = new Error('The chosen replacement slot was just claimed by another patient. Please select an alternative slot.');
      err.code = 'NEW_SLOT_UNAVAILABLE';
      err.statusCode = 409;
      throw err;
    }

    // Step 2: Release old slot (marked BLOCKED_LEAVE or AVAILABLE)
    if (appointment.slotId) {
      await Slot.findByIdAndUpdate(appointment.slotId, {
        $set: {
          status: 'AVAILABLE',
          bookedAppointmentId: null,
          heldByPatientId: null,
          holdExpiresAt: null
        }
      });
    }

    // Step 3: Update appointment to confirmed with new slot details
    const previousDoctorId = appointment.doctorId;
    appointment.slotId = newSlot._id;
    appointment.date = newSlot.date;
    appointment.startTime = newSlot.startTime;
    appointment.endTime = newSlot.endTime;
    if (newSlot.doctorId) {
      appointment.doctorId = newSlot.doctorId;
    }
    appointment.status = 'CONFIRMED';
    appointment.reassignmentDetails.resolutionChoice = choice;

    appointment.statusHistory.push({
      fromStatus: 'REASSIGNMENT_PENDING',
      toStatus: 'CONFIRMED',
      reason: `Reassignment resolved via choice [${choice}] with slot on ${newSlot.date} at ${newSlot.startTime}`,
      changedBy: userId,
      timestamp: new Date()
    });

    appointment.version += 1;
    await appointment.save();

    await AuditLog.create({
      eventType: 'REASSIGNMENT_RESOLVED',
      actorId: userId,
      hospitalId: appointment.hospitalId,
      patientId: appointment.patientProfileId,
      resourceType: 'Appointment',
      resourceId: appointment._id.toString(),
      action: 'REASSIGNMENT_RESOLUTION',
      status: 'EXECUTED',
      metadata: { choice, newSlotId: newSlot._id }
    });

    if (io) {
      io.to(`hospital:${appointment.hospitalId}`).emit('slot_status_changed', {
        slotId: newSlot._id,
        status: 'BOOKED'
      });
    }

    return {
      appointment,
      resolution: choice
    };
  }

  async getPendingReassignmentsForPatient(userId) {
    const profiles = await PatientProfile.find({ userId }).select('_id');
    const profileIds = profiles.map((p) => p._id);

    return Appointment.find({
      patientProfileId: { $in: profileIds },
      status: 'REASSIGNMENT_PENDING'
    })
      .populate('hospitalId', 'name phone address')
      .populate('doctorId', 'name specialty')
      .populate('reassignmentDetails.suggestedDoctorId', 'name specialty qualifications')
      .populate('reassignmentDetails.suggestedSlotId', 'date startTime endTime')
      .lean();
  }
}

module.exports = new ReassignmentService();
