const jwt = require('jsonwebtoken');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const PatientProfile = require('../models/PatientProfile');
const config = require('../config');

class TeleconsultController {
  async joinSession(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const user = req.user;

      const appointment = await Appointment.findById(appointmentId)
        .populate('doctorId', 'name specialty userId')
        .populate('patientProfileId', 'fullName userId')
        .populate('hospitalId', 'name');

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: { code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found.' }
        });
      }

      if (appointment.type !== 'consultation_tele') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_CONSULTATION_TYPE', message: 'This appointment is not scheduled for teleconsultation.' }
        });
      }

      if (!['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION'].includes(appointment.status)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_APPOINTMENT_STATUS', message: `Cannot join teleconsult in status: ${appointment.status}` }
        });
      }

      // Authorization check: Is user either the doctor or the patient owner?
      const isDoctor =
        user.role === 'doctor' &&
        appointment.doctorId &&
        appointment.doctorId.userId.toString() === user._id.toString();

      const isPatient =
        user.role === 'patient' &&
        appointment.patientProfileId &&
        appointment.patientProfileId.userId.toString() === user._id.toString();

      if (!isDoctor && !isPatient) {
        return res.status(403).json({
          success: false,
          error: { code: 'JOIN_UNAUTHORIZED', message: 'You are not an authorized participant in this consultation.' }
        });
      }

      const participantRole = isDoctor ? 'DOCTOR' : 'PATIENT';
      const participantName = isDoctor
        ? appointment.doctorId.name
        : appointment.patientProfileId.fullName;

      // Update joined timestamp
      const now = new Date();
      if (isDoctor) {
        appointment.teleconsultSession.doctorJoinedAt = now;
        if (appointment.status === 'CONFIRMED' || appointment.status === 'CHECKED_IN') {
          appointment.status = 'IN_CONSULTATION';
          appointment.statusHistory.push({
            fromStatus: 'CONFIRMED',
            toStatus: 'IN_CONSULTATION',
            reason: 'Doctor commenced teleconsultation session',
            changedBy: user._id,
            timestamp: now
          });
        }
      } else {
        appointment.teleconsultSession.patientJoinedAt = now;
      }

      await appointment.save();

      // Issue participant-bound session token (valid 1 hour)
      const sessionToken = jwt.sign(
        {
          appointmentId: appointment._id,
          referenceNumber: appointment.referenceNumber,
          participantRole,
          participantName,
          userId: user._id,
          purpose: 'teleconsult_participant'
        },
        config.jwt.accessSecret,
        { expiresIn: '1h' }
      );

      // Socket.IO broadcast: participant joined
      const io = req.app.get('io');
      if (io) {
        io.to(`teleconsult:${appointment._id}`).emit('participant_joined', {
          participantRole,
          participantName,
          joinedAt: now
        });
      }

      // Waiting room check: If patient joined but doctor has not yet joined
      const doctorPresent = !!appointment.teleconsultSession.doctorJoinedAt;
      const isWaiting = isPatient && !doctorPresent;

      res.json({
        success: true,
        data: {
          referenceNumber: appointment.referenceNumber,
          participantRole,
          participantName,
          sessionToken,
          status: appointment.status,
          waitingRoom: isWaiting,
          waitingMessage: isWaiting
            ? 'You have securely entered the waiting room. Dr. ' +
              (appointment.doctorId ? appointment.doctorId.name : 'Specialist') +
              ' will join shortly.'
            : 'Teleconsultation bridge active.',
          tierDelivered: 'Tier 1 (Booking-linked session, participant-bound token, waiting room state & join authorization)'
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getSessionStatus(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const appointment = await Appointment.findById(appointmentId)
        .populate('doctorId', 'name specialty')
        .populate('patientProfileId', 'fullName')
        .lean();

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: { code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found.' }
        });
      }

      res.json({
        success: true,
        data: {
          referenceNumber: appointment.referenceNumber,
          status: appointment.status,
          teleconsultSession: appointment.teleconsultSession,
          doctorPresent: !!appointment.teleconsultSession?.doctorJoinedAt,
          patientPresent: !!appointment.teleconsultSession?.patientJoinedAt
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TeleconsultController();
