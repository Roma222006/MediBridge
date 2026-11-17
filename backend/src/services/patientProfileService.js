const PatientProfile = require('../models/PatientProfile');
const AuditLog = require('../models/AuditLog');

class PatientProfileService {
  async createProfile(userId, profileData) {
    if (profileData.isDefault) {
      await PatientProfile.updateMany({ userId }, { $set: { isDefault: false } });
    }

    const profile = await PatientProfile.create({
      ...profileData,
      userId
    });

    await AuditLog.create({
      eventType: 'PATIENT_PROFILE_CREATED',
      actorId: userId,
      resourceType: 'PatientProfile',
      resourceId: profile._id.toString(),
      action: 'CREATE',
      status: 'EXECUTED'
    });

    return profile;
  }

  async getProfiles(userId) {
    return PatientProfile.find({ userId }).sort({ isDefault: -1, createdAt: 1 });
  }

  async getProfileById(userId, profileId) {
    const profile = await PatientProfile.findOne({ _id: profileId, userId });
    if (!profile) {
      const err = new Error('Patient profile not found or access denied.');
      err.code = 'PROFILE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    return profile;
  }

  async updateProfile(userId, profileId, updates) {
    if (updates.isDefault) {
      await PatientProfile.updateMany({ userId }, { $set: { isDefault: false } });
    }

    delete updates.userId; // Prevent transferring ownership

    const profile = await PatientProfile.findOneAndUpdate(
      { _id: profileId, userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!profile) {
      const err = new Error('Patient profile not found or access denied.');
      err.code = 'PROFILE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    await AuditLog.create({
      eventType: 'PATIENT_PROFILE_UPDATED',
      actorId: userId,
      resourceType: 'PatientProfile',
      resourceId: profile._id.toString(),
      action: 'UPDATE',
      status: 'EXECUTED'
    });

    return profile;
  }

  async deleteProfile(userId, profileId) {
    const profile = await PatientProfile.findOneAndDelete({ _id: profileId, userId });
    if (!profile) {
      const err = new Error('Patient profile not found or access denied.');
      err.code = 'PROFILE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    await AuditLog.create({
      eventType: 'PATIENT_PROFILE_DELETED',
      actorId: userId,
      resourceType: 'PatientProfile',
      resourceId: profile._id.toString(),
      action: 'DELETE',
      status: 'EXECUTED'
    });

    return { success: true };
  }
}

module.exports = new PatientProfileService();
