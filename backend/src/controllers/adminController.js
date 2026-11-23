const Hospital = require('../models/Hospital');
const Slot = require('../models/Slot');
const Service = require('../models/Service');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Referral = require('../models/Referral');
const DoctorLeave = require('../models/DoctorLeave');
const AuditLog = require('../models/AuditLog');
const CredentialDocument = require('../models/CredentialDocument');
const vaultStorageService = require('../services/vaultStorageService');

class AdminController {
  async getOverview(req, res, next) {
    try {
      const hospitalId = req.user.hospitalId;
      const today = new Date().toISOString().split('T')[0];

      const hospital = await Hospital.findById(hospitalId).lean();

      // Slots today
      const slotsToday = await Slot.find({ hospitalId, date: today }).lean();
      const totalSlotsToday = slotsToday.length;
      const availableSlotsToday = slotsToday.filter((s) => s.status === 'AVAILABLE').length;
      const bookedSlotsToday = slotsToday.filter((s) => s.status === 'BOOKED').length;

      // Pending referrals
      const pendingReferrals = await Referral.countDocuments({
        receivingHospitalId: hospitalId,
        status: { $in: ['SENT', 'RECEIVED', 'UNDER_REVIEW'] }
      });

      // Active doctor leaves
      const activeLeaves = await DoctorLeave.countDocuments({
        hospitalId,
        startDate: { $lte: today },
        endDate: { $gte: today },
        status: 'ACTIVE'
      });

      // Recent audit log entries for this hospital
      const recentAudit = await AuditLog.find({ hospitalId })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();

      res.json({
        success: true,
        data: {
          hospital: {
            id: hospital._id,
            name: hospital.name,
            bedCapacity: hospital.bedCapacity
          },
          slots: {
            total: totalSlotsToday,
            available: availableSlotsToday,
            booked: bookedSlotsToday
          },
          pendingReferrals,
          activeLeaves,
          recentAudit
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async createSlot(req, res, next) {
    try {
      const hospitalId = req.user.hospitalId;
      const { serviceId, doctorId, date, startTime, endTime, type } = req.body;

      if (!serviceId || !date || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'serviceId, date, startTime, and endTime are required.' }
        });
      }

      const slot = await Slot.create({
        hospitalId,
        serviceId,
        doctorId: doctorId || null,
        date,
        startTime,
        endTime,
        type: type || 'consultation_in_person',
        status: 'AVAILABLE'
      });

      await AuditLog.create({
        eventType: 'SLOT_CREATED',
        actorId: req.user._id,
        hospitalId,
        resourceType: 'Slot',
        resourceId: slot._id.toString(),
        action: 'CREATE_SLOT',
        status: 'EXECUTED'
      });

      res.status(201).json({
        success: true,
        data: slot
      });
    } catch (err) {
      next(err);
    }
  }

  async getSlots(req, res, next) {
    try {
      const hospitalId = req.user.hospitalId;
      const { date, doctorId, serviceId, status } = req.query;

      const query = { hospitalId };
      if (date) query.date = date;
      if (doctorId) query.doctorId = doctorId;
      if (serviceId) query.serviceId = serviceId;
      if (status) query.status = status;

      const slots = await Slot.find(query)
        .populate('doctorId', 'name specialty qualifications')
        .populate('serviceId', 'name specialty price')
        .populate('bookedAppointmentId', 'referenceNumber patientProfileId status')
        .sort({ date: 1, startTime: 1 })
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

  async createService(req, res, next) {
    try {
      const hospitalId = req.user.hospitalId;
      const { name, code, category, specialty, price, operatingDays, slotDurationMinutes } = req.body;

      if (!name || !code || !category || !specialty || price === undefined) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'name, code, category, specialty, and price are required.' }
        });
      }

      const service = await Service.create({
        hospitalId,
        name,
        code,
        category,
        specialty,
        price,
        operatingDays: operatingDays || [1, 2, 3, 4, 5, 6],
        slotDurationMinutes: slotDurationMinutes || 30
      });

      res.status(201).json({
        success: true,
        data: service
      });
    } catch (err) {
      next(err);
    }
  }

  async getServices(req, res, next) {
    try {
      const hospitalId = req.user.hospitalId;
      const services = await Service.find({ hospitalId, isActive: true }).lean();
      res.json({
        success: true,
        count: services.length,
        data: services
      });
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const hospitalId = req.user.hospitalId;
      const logs = await AuditLog.find({ hospitalId })
        .sort({ timestamp: -1 })
        .limit(50)
        .lean();

      res.json({
        success: true,
        count: logs.length,
        data: logs
      });
    } catch (err) {
      next(err);
    }
  }

  async getDoctorLeaveRequests(req, res, next) {
    try {
      const hospitalId = req.user.hospitalId;
      const DoctorLeaveRequest = require('../models/DoctorLeaveRequest');
      const requests = await DoctorLeaveRequest.find({ hospitalId })
        .populate('doctorId', 'name specialty regNumber')
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

  async recordDoctorLeaveFromRequest(req, res, next) {
    try {
      const { id } = req.params;
      const hospitalId = req.user.hospitalId;
      const DoctorLeaveRequest = require('../models/DoctorLeaveRequest');
      const request = await DoctorLeaveRequest.findOne({ _id: id, hospitalId });

      if (!request) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Doctor leave request not found.' }
        });
      }

      if (request.status !== 'SUBMITTED') {
        return res.status(422).json({
          success: false,
          error: { code: 'VALIDATION_FAILED', message: `Cannot record leave in status '${request.status}'.` }
        });
      }

      const reassignmentService = require('../services/reassignmentService');
      const io = req.app.get('io');
      const leaveResult = await reassignmentService.recordDoctorLeave({
        hospitalId,
        doctorId: request.doctorId,
        startDate: request.startDate,
        endDate: request.endDate,
        reason: request.reason,
        recordedBy: req.user._id,
        io
      });

      request.status = 'RECORDED_BY_ADMIN';
      request.recordedEventId = leaveResult.leave.eventId;
      request.reviewedBy = req.user._id;
      request.reviewedAt = new Date();
      await request.save();

      res.json({
        success: true,
        message: 'Doctor leave recorded by administration and reassignment initiated.',
        data: {
          leaveRequest: request,
          leaveDetails: leaveResult
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async declineDoctorLeaveRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const hospitalId = req.user.hospitalId;
      const DoctorLeaveRequest = require('../models/DoctorLeaveRequest');
      const request = await DoctorLeaveRequest.findOne({ _id: id, hospitalId });

      if (!request) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Doctor leave request not found.' }
        });
      }

      request.status = 'DECLINED';
      request.adminNotes = reason || 'Declined due to hospital coverage requirements';
      request.reviewedBy = req.user._id;
      request.reviewedAt = new Date();
      await request.save();

      res.json({
        success: true,
        message: 'Doctor leave request declined.',
        data: request
      });
    } catch (err) {
      next(err);
    }
  }

  async getDoctorDocuments(req, res, next) {
    try {
      const { doctorId } = req.params;
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found.' }
        });
      }

      // Hospital tenant isolation: Admin can only view doctors belonging to their own hospital
      if (req.user.role === 'hospital_admin' && doctor.hospitalId.toString() !== req.user.hospitalId.toString()) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Doctor not found in this hospital.' }
        });
      }

      const docs = await CredentialDocument.find({ doctorId, isCurrent: true })
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

  async requestDoctorDocumentDownloadUrl(req, res, next) {
    try {
      const { doctorId, docId } = req.params;
      const doc = await CredentialDocument.findById(docId);
      if (!doc || doc.doctorId.toString() !== doctorId) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Credential document not found for this doctor.' }
        });
      }

      // Tenant isolation: foreign hospital admin denied
      if (req.user.role === 'hospital_admin' && doc.hospitalId.toString() !== req.user.hospitalId.toString()) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Document belongs to another hospital.' }
        });
      }

      // CERT-In access logging
      await AuditLog.create({
        eventType: 'CREDENTIAL_DOCUMENT_READ',
        actorId: req.user._id,
        actorRole: req.user.role,
        hospitalId: doc.hospitalId,
        resourceType: 'CredentialDocument',
        resourceId: doc._id.toString(),
        action: 'DOWNLOAD',
        status: 'ALLOWED'
      });

      const token = vaultStorageService.generateSignedDownloadToken({
        recordId: doc._id,
        fileKey: doc.storageKey,
        userId: req.user._id,
        role: req.user.role
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

  async verifyDoctorHospitalStage(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { comments } = req.body;
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found.' }
        });
      }

      if (req.user.role === 'hospital_admin' && doctor.hospitalId.toString() !== req.user.hospitalId.toString()) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Doctor belongs to another hospital.' }
        });
      }

      doctor.reviewStage = 'PLATFORM_STAGE';
      doctor.verificationStatus = 'UNDER_REVIEW';
      doctor.verificationHistory.push({
        stage: 'hospital',
        status: 'UNDER_REVIEW',
        reviewerId: req.user._id,
        reviewerRole: req.user.role,
        comments: comments || 'Hospital affiliation and department confirmed by hospital administration.',
        timestamp: new Date()
      });

      await doctor.save();

      res.json({
        success: true,
        message: 'Hospital review stage completed. Doctor submitted to platform stage for Medical Council lookup.',
        data: {
          id: doctor._id,
          verificationStatus: doctor.verificationStatus,
          reviewStage: doctor.reviewStage,
          verificationHistory: doctor.verificationHistory
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyDoctorPlatformStage(req, res, next) {
    try {
      // Super-Admin only check
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Platform stage verification against Medical Council register requires Super-Admin authorization.'
          }
        });
      }

      const { doctorId } = req.params;
      const { comments, lookupSource, lookupOutcome } = req.body;
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found.' }
        });
      }

      doctor.verificationStatus = 'VERIFIED';
      doctor.reviewStage = 'COMPLETED';
      doctor.verifiedAt = new Date();
      doctor.verifiedBy = req.user._id;
      doctor.verificationHistory.push({
        stage: 'platform',
        status: 'VERIFIED',
        reviewerId: req.user._id,
        reviewerRole: 'super_admin',
        comments: comments || 'Medical Council registration verified against official public register lookup.',
        lookupSource: lookupSource || `${doctor.councilName || 'State Medical Council'} Public Lookup Portal`,
        lookupOutcome: lookupOutcome || `Active registration verified under ${doctor.regNumber}`,
        timestamp: new Date()
      });

      await doctor.save();

      res.json({
        success: true,
        message: 'Platform stage verification completed. Doctor is now verified to receive bookings and referrals.',
        data: {
          id: doctor._id,
          verificationStatus: doctor.verificationStatus,
          reviewStage: doctor.reviewStage,
          verifiedAt: doctor.verifiedAt,
          verificationHistory: doctor.verificationHistory
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async requestDoctorAdditionalInfo(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { comments } = req.body;
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found.' }
        });
      }

      if (req.user.role === 'hospital_admin' && doctor.hospitalId.toString() !== req.user.hospitalId.toString()) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Doctor belongs to another hospital.' }
        });
      }

      doctor.verificationStatus = 'ADDITIONAL_INFO_REQUIRED';
      doctor.verificationHistory.push({
        stage: req.user.role === 'super_admin' ? 'platform' : 'hospital',
        status: 'ADDITIONAL_INFO_REQUIRED',
        reviewerId: req.user._id,
        reviewerRole: req.user.role,
        comments: comments || 'Additional credential documents or clarification required for verification.',
        timestamp: new Date()
      });

      await doctor.save();

      res.json({
        success: true,
        message: 'Additional information requested from doctor.',
        data: {
          id: doctor._id,
          verificationStatus: doctor.verificationStatus,
          verificationHistory: doctor.verificationHistory
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async rejectDoctorVerification(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { comments } = req.body;
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found.' }
        });
      }

      if (req.user.role === 'hospital_admin' && doctor.hospitalId.toString() !== req.user.hospitalId.toString()) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Doctor belongs to another hospital.' }
        });
      }

      doctor.verificationStatus = 'REJECTED';
      doctor.verificationHistory.push({
        stage: req.user.role === 'super_admin' ? 'platform' : 'hospital',
        status: 'REJECTED',
        reviewerId: req.user._id,
        reviewerRole: req.user.role,
        comments: comments || 'Doctor credential verification rejected.',
        timestamp: new Date()
      });

      await doctor.save();

      res.json({
        success: true,
        message: 'Doctor credential verification rejected.',
        data: {
          id: doctor._id,
          verificationStatus: doctor.verificationStatus,
          verificationHistory: doctor.verificationHistory
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
