const patientProfileService = require('../services/patientProfileService');

class PatientProfileController {
  async createProfile(req, res, next) {
    try {
      const profile = await patientProfileService.createProfile(req.user._id, req.body);
      res.status(201).json({
        success: true,
        data: profile
      });
    } catch (err) {
      next(err);
    }
  }

  async getProfiles(req, res, next) {
    try {
      const profiles = await patientProfileService.getProfiles(req.user._id);
      res.json({
        success: true,
        data: profiles
      });
    } catch (err) {
      next(err);
    }
  }

  async getProfileById(req, res, next) {
    try {
      const profile = await patientProfileService.getProfileById(req.user._id, req.params.id);
      res.json({
        success: true,
        data: profile
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const profile = await patientProfileService.updateProfile(req.user._id, req.params.id, req.body);
      res.json({
        success: true,
        data: profile
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteProfile(req, res, next) {
    try {
      await patientProfileService.deleteProfile(req.user._id, req.params.id);
      res.json({
        success: true,
        message: 'Patient profile deleted successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PatientProfileController();
