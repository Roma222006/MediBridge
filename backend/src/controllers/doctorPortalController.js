const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Referral = require('../models/Referral');

class DoctorPortalController {
  async getProfile(req, res, next) {
    try {
      const doctor = await Doctor.findOne({ userId: req.user._id })
        .populate('hospitalId', 'name licenseNumber address phone emergencyPhone type')
        .lean();

      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found for this user.' }
        });
      }

      res.json({
        success: true,
        data: {
          id: doctor._id,
          name: doctor.name,
          email: req.user.email,
          phone: req.user.phone,
          specialty: doctor.specialty,
          qualifications: doctor.qualifications,
          regNumber: doctor.regNumber,
          verificationStatus: doctor.verificationStatus,
          experienceYears: doctor.experienceYears,
          consultationFee: doctor.consultationFee,
          availableDays: doctor.availableDays,
          consultModes: {
            inPerson: doctor.inPersonAvailable !== false,
            teleconsult: doctor.teleconsultAvailable !== false
          },
          hospital: doctor.hospitalId
            ? {
                id: doctor.hospitalId._id,
                name: doctor.hospitalId.name,
                licenseNumber: doctor.hospitalId.licenseNumber,
                district: doctor.hospitalId.address?.district,
                city: doctor.hospitalId.address?.city,
                phone: doctor.hospitalId.phone,
                type: doctor.hospitalId.type
              }
            : null,
          isActive: doctor.isActive,
          tokenVersion: req.user.tokenVersion
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getSchedule(req, res, next) {
    try {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found for this user.' }
        });
      }

      const { date, tab, status } = req.query;
      const today = new Date().toISOString().split('T')[0];
      const targetDate = date || (tab === 'completed' || tab === 'cancelled' ? undefined : today);

      const query = { doctorId: doctor._id };
      if (targetDate) {
        query.date = targetDate;
      }

      if (status) {
        query.status = status;
      } else if (tab === 'completed') {
        query.status = 'COMPLETED';
      } else if (tab === 'cancelled') {
        query.status = 'CANCELLED';
      } else if (tab === 'upcoming') {
        query.status = { $in: ['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION'] };
        if (!date) query.date = { $gte: today };
      } else if (!status && !tab) {
        query.status = { $in: ['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED'] };
      }

      const appointments = await Appointment.find(query)
        .populate('patientProfileId', 'fullName gender dateOfBirth phone')
        .populate('serviceId', 'name specialty price')
        .populate('slotId', 'startTime endTime type')
        .sort({ date: 1, startTime: 1 })
        .lean();

      // Compute patient age for display
      const enrichedAppointments = appointments.map((appt) => {
        let age = null;
        if (appt.patientProfileId?.dateOfBirth) {
          const birthDate = new Date(appt.patientProfileId.dateOfBirth);
          const ageDiffMs = Date.now() - birthDate.getTime();
          const ageDate = new Date(ageDiffMs);
          age = Math.abs(ageDate.getUTCFullYear() - 1970);
        }
        return {
          ...appt,
          patientAge: age
        };
      });

      res.json({
        success: true,
        data: {
          doctor: {
            id: doctor._id,
            name: doctor.name,
            specialty: doctor.specialty,
            regNumber: doctor.regNumber,
            verificationStatus: doctor.verificationStatus
          },
          date: targetDate || today,
          activeTab: tab || 'today',
          count: enrichedAppointments.length,
          appointments: enrichedAppointments
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getSlots(req, res, next) {
    try {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' }
        });
      }

      const { date } = req.query;
      const today = new Date().toISOString().split('T')[0];
      const targetDate = date || today;

      const Slot = require('../models/Slot');
      const slots = await Slot.find({
        hospitalId: req.user.hospitalId,
        doctorId: doctor._id,
        date: targetDate
      })
        .populate('serviceId', 'name specialty price')
        .sort({ startTime: 1 })
        .lean();

      res.json({
        success: true,
        count: slots.length,
        data: slots
      });
    } catch (err) {
      next(err);
    }
  }

  async updateAppointmentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status: targetStatus, version, outcomeSummary } = req.body;

      if (!targetStatus) {
        return res.status(422).json({
          success: false,
          error: { code: 'VALIDATION_FAILED', message: 'Target status is required.' }
        });
      }

      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' }
        });
      }

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Appointment not found.' }
        });
      }

      // Strict ownership check: doctor must own this appointment
      if (!appointment.doctorId || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Appointment not found or assigned to another doctor.' }
        });
      }

      // Optimistic concurrency check
      if (version !== undefined && appointment.version !== Number(version)) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'ALREADY_HANDLED',
            message: `Conflict: Appointment version mismatch (current v${appointment.version}, provided v${version}). Refresh and retry.`
          }
        });
      }

      // Valid status transitions permitted for Doctor role
      const validTransitions = {
        CONFIRMED: ['IN_CONSULTATION'],
        CHECKED_IN: ['IN_CONSULTATION'],
        IN_CONSULTATION: ['COMPLETED']
      };

      const currentStatus = appointment.status;
      const allowedNext = validTransitions[currentStatus] || [];

      if (!allowedNext.includes(targetStatus)) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: `Invalid status transition: Doctor cannot change appointment from '${currentStatus}' to '${targetStatus}'.`
          }
        });
      }

      // Commit transition
      appointment.status = targetStatus;
      appointment.version = (appointment.version || 0) + 1;
      appointment.statusHistory.push({
        fromStatus: currentStatus,
        toStatus: targetStatus,
        reason: outcomeSummary || `Doctor advanced status to ${targetStatus}`,
        changedBy: req.user._id,
        timestamp: new Date()
      });

      if (targetStatus === 'IN_CONSULTATION' && !appointment.teleconsultSession?.doctorJoinedAt) {
        if (!appointment.teleconsultSession) appointment.teleconsultSession = {};
        appointment.teleconsultSession.doctorJoinedAt = new Date();
      }

      await appointment.save();

      // Broadcast update via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`hospital:${appointment.hospitalId}`).emit('appointment_status_changed', {
          appointmentId: appointment._id,
          referenceNumber: appointment.referenceNumber,
          status: targetStatus,
          version: appointment.version
        });
      }

      res.json({
        success: true,
        message: `Appointment transitioned to ${targetStatus}`,
        data: {
          id: appointment._id,
          referenceNumber: appointment.referenceNumber,
          status: appointment.status,
          version: appointment.version,
          statusHistory: appointment.statusHistory
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async submitLeaveRequest(req, res, next) {
    try {
      const { startDate, endDate, reason, idempotencyKey } = req.body;

      if (!startDate || !endDate || !reason) {
        return res.status(422).json({
          success: false,
          error: { code: 'VALIDATION_FAILED', message: 'startDate, endDate, and reason are required.' }
        });
      }

      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' }
        });
      }

      const DoctorLeaveRequest = require('../models/DoctorLeaveRequest');

      if (idempotencyKey) {
        const existing = await DoctorLeaveRequest.findOne({ idempotencyKey });
        if (existing) {
          return res.status(200).json({
            success: true,
            message: 'Existing leave request retrieved (idempotent).',
            data: existing
          });
        }
      }

      const leaveRequest = await DoctorLeaveRequest.create({
        doctorId: doctor._id,
        hospitalId: req.user.hospitalId,
        startDate,
        endDate,
        reason,
        idempotencyKey: idempotencyKey || null,
        status: 'SUBMITTED'
      });

      const AuditLog = require('../models/AuditLog');
      await AuditLog.create({
        eventType: 'DOCTOR_LEAVE_REQUESTED',
        actorId: req.user._id,
        hospitalId: req.user.hospitalId,
        resourceType: 'DoctorLeaveRequest',
        resourceId: leaveRequest._id.toString(),
        action: 'SUBMIT_LEAVE_REQUEST',
        status: 'EXECUTED'
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`hospital:${req.user.hospitalId}`).emit('doctor_leave_requested', {
          requestId: leaveRequest._id,
          doctorId: doctor._id,
          doctorName: doctor.name,
          startDate,
          endDate
        });
      }

      res.status(201).json({
        success: true,
        message: 'Leave request submitted to hospital administration for scheduling and reassignment.',
        data: leaveRequest
      });
    } catch (err) {
      next(err);
    }
  }

  async getLeaveRequests(req, res, next) {
    try {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' }
        });
      }

      const DoctorLeaveRequest = require('../models/DoctorLeaveRequest');
      const requests = await DoctorLeaveRequest.find({ doctorId: doctor._id })
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        count: requests.length,
        data: requests
      });
    } catch (err) {
      next(err);
    }
  }

  async getNotifications(req, res, next) {
    try {
      const Notification = require('../models/Notification');
      const notifications = await Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const unreadCount = notifications.filter((n) => !n.isRead).length;

      res.json({
        success: true,
        count: notifications.length,
        unreadCount,
        data: notifications
      });
    } catch (err) {
      next(err);
    }
  }

  async markNotificationRead(req, res, next) {
    try {
      const { id } = req.params;
      const Notification = require('../models/Notification');

      if (id === 'all') {
        await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
        return res.json({ success: true, message: 'All notifications marked as read.' });
      }

      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId: req.user._id },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Notification not found.' }
        });
      }

      res.json({
        success: true,
        data: notification
      });
    } catch (err) {
      next(err);
    }
  }

  async getSpecialtyReferrals(req, res, next) {
    try {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' }
        });
      }

      const referrals = await Referral.find({
        receivingHospitalId: req.user.hospitalId,
        targetSpecialty: { $regex: doctor.specialty, $options: 'i' },
        status: { $in: ['SENT', 'RECEIVED', 'UNDER_REVIEW', 'ACCEPTED'] }
      })
        .populate('patientProfileId', 'fullName dateOfBirth gender')
        .populate('referringHospitalId', 'name address phone')
        .populate('referringDoctorId', 'name specialty')
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        count: referrals.length,
        data: referrals
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DoctorPortalController();
