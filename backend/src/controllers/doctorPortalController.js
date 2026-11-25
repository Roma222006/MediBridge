const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Referral = require('../models/Referral');
const CredentialDocument = require('../models/CredentialDocument');
const AuditLog = require('../models/AuditLog');
const vaultStorageService = require('../services/vaultStorageService');

function computeVerificationBadge(doctor) {
  if (doctor.verificationStatus === 'DEMO_NOT_VERIFIED') {
    return 'Demo, not verified';
  }
  if (doctor.verificationStatus === 'VERIFIED') {
    const dateStr = new Date(doctor.verifiedAt || doctor.updatedAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const council = doctor.councilName || 'State Medical Council';
    return `Registration checked on ${dateStr} (${doctor.regNumber}, ${council})`;
  }
  if (doctor.verificationStatus === 'SUBMITTED') {
    return 'Verification submitted — pending review';
  }
  if (doctor.verificationStatus === 'UNDER_REVIEW') {
    return 'Under administrative review';
  }
  if (doctor.verificationStatus === 'ADDITIONAL_INFO_REQUIRED') {
    return 'Additional information required';
  }
  if (doctor.verificationStatus === 'REJECTED') {
    return 'Verification rejected';
  }
  return 'Profile incomplete';
}

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
          fullName: doctor.name,
          email: req.user.email,
          phone: req.user.phone,
          specialty: doctor.specialty,
          qualifications: doctor.qualifications,
          regNumber: doctor.regNumber,
          councilName: doctor.councilName || 'Tamil Nadu Medical Council',
          councilState: doctor.councilState || 'Tamil Nadu',
          subSpecialty: doctor.subSpecialty || null,
          designation: doctor.designation || 'Consultant',
          languagesSpoken: doctor.languagesSpoken || ['English', 'Tamil'],
          department: doctor.department || 'General',
          verificationStatus: doctor.verificationStatus,
          reviewStage: doctor.reviewStage || 'NONE',
          verifiedAt: doctor.verifiedAt || null,
          verificationBadgeText: computeVerificationBadge(doctor),
          verificationHistory: doctor.verificationHistory || [],
          experienceYears: doctor.experienceYears,
          consultationFee: doctor.consultationFee,
          availableDays: doctor.availableDays,
          consultModes: {
            inPerson: doctor.consultModes?.inPerson !== false && doctor.inPersonAvailable !== false,
            teleconsult: doctor.consultModes?.teleconsult !== false && doctor.teleconsultAvailable !== false
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

  async updateProfile(req, res, next) {
    try {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' }
        });
      }

      // Prohibit self-approval or modifying hospital tenant directly
      const {
        name,
        regNumber,
        councilName,
        councilState,
        qualifications,
        specialty,
        subSpecialty,
        designation,
        languagesSpoken,
        department,
        experienceYears,
        consultModes,
        consultationFee
      } = req.body;

      // Rule 3.4: A change to name, registration number, council or qualifications
      // resets the status to Submitted and removes the doctor from new bookings until re-checked;
      // existing bookings stay. Doctor cannot approve their own verification or edit hospital affiliation.
      const isCoreCredentialModified =
        (name !== undefined && name.trim() !== doctor.name) ||
        (regNumber !== undefined && regNumber.trim() !== doctor.regNumber) ||
        (councilName !== undefined && councilName.trim() !== doctor.councilName) ||
        (councilState !== undefined && councilState.trim() !== doctor.councilState) ||
        (qualifications !== undefined && qualifications.trim() !== doctor.qualifications);

      if (name !== undefined) doctor.name = name.trim();
      if (regNumber !== undefined) doctor.regNumber = regNumber.trim();
      if (councilName !== undefined) doctor.councilName = councilName.trim();
      if (councilState !== undefined) doctor.councilState = councilState.trim();
      if (qualifications !== undefined) doctor.qualifications = qualifications.trim();
      if (specialty !== undefined) doctor.specialty = specialty.trim();
      if (subSpecialty !== undefined) doctor.subSpecialty = subSpecialty.trim();
      if (designation !== undefined) doctor.designation = designation.trim();
      if (department !== undefined) doctor.department = department.trim();
      if (experienceYears !== undefined) doctor.experienceYears = Number(experienceYears);
      if (consultationFee !== undefined) doctor.consultationFee = Number(consultationFee);
      if (Array.isArray(languagesSpoken)) doctor.languagesSpoken = languagesSpoken;
      if (consultModes && typeof consultModes === 'object') {
        doctor.consultModes = {
          inPerson: consultModes.inPerson !== false,
          teleconsult: consultModes.teleconsult !== false
        };
        doctor.inPersonAvailable = consultModes.inPerson !== false;
        doctor.teleconsultAvailable = consultModes.teleconsult !== false;
      }

      if (isCoreCredentialModified) {
        doctor.verificationStatus = 'SUBMITTED';
        doctor.reviewStage = 'HOSPITAL_STAGE';
        doctor.verificationHistory.push({
          stage: 'hospital',
          status: 'SUBMITTED',
          reviewerId: req.user._id,
          reviewerRole: 'doctor',
          comments: 'Core professional credentials modified by doctor; reset to Submitted for administrative verification.',
          timestamp: new Date()
        });
      }

      await doctor.save();

      res.json({
        success: true,
        message: isCoreCredentialModified
          ? 'Profile updated. Core credential modifications require administrative review before new bookings can be accepted.'
          : 'Profile updated successfully.',
        data: {
          id: doctor._id,
          name: doctor.name,
          specialty: doctor.specialty,
          qualifications: doctor.qualifications,
          regNumber: doctor.regNumber,
          councilName: doctor.councilName,
          councilState: doctor.councilState,
          subSpecialty: doctor.subSpecialty,
          designation: doctor.designation,
          department: doctor.department,
          verificationStatus: doctor.verificationStatus,
          reviewStage: doctor.reviewStage,
          verificationBadgeText: computeVerificationBadge(doctor),
          verificationHistory: doctor.verificationHistory
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async uploadCredentialDocument(req, res, next) {
    try {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' }
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'FILE_REQUIRED', message: 'A credential document file is required.' }
        });
      }

      const { type } = req.body;
      const validTypes = ['registration_certificate', 'degree_certificate', 'other'];
      if (!type || !validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DOCUMENT_TYPE',
            message: 'Document type must be registration_certificate, degree_certificate, or other.'
          }
        });
      }

      // Save file with magic-byte validation and sha256 checksum
      const storageResult = vaultStorageService.saveFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Previous current version of same type gets archived (isCurrent: false)
      const prevDoc = await CredentialDocument.findOne({
        doctorId: doctor._id,
        type,
        isCurrent: true
      });
      const newVersion = prevDoc ? prevDoc.version + 1 : 1;

      if (prevDoc) {
        prevDoc.isCurrent = false;
        await prevDoc.save();
      }

      const credentialDoc = await CredentialDocument.create({
        hospitalId: doctor.hospitalId,
        doctorId: doctor._id,
        type,
        fileName: req.file.originalname,
        fileSize: storageResult.fileSizeBytes,
        mimeType: storageResult.mimeType,
        storageKey: storageResult.fileKey,
        sha256: storageResult.sha256Hash,
        version: newVersion,
        isCurrent: true,
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      });

      // Audit log the document upload
      await AuditLog.create({
        eventType: 'CREDENTIAL_DOCUMENT_UPLOAD',
        actorId: req.user._id,
        actorRole: 'doctor',
        hospitalId: doctor.hospitalId,
        resourceType: 'CredentialDocument',
        resourceId: credentialDoc._id.toString(),
        action: 'UPLOAD',
        status: 'EXECUTED'
      });

      res.status(201).json({
        success: true,
        message: 'Credential document uploaded successfully.',
        data: {
          id: credentialDoc._id,
          type: credentialDoc.type,
          fileName: credentialDoc.fileName,
          fileSize: credentialDoc.fileSize,
          mimeType: credentialDoc.mimeType,
          sha256: credentialDoc.sha256,
          version: credentialDoc.version,
          uploadedAt: credentialDoc.uploadedAt
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getCredentialDocuments(req, res, next) {
    try {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' }
        });
      }

      const docs = await CredentialDocument.find({ doctorId: doctor._id, isCurrent: true })
        .sort({ uploadedAt: -1 })
        .lean();

      res.json({
        success: true,
        count: docs.length,
        data: docs.map((d) => ({
          id: d._id,
          type: d.type,
          fileName: d.fileName,
          fileSize: d.fileSize,
          mimeType: d.mimeType,
          sha256: d.sha256,
          version: d.version,
          uploadedAt: d.uploadedAt
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  async requestDocumentDownloadUrl(req, res, next) {
    try {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' }
        });
      }

      const doc = await CredentialDocument.findById(req.params.id);
      if (!doc || doc.doctorId.toString() !== doctor._id.toString()) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Credential document not found or belongs to another doctor.' }
        });
      }

      // Ephemeral 60s signed token
      const token = vaultStorageService.generateSignedDownloadToken({
        recordId: doc._id,
        fileKey: doc.storageKey,
        userId: req.user._id,
        role: 'doctor'
      });

      // CERT-In audit logging
      await AuditLog.create({
        eventType: 'CREDENTIAL_DOCUMENT_READ',
        actorId: req.user._id,
        actorRole: 'doctor',
        hospitalId: doctor.hospitalId,
        resourceType: 'CredentialDocument',
        resourceId: doc._id.toString(),
        action: 'DOWNLOAD',
        status: 'ALLOWED'
      });

      res.json({
        success: true,
        data: {
          downloadUrl: `/api/v1/doctor/documents/download?token=${token}`,
          expiresInSeconds: 60
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async downloadDocument(req, res, next) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({
          success: false,
          error: { code: 'TOKEN_REQUIRED', message: 'Signed download token is required.' }
        });
      }

      const decoded = vaultStorageService.verifyDownloadToken(token);
      const filePath = vaultStorageService.getFilePath(decoded.fileKey);

      res.setHeader('Content-Disposition', `inline; filename="${decoded.fileKey}"`);
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DoctorPortalController();
