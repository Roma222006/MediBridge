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

  async saveNotes(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const { content, isDraft, version, recommendInPerson, convertedToReferral } = req.body;
      const user = req.user;

      if (user.role !== 'doctor') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only attending physicians can document consultation notes.' }
        });
      }

      const doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' }
        });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: { code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found.' }
        });
      }

      if (!appointment.doctorId || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Appointment not assigned to this doctor.' }
        });
      }

      if (!isDraft && (!content || !content.trim())) {
        return res.status(422).json({
          success: false,
          error: { code: 'VALIDATION_FAILED', message: 'Clinical notes content cannot be blank when finalizing consultation.' }
        });
      }

      const ConsultationNote = require('../models/ConsultationNote');
      let note = await ConsultationNote.findOne({ appointmentId, doctorId: doctor._id });

      if (note) {
        if (version !== undefined && note.version !== Number(version)) {
          return res.status(409).json({
            success: false,
            error: { code: 'ALREADY_HANDLED', message: `Conflict: Note version mismatch (current v${note.version}, sent v${version}).` }
          });
        }
        note.content = content || note.content;
        note.isDraft = isDraft !== undefined ? isDraft : false;
        note.version = (note.version || 1) + 1;
        note.savedAt = new Date();
        if (recommendInPerson !== undefined) note.recommendInPerson = recommendInPerson;
        if (convertedToReferral !== undefined) note.convertedToReferral = convertedToReferral;
        await note.save();
      } else {
        note = await ConsultationNote.create({
          appointmentId: appointment._id,
          doctorId: doctor._id,
          patientProfileId: appointment.patientProfileId,
          hospitalId: appointment.hospitalId,
          content: content || '',
          version: 1,
          isDraft: isDraft !== undefined ? isDraft : false,
          savedAt: new Date(),
          recommendInPerson: !!recommendInPerson,
          convertedToReferral: !!convertedToReferral
        });
      }

      res.json({
        success: true,
        message: isDraft ? 'Draft autosaved' : 'Consultation notes committed',
        data: note
      });
    } catch (err) {
      next(err);
    }
  }

  async getNotes(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const user = req.user;

      const doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' }
        });
      }

      const ConsultationNote = require('../models/ConsultationNote');
      const note = await ConsultationNote.findOne({ appointmentId, doctorId: doctor._id }).lean();

      res.json({
        success: true,
        data: note || null
      });
    } catch (err) {
      next(err);
    }
  }

  async endSession(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const user = req.user;

      const doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' }
        });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: { code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found.' }
        });
      }

      if (!appointment.doctorId || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Appointment not assigned to this doctor.' }
        });
      }

      // Hard safeguard: Consult cannot be ended until notes are saved (non-draft)
      const ConsultationNote = require('../models/ConsultationNote');
      const savedNote = await ConsultationNote.findOne({
        appointmentId: appointment._id,
        doctorId: doctor._id,
        isDraft: false
      });

      if (!savedNote || !savedNote.content || !savedNote.content.trim()) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Clinical safety requirement: Consultation notes must be saved and committed before concluding the consultation.'
          }
        });
      }

      if (appointment.status === 'IN_CONSULTATION' || appointment.status === 'CONFIRMED' || appointment.status === 'CHECKED_IN') {
        appointment.status = 'COMPLETED';
        appointment.version = (appointment.version || 0) + 1;
        appointment.statusHistory.push({
          fromStatus: 'IN_CONSULTATION',
          toStatus: 'COMPLETED',
          reason: 'Doctor concluded consultation after saving notes',
          changedBy: user._id,
          timestamp: new Date()
        });
        await appointment.save();
      }

      const io = req.app.get('io');
      if (io) {
        io.to(`teleconsult:${appointment._id}`).emit('session_concluded', {
          appointmentId: appointment._id,
          concludedAt: new Date(),
          status: 'COMPLETED'
        });
      }

      res.json({
        success: true,
        message: 'Consultation concluded and marked completed.',
        data: {
          appointmentId: appointment._id,
          status: appointment.status,
          notesCommitted: true
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TeleconsultController();
