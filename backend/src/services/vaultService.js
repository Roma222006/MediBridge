const HealthRecord = require('../models/HealthRecord');
const ConsentArtifact = require('../models/ConsentArtifact');
const PatientAccessLog = require('../models/PatientAccessLog');
const PatientProfile = require('../models/PatientProfile');
const Doctor = require('../models/Doctor');
const vaultStorageService = require('./vaultStorageService');

class VaultService {
  async uploadRecord({ patientProfileId, title, category, file, userId, ipAddress }) {
    const profile = await PatientProfile.findOne({ _id: patientProfileId, userId });
    if (!profile) {
      const err = new Error('Patient profile not found or does not belong to your account.');
      err.code = 'PROFILE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    if (!file || !file.buffer) {
      const err = new Error('No file attached for upload.');
      err.code = 'FILE_REQUIRED';
      err.statusCode = 400;
      throw err;
    }

    // Save physical file with magic byte check & SHA-256 calculation
    const storageResult = vaultStorageService.saveFile(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    // Check for previous version if same title exists
    const previousRecord = await HealthRecord.findOne({
      patientProfileId,
      title,
      isDeleted: false
    }).sort({ version: -1 });

    const newVersion = previousRecord ? previousRecord.version + 1 : 1;

    const record = await HealthRecord.create({
      patientProfileId,
      ownerUserId: userId,
      title,
      category: category || 'lab_report',
      fileKey: storageResult.fileKey,
      fileName: file.originalname,
      mimeType: storageResult.mimeType,
      fileSizeBytes: storageResult.fileSizeBytes,
      sha256Hash: storageResult.sha256Hash,
      version: newVersion,
      previousVersionRecordId: previousRecord ? previousRecord._id : null
    });

    await PatientAccessLog.create({
      patientProfileId,
      healthRecordId: record._id,
      actorId: userId,
      actorRole: 'patient',
      actorName: profile.fullName,
      action: 'UPLOAD_RECORD',
      accessGranted: true,
      clinicalPurpose: 'Patient uploaded record to health vault',
      ipAddress
    });

    return record;
  }

  async grantConsent({
    patientProfileId,
    doctorId,
    allowedRecordIds = [],
    purpose,
    durationHours = 24,
    userId,
    ipAddress
  }) {
    const profile = await PatientProfile.findOne({ _id: patientProfileId, userId });
    if (!profile) {
      const err = new Error('Patient profile not found or access denied.');
      err.code = 'PROFILE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      const err = new Error('Doctor not found.');
      err.code = 'DOCTOR_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    const consent = await ConsentArtifact.create({
      patientProfileId,
      ownerUserId: userId,
      grantedToDoctorId: doctor._id,
      grantedToHospitalId: doctor.hospitalId,
      allowedRecordIds,
      purpose,
      status: 'ACTIVE',
      expiresAt
    });

    await PatientAccessLog.create({
      patientProfileId,
      consentArtifactId: consent._id,
      actorId: userId,
      actorRole: 'patient',
      actorName: profile.fullName,
      action: 'GRANT_CONSENT',
      accessGranted: true,
      clinicalPurpose: `Granted ${durationHours}h access to ${doctor.name} for: ${purpose}`,
      ipAddress
    });

    return consent;
  }

  async revokeConsent({ consentId, reason = 'Patient revoked consent', userId, ipAddress }) {
    const consent = await ConsentArtifact.findOne({ _id: consentId, ownerUserId: userId });
    if (!consent) {
      const err = new Error('Consent record not found.');
      err.code = 'CONSENT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    consent.status = 'REVOKED';
    consent.revokedAt = new Date();
    consent.revocationReason = reason;
    await consent.save();

    await PatientAccessLog.create({
      patientProfileId: consent.patientProfileId,
      consentArtifactId: consent._id,
      actorId: userId,
      actorRole: 'patient',
      action: 'REVOKE_CONSENT',
      accessGranted: true,
      clinicalPurpose: `Consent revoked: ${reason}`,
      ipAddress
    });

    return consent;
  }

  async getPatientRecords(patientProfileId, user, doctorId = null, ipAddress = null) {
    if (user.role === 'hospital_admin' || user.role === 'super_admin') {
      const err = new Error('Administrators are strictly prohibited from viewing patient clinical records.');
      err.code = 'VAULT_ACCESS_PROHIBITED';
      err.statusCode = 403;
      throw err;
    }

    if (user.role === 'patient') {
      const profile = await PatientProfile.findOne({ _id: patientProfileId, userId: user._id });
      if (!profile) {
        const err = new Error('Patient profile not found.');
        err.code = 'PROFILE_NOT_FOUND';
        err.statusCode = 404;
        throw err;
      }

      return HealthRecord.find({ patientProfileId, isDeleted: false }).sort({ createdAt: -1 });
    }

    // Role is doctor: must verify active unexpired consent
    const activeConsent = await ConsentArtifact.findOne({
      patientProfileId,
      grantedToDoctorId: doctorId,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() },
      revokedAt: null
    });

    if (!activeConsent) {
      await PatientAccessLog.create({
        patientProfileId,
        actorId: user._id,
        actorRole: 'doctor',
        action: 'VIEW_METADATA',
        accessGranted: false,
        denialReason: 'No active or unexpired consent found for this doctor',
        ipAddress
      });

      const err = new Error('Access denied. No active, unexpired consent granted by patient.');
      err.code = 'CONSENT_REQUIRED_OR_REVOKED';
      err.statusCode = 403;
      throw err;
    }

    // Filter records if consent specifies specific allowedRecordIds
    const query = { patientProfileId, isDeleted: false };
    if (activeConsent.allowedRecordIds && activeConsent.allowedRecordIds.length > 0) {
      query._id = { $in: activeConsent.allowedRecordIds };
    }

    const records = await HealthRecord.find(query).sort({ createdAt: -1 });

    const doctor = await Doctor.findById(doctorId);
    await PatientAccessLog.create({
      patientProfileId,
      consentArtifactId: activeConsent._id,
      actorId: user._id,
      actorRole: 'doctor',
      actorName: doctor?.name || 'Doctor',
      action: 'VIEW_METADATA',
      accessGranted: true,
      clinicalPurpose: activeConsent.purpose,
      ipAddress
    });

    return records;
  }

  async requestSignedDownloadUrl({ recordId, user, doctorId = null, ipAddress = null }) {
    if (user.role === 'hospital_admin' || user.role === 'super_admin') {
      const err = new Error('Administrators are strictly prohibited from downloading clinical files.');
      err.code = 'VAULT_ACCESS_PROHIBITED';
      err.statusCode = 403;
      throw err;
    }

    const record = await HealthRecord.findOne({ _id: recordId, isDeleted: false });
    if (!record) {
      const err = new Error('Health record not found.');
      err.code = 'RECORD_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    let consentArtifactId = null;

    if (user.role === 'doctor') {
      const activeConsent = await ConsentArtifact.findOne({
        patientProfileId: record.patientProfileId,
        grantedToDoctorId: doctorId,
        status: 'ACTIVE',
        expiresAt: { $gt: new Date() },
        revokedAt: null
      });

      if (!activeConsent) {
        await PatientAccessLog.create({
          patientProfileId: record.patientProfileId,
          healthRecordId: record._id,
          actorId: user._id,
          actorRole: 'doctor',
          action: 'DOWNLOAD_FILE',
          accessGranted: false,
          denialReason: 'Consent revoked or expired',
          ipAddress
        });

        const err = new Error('Access denied. Active consent required to download patient file.');
        err.code = 'CONSENT_REQUIRED_OR_REVOKED';
        err.statusCode = 403;
        throw err;
      }

      if (
        activeConsent.allowedRecordIds &&
        activeConsent.allowedRecordIds.length > 0 &&
        !activeConsent.allowedRecordIds.some((id) => id.toString() === record._id.toString())
      ) {
        await PatientAccessLog.create({
          patientProfileId: record.patientProfileId,
          healthRecordId: record._id,
          actorId: user._id,
          actorRole: 'doctor',
          action: 'DOWNLOAD_FILE',
          accessGranted: false,
          denialReason: 'Record is outside scope of allowed records in consent artifact',
          ipAddress
        });

        const err = new Error('Access denied. Record is not included in the granted consent.');
        err.code = 'CONSENT_SCOPE_EXCEEDED';
        err.statusCode = 403;
        throw err;
      }

      consentArtifactId = activeConsent._id;

      const doctor = await Doctor.findById(doctorId);
      await PatientAccessLog.create({
        patientProfileId: record.patientProfileId,
        healthRecordId: record._id,
        consentArtifactId,
        actorId: user._id,
        actorRole: 'doctor',
        actorName: doctor?.name || 'Doctor',
        action: 'DOWNLOAD_FILE',
        accessGranted: true,
        clinicalPurpose: activeConsent.purpose,
        ipAddress
      });
    } else {
      // Patient check
      if (record.ownerUserId.toString() !== user._id.toString()) {
        const err = new Error('Access denied. You do not own this record.');
        err.code = 'RESOURCE_NOT_FOUND';
        err.statusCode = 404;
        throw err;
      }

      await PatientAccessLog.create({
        patientProfileId: record.patientProfileId,
        healthRecordId: record._id,
        actorId: user._id,
        actorRole: 'patient',
        action: 'DOWNLOAD_FILE',
        accessGranted: true,
        clinicalPurpose: 'Patient download',
        ipAddress
      });
    }

    // Generate 60-second download token
    const token = vaultStorageService.generateSignedDownloadToken({
      recordId: record._id,
      fileKey: record.fileKey,
      userId: user._id,
      role: user.role
    });

    return {
      downloadUrl: `/api/v1/vault/files/download?token=${token}`,
      expiresInSeconds: 60
    };
  }

  async softDeleteRecord({ recordId, userId, ipAddress }) {
    const record = await HealthRecord.findOne({ _id: recordId, ownerUserId: userId });
    if (!record) {
      const err = new Error('Record not found.');
      err.code = 'RECORD_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    record.isDeleted = true;
    record.deletedAt = new Date();
    await record.save();

    // Invalidate active consents that explicitly granted this record
    await ConsentArtifact.updateMany(
      { allowedRecordIds: record._id, status: 'ACTIVE' },
      { $set: { status: 'REVOKED', revokedAt: new Date(), revocationReason: 'Record deleted by patient' } }
    );

    await PatientAccessLog.create({
      patientProfileId: record.patientProfileId,
      healthRecordId: record._id,
      actorId: userId,
      actorRole: 'patient',
      action: 'DELETE_RECORD',
      accessGranted: true,
      clinicalPurpose: 'Patient soft-deleted record',
      ipAddress
    });

    return { success: true };
  }

  async getPatientAccessLogs(patientProfileId, userId) {
    const profile = await PatientProfile.findOne({ _id: patientProfileId, userId });
    if (!profile) {
      const err = new Error('Patient profile not found.');
      err.code = 'PROFILE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    return PatientAccessLog.find({ patientProfileId })
      .populate('healthRecordId', 'title category fileName')
      .populate('consentArtifactId', 'purpose expiresAt status')
      .sort({ timestamp: -1 })
      .lean();
  }

  async getPatientConsents(patientProfileId, userId) {
    const profile = await PatientProfile.findOne({ _id: patientProfileId, userId });
    if (!profile) {
      const err = new Error('Patient profile not found.');
      err.code = 'PROFILE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    return ConsentArtifact.find({ patientProfileId })
      .populate('grantedToDoctorId', 'name specialty qualifications')
      .populate('grantedToHospitalId', 'name')
      .sort({ createdAt: -1 })
      .lean();
  }
}

module.exports = new VaultService();
