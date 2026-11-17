const { v4: uuidv4 } = require('uuid');
const Referral = require('../models/Referral');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const PatientProfile = require('../models/PatientProfile');
const OutboxEvent = require('../models/OutboxEvent');
const AuditLog = require('../models/AuditLog');

function generateReferralNumber(dateStr) {
  const cleanDate = (dateStr || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REF-${cleanDate}-${rand}`;
}

class ReferralService {
  async createReferral({
    patientProfileId,
    referringHospitalId,
    referringDoctorId,
    receivingHospitalId,
    targetSpecialty,
    clinicalSummary,
    priority = 'ROUTINE',
    initialTeleconsultAppointmentId = null,
    dedupeKey,
    userId,
    io
  }) {
    // Prevent duplicate submission with dedupeKey
    const cleanDedupeKey =
      dedupeKey ||
      `${referringDoctorId}_${patientProfileId}_${targetSpecialty}_${new Date().toISOString().split('T')[0]}`;

    const existing = await Referral.findOne({ dedupeKey: cleanDedupeKey });
    if (existing) {
      return existing; // Idempotent return of existing referral
    }

    const patient = await PatientProfile.findById(patientProfileId);
    if (!patient) {
      const err = new Error('Patient profile not found.');
      err.code = 'PATIENT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const receivingHospital = await Hospital.findById(receivingHospitalId);
    if (!receivingHospital) {
      const err = new Error('Receiving hospital not found.');
      err.code = 'HOSPITAL_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const referralNumber = generateReferralNumber();
    const deadlineHours = priority === 'CRITICAL' ? 12 : priority === 'URGENT' ? 24 : 48;
    const responseDeadlineAt = new Date(Date.now() + deadlineHours * 60 * 60 * 1000);

    const referral = await Referral.create({
      referralNumber,
      dedupeKey: cleanDedupeKey,
      patientProfileId,
      referringHospitalId,
      referringDoctorId,
      receivingHospitalId,
      targetSpecialty,
      clinicalSummary,
      priority,
      initialTeleconsultAppointmentId,
      responseDeadlineAt,
      status: 'SENT',
      journeyMetrics: {
        sentAt: new Date()
      },
      statusHistory: [
        {
          fromStatus: 'INITIATED',
          toStatus: 'SENT',
          reason: 'Referral dispatched by referring physician',
          changedBy: userId,
          timestamp: new Date()
        }
      ]
    });

    await OutboxEvent.create({
      eventType: 'REFERRAL_DISPATCHED',
      aggregateId: referral._id.toString(),
      payload: {
        referralNumber: referral.referralNumber,
        referringHospitalId,
        receivingHospitalId,
        priority,
        targetSpecialty
      }
    });

    await AuditLog.create({
      eventType: 'REFERRAL_CREATED',
      actorId: userId,
      hospitalId: referringHospitalId,
      patientId: patientProfileId,
      resourceType: 'Referral',
      resourceId: referral._id.toString(),
      action: 'DISPATCH_REFERRAL',
      status: 'EXECUTED',
      metadata: { referralNumber, priority }
    });

    if (io) {
      io.to(`hospital:${receivingHospitalId}`).emit('new_referral_received', {
        referralId: referral._id,
        referralNumber,
        priority,
        targetSpecialty
      });
    }

    return referral;
  }

  async receiveReferral(referralId, userId, receivingHospitalId) {
    const referral = await Referral.findOne({
      _id: referralId,
      receivingHospitalId
    });

    if (!referral) {
      const err = new Error('Referral not found or belongs to another hospital.');
      err.code = 'RESOURCE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    if (referral.status !== 'SENT') {
      return referral; // Already acknowledged
    }

    const now = new Date();
    const sentTime = referral.journeyMetrics.sentAt || referral.createdAt;
    const sentToReceivedMinutes = Math.round((now.getTime() - new Date(sentTime).getTime()) / (60 * 1000));

    referral.status = 'RECEIVED';
    referral.journeyMetrics.receivedAt = now;
    referral.journeyMetrics.sentToReceivedMinutes = sentToReceivedMinutes;
    referral.statusHistory.push({
      fromStatus: 'SENT',
      toStatus: 'RECEIVED',
      reason: 'Referral acknowledged in receiving hospital queue',
      changedBy: userId,
      timestamp: now
    });

    await referral.save();
    return referral;
  }

  async reviewReferral(referralId, userId, receivingHospitalId) {
    const referral = await Referral.findOne({ _id: referralId, receivingHospitalId });
    if (!referral) {
      const err = new Error('Referral not found.');
      err.code = 'RESOURCE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const prev = referral.status;
    referral.status = 'UNDER_REVIEW';
    referral.statusHistory.push({
      fromStatus: prev,
      toStatus: 'UNDER_REVIEW',
      reason: 'Clinical specialist assigned to evaluate referral',
      changedBy: userId,
      timestamp: new Date()
    });

    await referral.save();
    return referral;
  }

  async acceptReferral(referralId, { assignedCityDoctorId, assignedCitySlotId }, userId, receivingHospitalId, io) {
    const referral = await Referral.findOne({ _id: referralId, receivingHospitalId });
    if (!referral) {
      const err = new Error('Referral not found.');
      err.code = 'RESOURCE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const prev = referral.status;
    referral.status = 'ACCEPTED';
    referral.assignedCityDoctorId = assignedCityDoctorId || null;
    referral.assignedCitySlotId = assignedCitySlotId || null;
    referral.journeyMetrics.acceptedAt = new Date();
    referral.statusHistory.push({
      fromStatus: prev,
      toStatus: 'ACCEPTED',
      reason: 'Receiving hospital accepted referral and scheduled care intake',
      changedBy: userId,
      timestamp: new Date()
    });

    await referral.save();

    await OutboxEvent.create({
      eventType: 'REFERRAL_ACCEPTED',
      aggregateId: referral._id.toString(),
      payload: {
        referralNumber: referral.referralNumber,
        patientProfileId: referral.patientProfileId,
        receivingHospitalId
      }
    });

    return referral;
  }

  async patientConfirm(referralId, userId) {
    // Confirm as patient
    const referral = await Referral.findById(referralId).populate('patientProfileId');
    if (!referral) {
      const err = new Error('Referral not found.');
      err.code = 'RESOURCE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const prev = referral.status;
    referral.status = 'PATIENT_NOTIFIED';
    referral.patientConfirmedAt = new Date();
    referral.statusHistory.push({
      fromStatus: prev,
      toStatus: 'PATIENT_NOTIFIED',
      reason: 'Patient confirmed travel and acceptance of city intake',
      changedBy: userId,
      timestamp: new Date()
    });

    await referral.save();
    return referral;
  }

  async markPatientArrived(referralId, userId, receivingHospitalId) {
    const referral = await Referral.findOne({ _id: referralId, receivingHospitalId });
    if (!referral) {
      const err = new Error('Referral not found.');
      err.code = 'RESOURCE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const prev = referral.status;
    referral.status = 'ARRIVED';
    referral.journeyMetrics.arrivedAt = new Date();
    referral.statusHistory.push({
      fromStatus: prev,
      toStatus: 'ARRIVED',
      reason: 'Patient arrived and checked in at receiving hospital triage',
      changedBy: userId,
      timestamp: new Date()
    });

    await referral.save();
    return referral;
  }

  async completeReferral(referralId, { outcomeSummary }, userId, receivingHospitalId) {
    const referral = await Referral.findOne({ _id: referralId, receivingHospitalId });
    if (!referral) {
      const err = new Error('Referral not found.');
      err.code = 'RESOURCE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const now = new Date();
    const arrivedAt = referral.journeyMetrics.arrivedAt || referral.journeyMetrics.acceptedAt || referral.createdAt;
    const arrivalToCompletionMinutes = Math.round((now.getTime() - new Date(arrivedAt).getTime()) / (60 * 1000));

    const prev = referral.status;
    referral.status = 'COMPLETED';
    referral.journeyMetrics.completedAt = now;
    referral.journeyMetrics.arrivalToCompletionMinutes = arrivalToCompletionMinutes;
    referral.statusHistory.push({
      fromStatus: prev,
      toStatus: 'COMPLETED',
      reason: outcomeSummary || 'Patient treatment course successfully completed',
      changedBy: userId,
      timestamp: now
    });

    await referral.save();
    return referral;
  }

  async rejectReferral(referralId, { reason, alternativeHospitalIds = [] }, userId, receivingHospitalId) {
    const referral = await Referral.findOne({ _id: referralId, receivingHospitalId });
    if (!referral) {
      const err = new Error('Referral not found.');
      err.code = 'RESOURCE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const prev = referral.status;
    referral.status = 'REJECTED';
    referral.alternativeHospitals = alternativeHospitalIds.map((hId) => ({
      hospitalId: hId,
      suggestedReason: 'Alternative facility with reported bed/specialty capacity'
    }));

    referral.statusHistory.push({
      fromStatus: prev,
      toStatus: 'REJECTED',
      reason: reason || 'Capacity or resource limitation at receiving hospital',
      changedBy: userId,
      timestamp: new Date()
    });

    await referral.save();
    return referral;
  }

  async getHospitalReferrals(hospitalId, type = 'incoming') {
    const query = type === 'incoming'
      ? { receivingHospitalId: hospitalId }
      : { referringHospitalId: hospitalId };

    return Referral.find(query)
      .populate('patientProfileId', 'fullName dateOfBirth gender phone')
      .populate('referringHospitalId', 'name address phone')
      .populate('receivingHospitalId', 'name address phone')
      .populate('referringDoctorId', 'name specialty')
      .sort({ createdAt: -1 })
      .lean();
  }
}

module.exports = new ReferralService();
