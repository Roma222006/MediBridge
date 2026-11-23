const fs = require('fs');
const vaultService = require('../services/vaultService');
const vaultStorageService = require('../services/vaultStorageService');
const Doctor = require('../models/Doctor');

class VaultController {
  async upload(req, res, next) {
    try {
      const { patientProfileId, title, category } = req.body;
      if (!patientProfileId || !title) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'patientProfileId and title are required.' }
        });
      }

      const record = await vaultService.uploadRecord({
        patientProfileId,
        title,
        category,
        file: req.file,
        userId: req.user._id,
        ipAddress: req.ip
      });

      res.status(201).json({
        success: true,
        data: record
      });
    } catch (err) {
      next(err);
    }
  }

  async grantConsent(req, res, next) {
    try {
      const { patientProfileId, doctorId, allowedRecordIds, purpose, durationHours } = req.body;
      if (!patientProfileId || !doctorId || !purpose) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'patientProfileId, doctorId, and purpose are required.' }
        });
      }

      const consent = await vaultService.grantConsent({
        patientProfileId,
        doctorId,
        allowedRecordIds,
        purpose,
        durationHours: durationHours ? parseInt(durationHours, 10) : 24,
        userId: req.user._id,
        ipAddress: req.ip
      });

      res.status(201).json({
        success: true,
        data: consent
      });
    } catch (err) {
      next(err);
    }
  }

  async revokeConsent(req, res, next) {
    try {
      const { reason } = req.body;
      const consent = await vaultService.revokeConsent({
        consentId: req.params.id,
        reason,
        userId: req.user._id,
        ipAddress: req.ip
      });

      const io = req.app.get('io');
      if (io && consent.grantedToDoctorId) {
        io.to(`doctor:${consent.grantedToDoctorId}`).emit('consent_revoked', {
          consentId: consent._id,
          patientProfileId: consent.patientProfileId,
          reason
        });
      }

      res.json({
        success: true,
        message: 'Consent revoked successfully. Immediate effect applied.',
        data: consent
      });
    } catch (err) {
      next(err);
    }
  }

  async getRecords(req, res, next) {
    try {
      const { patientProfileId } = req.query;
      if (!patientProfileId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PARAMS', message: 'patientProfileId query parameter is required.' }
        });
      }

      let doctorId = null;
      if (req.user.role === 'doctor') {
        const doc = await Doctor.findOne({ userId: req.user._id });
        doctorId = doc ? doc._id : null;
      }

      const records = await vaultService.getPatientRecords(
        patientProfileId,
        req.user,
        doctorId,
        req.ip
      );

      res.json({
        success: true,
        count: records.length,
        data: records
      });
    } catch (err) {
      next(err);
    }
  }

  async requestDownloadUrl(req, res, next) {
    try {
      let doctorId = null;
      if (req.user.role === 'doctor') {
        const doc = await Doctor.findOne({ userId: req.user._id });
        doctorId = doc ? doc._id : null;
      }

      const result = await vaultService.requestSignedDownloadUrl({
        recordId: req.params.id,
        user: req.user,
        doctorId,
        ipAddress: req.ip
      });

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async downloadFile(req, res, next) {
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
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  async deleteRecord(req, res, next) {
    try {
      await vaultService.softDeleteRecord({
        recordId: req.params.id,
        userId: req.user._id,
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: 'Record soft-deleted and all linked active consents revoked.'
      });
    } catch (err) {
      next(err);
    }
  }

  async getAccessLogs(req, res, next) {
    try {
      const { patientProfileId } = req.query;
      if (!patientProfileId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PARAMS', message: 'patientProfileId query parameter is required.' }
        });
      }

      const logs = await vaultService.getPatientAccessLogs(patientProfileId, req.user._id);
      res.json({
        success: true,
        count: logs.length,
        data: logs
      });
    } catch (err) {
      next(err);
    }
  }

  async getConsents(req, res, next) {
    try {
      const { patientProfileId } = req.query;
      if (!patientProfileId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PARAMS', message: 'patientProfileId query parameter is required.' }
        });
      }

      const consents = await vaultService.getPatientConsents(patientProfileId, req.user._id);
      res.json({
        success: true,
        count: consents.length,
        data: consents
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VaultController();
