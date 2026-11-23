const mongoose = require('mongoose');
const Slot = require('../models/Slot');
const Appointment = require('../models/Appointment');
const PatientProfile = require('../models/PatientProfile');
const Service = require('../models/Service');
const Doctor = require('../models/Doctor');
const OutboxEvent = require('../models/OutboxEvent');
const AuditLog = require('../models/AuditLog');

function generateReferenceNumber(dateStr) {
  const cleanDate = (dateStr || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomCode = '';
  for (let i = 0; i < 4; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MB-${cleanDate}-${randomCode}`;
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function intervalsOverlap(start1, end1, start2, end2) {
  return Math.max(timeToMinutes(start1), timeToMinutes(start2)) <
    Math.min(timeToMinutes(end1), timeToMinutes(end2));
}

class BookingService {
  async holdSlot({ slotId, patientProfileId, userId }) {
    // Verify patient profile belongs to logged-in user
    const profile = await PatientProfile.findOne({ _id: patientProfileId, userId });
    if (!profile) {
      const err = new Error('Patient profile not found or does not belong to your account.');
      err.code = 'PROFILE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const candidateSlot = await Slot.findById(slotId);
    if (!candidateSlot) {
      const err = new Error('Slot not found.');
      err.code = 'SLOT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    if (candidateSlot.doctorId) {
      const doctor = await Doctor.findById(candidateSlot.doctorId);
      if (doctor) {
        const isVerified =
          doctor.verificationStatus === 'VERIFIED' || doctor.verificationStatus === 'DEMO_NOT_VERIFIED';
        if (!isVerified) {
          const err = new Error('Doctor must be verified to accept appointments.');
          err.code = 'DOCTOR_NOT_VERIFIED';
          err.statusCode = 403;
          throw err;
        }
      }
    }

    // Atomic conditional slot reservation
    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        $or: [
          { status: 'AVAILABLE' },
          { status: 'HOLD', holdExpiresAt: { $lt: new Date() } }
        ]
      },
      {
        $set: {
          status: 'HOLD',
          holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minute hold
          heldByPatientId: patientProfileId
        },
        $inc: { version: 1 }
      },
      { new: true }
    );

    if (!slot) {
      const err = new Error('The selected slot is currently reserved or taken by another patient.');
      err.code = 'SLOT_TAKEN';
      err.statusCode = 409;
      throw err;
    }

    await AuditLog.create({
      eventType: 'SLOT_HELD',
      actorId: userId,
      hospitalId: slot.hospitalId,
      patientId: profile._id,
      resourceType: 'Slot',
      resourceId: slot._id.toString(),
      action: 'HOLD',
      status: 'EXECUTED'
    });

    return {
      slotId: slot._id,
      holdExpiresAt: slot.holdExpiresAt,
      expiresInSeconds: 600
    };
  }

  async confirmBooking({ slotId, patientProfileId, schemeApplied = 'none', userId, io }) {
    const profile = await PatientProfile.findOne({ _id: patientProfileId, userId });
    if (!profile) {
      const err = new Error('Patient profile not found or does not belong to your account.');
      err.code = 'PROFILE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // Verify slot is held by this patient (or available)
    const slot = await Slot.findOne({
      _id: slotId,
      $or: [
        { status: 'HOLD', heldByPatientId: patientProfileId, holdExpiresAt: { $gt: new Date() } },
        { status: 'AVAILABLE' }
      ]
    });

    if (!slot) {
      const err = new Error('Slot reservation has expired or is no longer available.');
      err.code = 'SLOT_RESERVATION_EXPIRED';
      err.statusCode = 409;
      throw err;
    }

    // Check for patient schedule overlap on the same date
    const existingAppointments = await Appointment.find({
      patientProfileId,
      date: slot.date,
      status: { $in: ['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION'] }
    });

    for (const appt of existingAppointments) {
      if (intervalsOverlap(slot.startTime, slot.endTime, appt.startTime, appt.endTime)) {
        // Release held slot
        await Slot.findByIdAndUpdate(slotId, {
          $set: { status: 'AVAILABLE', heldByPatientId: null, holdExpiresAt: null }
        });

        const err = new Error(
          `Schedule conflict: Patient already has a confirmed appointment (${appt.referenceNumber}) between ${appt.startTime} and ${appt.endTime} on this date.`
        );
        err.code = 'PATIENT_SCHEDULE_CONFLICT';
        err.statusCode = 409;
        throw err;
      }
    }

    // Determine consultation fee
    let fee = 0;
    if (slot.serviceId) {
      const service = await Service.findById(slot.serviceId);
      if (service) fee = service.price;
    }
    if (slot.doctorId) {
      const doctor = await Doctor.findById(slot.doctorId);
      if (doctor) {
        const isVerified =
          doctor.verificationStatus === 'VERIFIED' || doctor.verificationStatus === 'DEMO_NOT_VERIFIED';
        if (!isVerified) {
          const err = new Error('Doctor must be verified to receive new bookings.');
          err.code = 'DOCTOR_NOT_VERIFIED';
          err.statusCode = 403;
          throw err;
        }
        if (fee === 0) fee = doctor.consultationFee;
      }
    }

    // Generate unique reference
    let referenceNumber = generateReferenceNumber(slot.date);
    let attempts = 0;
    while (await Appointment.findOne({ referenceNumber })) {
      referenceNumber = generateReferenceNumber(slot.date);
      attempts++;
      if (attempts > 5) break;
    }

    // Create Appointment
    const appointment = await Appointment.create({
      referenceNumber,
      hospitalId: slot.hospitalId,
      patientProfileId: profile._id,
      doctorId: slot.doctorId || null,
      serviceId: slot.serviceId,
      slotId: slot._id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      type: slot.type,
      consultationFee: fee,
      schemeApplied,
      status: 'CONFIRMED',
      statusHistory: [
        {
          fromStatus: 'RESERVED',
          toStatus: 'CONFIRMED',
          reason: 'Initial patient booking confirmation',
          changedBy: userId,
          timestamp: new Date()
        }
      ],
      version: 1
    });

    // Mark Slot as BOOKED
    slot.status = 'BOOKED';
    slot.bookedAppointmentId = appointment._id;
    slot.heldByPatientId = null;
    slot.holdExpiresAt = null;
    await slot.save();

    // Transactional Outbox write
    await OutboxEvent.create({
      eventType: 'BOOKING_CONFIRMED',
      aggregateId: appointment._id.toString(),
      payload: {
        appointmentId: appointment._id,
        referenceNumber: appointment.referenceNumber,
        patientPhone: profile.phone || profile.emergencyContact?.phone,
        patientName: profile.fullName,
        hospitalId: slot.hospitalId,
        date: slot.date,
        startTime: slot.startTime
      }
    });

    await AuditLog.create({
      eventType: 'APPOINTMENT_CONFIRMED',
      actorId: userId,
      hospitalId: slot.hospitalId,
      patientId: profile._id,
      resourceType: 'Appointment',
      resourceId: appointment._id.toString(),
      action: 'BOOK',
      status: 'EXECUTED',
      metadata: { referenceNumber: appointment.referenceNumber }
    });

    // Broadcast live slot status to connected clients
    if (io) {
      io.to(`hospital:${slot.hospitalId}`).emit('slot_status_changed', {
        slotId: slot._id,
        status: 'BOOKED'
      });
      io.emit('global_slot_booked', {
        hospitalId: slot.hospitalId,
        slotId: slot._id
      });
    }

    return {
      appointment,
      referenceNumber: appointment.referenceNumber
    };
  }

  async getBookingByReference(referenceNumber, userId, userRole, hospitalId = null) {
    const appointment = await Appointment.findOne({ referenceNumber })
      .populate('hospitalId', 'name address phone emergencyPhone')
      .populate('doctorId', 'name specialty qualifications regNumber consultationFee')
      .populate('serviceId', 'name specialty price category')
      .populate('patientProfileId', 'fullName dateOfBirth gender phone relationship')
      .lean();

    if (!appointment) {
      const err = new Error('Booking not found with this reference number.');
      err.code = 'BOOKING_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // Role-based ownership check
    if (userRole === 'patient') {
      const profile = await PatientProfile.findOne({
        _id: appointment.patientProfileId._id,
        userId
      });
      if (!profile) {
        const err = new Error('Access denied. You do not own this appointment.');
        err.code = 'UNAUTHORIZED_BOOKING_ACCESS';
        err.statusCode = 404;
        throw err;
      }
    } else if (userRole === 'hospital_admin' || userRole === 'doctor') {
      if (hospitalId && appointment.hospitalId._id.toString() !== hospitalId.toString()) {
        const err = new Error('Access denied. Appointment belongs to another hospital.');
        err.code = 'RESOURCE_NOT_FOUND';
        err.statusCode = 404;
        throw err;
      }
    }

    return appointment;
  }

  async getPatientBookings(userId) {
    const profiles = await PatientProfile.find({ userId }).select('_id');
    const profileIds = profiles.map((p) => p._id);

    return Appointment.find({ patientProfileId: { $in: profileIds } })
      .populate('hospitalId', 'name address phone')
      .populate('doctorId', 'name specialty qualifications')
      .populate('serviceId', 'name specialty price')
      .populate('patientProfileId', 'fullName relationship')
      .sort({ date: -1, startTime: -1 })
      .lean();
  }

  async cancelBooking({ appointmentId, reason = 'Patient cancellation', userId, io }) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      const err = new Error('Appointment not found.');
      err.code = 'APPOINTMENT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
      const err = new Error(`Cannot cancel an appointment that is already ${appointment.status}.`);
      err.code = 'INVALID_STATE_TRANSITION';
      err.statusCode = 400;
      throw err;
    }

    const previousStatus = appointment.status;
    appointment.status = 'CANCELLED';
    appointment.statusHistory.push({
      fromStatus: previousStatus,
      toStatus: 'CANCELLED',
      reason,
      changedBy: userId,
      timestamp: new Date()
    });
    appointment.version += 1;
    await appointment.save();

    // Release slot back to AVAILABLE
    if (appointment.slotId) {
      await Slot.findByIdAndUpdate(appointment.slotId, {
        $set: {
          status: 'AVAILABLE',
          bookedAppointmentId: null,
          heldByPatientId: null,
          holdExpiresAt: null
        }
      });

      if (io) {
        io.to(`hospital:${appointment.hospitalId}`).emit('slot_status_changed', {
          slotId: appointment.slotId,
          status: 'AVAILABLE'
        });
      }
    }

    await OutboxEvent.create({
      eventType: 'BOOKING_CANCELLED',
      aggregateId: appointment._id.toString(),
      payload: {
        appointmentId: appointment._id,
        referenceNumber: appointment.referenceNumber,
        reason
      }
    });

    return appointment;
  }

  async rescheduleBooking({ appointmentId, newSlotId, userId, io }) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      const err = new Error('Appointment not found.');
      err.code = 'APPOINTMENT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      const err = new Error(`Cannot reschedule an appointment in status ${appointment.status}.`);
      err.code = 'INVALID_STATE_TRANSITION';
      err.statusCode = 400;
      throw err;
    }

    // Step 1: ATOMIC RESERVE NEW BEFORE RELEASING OLD
    // Try to atomically claim the new slot
    const newSlot = await Slot.findOneAndUpdate(
      {
        _id: newSlotId,
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

    // If new slot is taken, ROLLBACK! Old appointment remains intact!
    if (!newSlot) {
      const err = new Error('The requested replacement slot is no longer available. Original appointment remains unchanged.');
      err.code = 'NEW_SLOT_UNAVAILABLE';
      err.statusCode = 409;
      throw err;
    }

    // Step 2: New slot is secured! Release old slot
    const oldSlotId = appointment.slotId;
    if (oldSlotId && oldSlotId.toString() !== newSlotId.toString()) {
      await Slot.findByIdAndUpdate(oldSlotId, {
        $set: {
          status: 'AVAILABLE',
          bookedAppointmentId: null,
          heldByPatientId: null,
          holdExpiresAt: null
        }
      });

      if (io) {
        io.to(`hospital:${appointment.hospitalId}`).emit('slot_status_changed', {
          slotId: oldSlotId,
          status: 'AVAILABLE'
        });
      }
    }

    // Step 3: Update appointment to new slot & mark RESCHEDULED / CONFIRMED
    const previousStatus = appointment.status;
    appointment.slotId = newSlot._id;
    appointment.date = newSlot.date;
    appointment.startTime = newSlot.startTime;
    appointment.endTime = newSlot.endTime;
    appointment.status = 'CONFIRMED';
    appointment.statusHistory.push({
      fromStatus: previousStatus,
      toStatus: 'CONFIRMED',
      reason: `Rescheduled to ${newSlot.date} at ${newSlot.startTime}`,
      changedBy: userId,
      timestamp: new Date()
    });
    appointment.version += 1;
    await appointment.save();

    if (io) {
      io.to(`hospital:${appointment.hospitalId}`).emit('slot_status_changed', {
        slotId: newSlot._id,
        status: 'BOOKED'
      });
    }

    return appointment;
  }

  async runReconciler() {
    // 1. Release expired slot holds back to AVAILABLE
    const expiredSlots = await Slot.updateMany(
      {
        status: 'HOLD',
        holdExpiresAt: { $lt: new Date() }
      },
      {
        $set: {
          status: 'AVAILABLE',
          heldByPatientId: null,
          holdExpiresAt: null
        }
      }
    );

    // 2. Deliver pending outbox events (simulated notification delivery)
    const pendingEvents = await OutboxEvent.find({
      status: 'PENDING',
      nextRunAt: { $lte: new Date() }
    }).limit(20);

    for (const ev of pendingEvents) {
      ev.status = 'DELIVERED';
      ev.attempts += 1;
      await ev.save();
    }

    return {
      releasedHoldsCount: expiredSlots.modifiedCount || 0,
      processedOutboxCount: pendingEvents.length
    };
  }
}

module.exports = new BookingService();
