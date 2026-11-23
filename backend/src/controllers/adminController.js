const Hospital = require('../models/Hospital');
const Slot = require('../models/Slot');
const Service = require('../models/Service');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Referral = require('../models/Referral');
const DoctorLeave = require('../models/DoctorLeave');
const AuditLog = require('../models/AuditLog');

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
}

module.exports = new AdminController();
