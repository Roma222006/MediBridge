const referralService = require('../services/referralService');

class ReferralController {
  async createReferral(req, res, next) {
    try {
      const {
        patientProfileId,
        receivingHospitalId,
        targetSpecialty,
        clinicalSummary,
        priority,
        initialTeleconsultAppointmentId,
        dedupeKey
      } = req.body;

      if (!patientProfileId || !receivingHospitalId || !targetSpecialty || !clinicalSummary) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'patientProfileId, receivingHospitalId, targetSpecialty, and clinicalSummary are required.' }
        });
      }

      const io = req.app.get('io');
      const referral = await referralService.createReferral({
        patientProfileId,
        referringHospitalId: req.user.hospitalId,
        referringDoctorId: req.user._id,
        receivingHospitalId,
        targetSpecialty,
        clinicalSummary,
        priority,
        initialTeleconsultAppointmentId,
        dedupeKey,
        userId: req.user._id,
        io
      });

      res.status(201).json({
        success: true,
        data: referral
      });
    } catch (err) {
      next(err);
    }
  }

  async getReferrals(req, res, next) {
    try {
      const type = req.query.type || 'incoming';
      const referrals = await referralService.getHospitalReferrals(req.user.hospitalId, type);
      res.json({
        success: true,
        count: referrals.length,
        data: referrals
      });
    } catch (err) {
      next(err);
    }
  }

  async receiveReferral(req, res, next) {
    try {
      const referral = await referralService.receiveReferral(
        req.params.id,
        req.user._id,
        req.user.hospitalId
      );
      res.json({ success: true, data: referral });
    } catch (err) {
      next(err);
    }
  }

  async reviewReferral(req, res, next) {
    try {
      const referral = await referralService.reviewReferral(
        req.params.id,
        req.user._id,
        req.user.hospitalId
      );
      res.json({ success: true, data: referral });
    } catch (err) {
      next(err);
    }
  }

  async acceptReferral(req, res, next) {
    try {
      const io = req.app.get('io');
      const referral = await referralService.acceptReferral(
        req.params.id,
        req.body,
        req.user._id,
        req.user.hospitalId,
        io
      );
      res.json({ success: true, data: referral });
    } catch (err) {
      next(err);
    }
  }

  async patientConfirm(req, res, next) {
    try {
      const referral = await referralService.patientConfirm(req.params.id, req.user._id);
      res.json({ success: true, data: referral });
    } catch (err) {
      next(err);
    }
  }

  async markPatientArrived(req, res, next) {
    try {
      const referral = await referralService.markPatientArrived(
        req.params.id,
        req.user._id,
        req.user.hospitalId
      );
      res.json({ success: true, data: referral });
    } catch (err) {
      next(err);
    }
  }

  async completeReferral(req, res, next) {
    try {
      const referral = await referralService.completeReferral(
        req.params.id,
        req.body,
        req.user._id,
        req.user.hospitalId
      );
      res.json({ success: true, data: referral });
    } catch (err) {
      next(err);
    }
  }

  async rejectReferral(req, res, next) {
    try {
      const referral = await referralService.rejectReferral(
        req.params.id,
        req.body,
        req.user._id,
        req.user.hospitalId
      );
      res.json({ success: true, data: referral });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReferralController();
