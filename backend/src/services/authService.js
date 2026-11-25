const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const PatientProfile = require('../models/PatientProfile');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const AuditLog = require('../models/AuditLog');

class AuthService {
  async generateTokens(user, familyId = null) {
    const famId = familyId || uuidv4();
    const tokenVersion = user.tokenVersion || 0;

    const accessToken = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        hospitalId: user.hospitalId || null,
        tokenVersion
      },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiresIn }
    );

    const refreshTokenValue = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshExpiresInDays);

    await RefreshToken.create({
      token: refreshTokenValue,
      userId: user._id,
      familyId: famId,
      expiresAt
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: 30 * 24 * 3600 // 30 days persistent session
    };
  }

  async register({ email, phone, password, role = 'patient', hospitalId = null, fullName = '', ...extra }) {
    const rawName = fullName || extra.name || '';
    const existing = await User.findOne({ email });
    if (existing) {
      const err = new Error('An account with this email address already exists.');
      err.code = 'EMAIL_EXISTS';
      err.statusCode = 409;
      throw err;
    }

    // Security Gate: Super Admin registration requires Master Platform Activation Key
    if (role === 'super_admin') {
      const validKey = process.env.MEDIBRIDGE_SUPERADMIN_KEY || 'MEDIBRIDGE_SUPERADMIN_SECURE_2026';
      if (!extra.platformKey || extra.platformKey.trim() !== validKey) {
        const err = new Error('Access Denied: Invalid Master Platform Activation Key for Super Administrator provisioning.');
        err.code = 'SUPERADMIN_KEY_INVALID';
        err.statusCode = 403;
        throw err;
      }
    }

    const user = await User.create({
      email,
      phone,
      password,
      role,
      hospitalId: (role === 'doctor' || role === 'hospital_admin') ? hospitalId : null
    });

    // Auto-create a self-profile if the user is a patient
    if (role === 'patient') {
      await PatientProfile.create({
        userId: user._id,
        fullName: rawName || email.split('@')[0],
        dateOfBirth: new Date('1990-01-01'),
        gender: 'other',
        phone: user.phone,
        relationship: 'self',
        isDefault: true
      });
    }

    // Role: Doctor - Create Doctor directory profile & verification request
    if (role === 'doctor') {
      let hId = hospitalId;
      if (!hId) {
        const defaultHospital = await Hospital.findOne();
        hId = defaultHospital ? defaultHospital._id : null;
      }
      user.hospitalId = hId;
      await user.save();

      const docDetails = extra.doctorDetails || {};
      const finalDocName = rawName ? (rawName.startsWith('Dr.') ? rawName : `Dr. ${rawName}`) : `Dr. ${email.split('@')[0]}`;
      const specialty = extra.specialty || docDetails.specialization || docDetails.specialty || 'General Medicine';
      const qualifications = extra.qualifications || docDetails.qualifications || 'MBBS, MD';
      const regNumber = extra.regNumber || docDetails.registrationNumber || docDetails.regNumber || `TNMC/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`;
      const department = extra.department || docDetails.department || specialty || 'General Medicine';
      const consultationFee = extra.consultationFee || docDetails.consultationFee ? Number(extra.consultationFee || docDetails.consultationFee) : 500;

      await Doctor.create({
        userId: user._id,
        hospitalId: hId,
        name: finalDocName,
        specialty,
        qualifications,
        regNumber,
        department,
        consultationFee,
        verificationStatus: 'UNDER_REVIEW',
        reviewStage: 'HOSPITAL_STAGE'
      });
    }

    // Role: Hospital Admin - Link or register hospital
    if (role === 'hospital_admin') {
      let hId = hospitalId;
      if (!hId && extra.hospitalName) {
        let existingHosp = await Hospital.findOne({ name: extra.hospitalName.trim() });
        if (!existingHosp) {
          existingHosp = await Hospital.create({
            name: extra.hospitalName.trim(),
            licenseNumber: extra.licenseNumber || `LIC-TN-CBE-${Math.floor(100 + Math.random() * 900)}`,
            type: extra.hospitalType || 'private',
            location: { type: 'Point', coordinates: [76.9558, 11.0168] },
            address: {
              street: extra.street || 'Hospital Boulevard',
              area: extra.area || 'Peelamedu',
              city: extra.city || 'Coimbatore',
              district: extra.district || 'Coimbatore',
              state: 'Tamil Nadu',
              pincode: extra.pincode || '641014'
            },
            phone: phone,
            email: email
          });
        }
        hId = existingHosp._id;
      }
      if (hId) {
        user.hospitalId = hId;
        await user.save();
      }
    }

    const tokens = await this.generateTokens(user);

    await AuditLog.create({
      eventType: 'USER_REGISTERED',
      actorId: user._id,
      actorRole: user.role,
      resourceType: 'User',
      resourceId: user._id.toString(),
      action: 'REGISTER',
      status: 'EXECUTED',
      metadata: {
        role,
        email,
        fullName: fullName || null,
        hospitalId: user.hospitalId || null
      }
    });

    let resolvedName = user.email.split('@')[0];
    if (user.role === 'patient') {
      const profile = (await PatientProfile.findOne({ userId: user._id, isDefault: true })) || (await PatientProfile.findOne({ userId: user._id }));
      if (profile && profile.fullName) {
        resolvedName = profile.fullName;
      }
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (doctor && doctor.name) {
        resolvedName = doctor.name;
      }
    } else if (user.role === 'super_admin') {
      resolvedName = 'Super Administrator';
    } else if (user.role === 'hospital_admin') {
      resolvedName = 'Hospital Administrator';
    }

    return {
      user: {
        id: user._id,
        _id: user._id,
        name: resolvedName,
        fullName: resolvedName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        hospitalId: user.hospitalId
      },
      tokens
    };
  }

  async login({ email, password, ipAddress = null, userAgent = null }) {
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.code = 'INVALID_CREDENTIALS';
      err.statusCode = 401;
      throw err;
    }

    if (user.isLocked()) {
      const remainingMin = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      const err = new Error(
        `Account temporarily locked due to excessive failed attempts. Please try again in ${remainingMin} minute(s).`
      );
      err.code = 'ACCOUNT_LOCKED';
      err.statusCode = 429;
      throw err;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      await AuditLog.create({
        eventType: 'LOGIN_FAILED',
        actorId: user._id,
        actorRole: user.role,
        resourceType: 'User',
        resourceId: user._id.toString(),
        action: 'LOGIN',
        status: 'DENIED',
        ipAddress,
        userAgent
      });
      const err = new Error('Invalid email or password.');
      err.code = 'INVALID_CREDENTIALS';
      err.statusCode = 401;
      throw err;
    }

    // Reset lockout counters on successful credentials
    await user.resetLoginLock();

    const tokens = await this.generateTokens(user);

    await AuditLog.create({
      eventType: 'LOGIN_SUCCESS',
      actorId: user._id,
      actorRole: user.role,
      resourceType: 'User',
      resourceId: user._id.toString(),
      action: 'LOGIN',
      status: 'ALLOWED',
      ipAddress,
      userAgent
    });

    let resolvedName = user.email.split('@')[0];
    if (user.role === 'patient') {
      const profile = (await PatientProfile.findOne({ userId: user._id, isDefault: true })) || (await PatientProfile.findOne({ userId: user._id }));
      if (profile && profile.fullName) {
        resolvedName = profile.fullName;
      }
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (doctor && doctor.name) {
        resolvedName = doctor.name;
      }
    } else if (user.role === 'super_admin') {
      resolvedName = 'Super Administrator';
    } else if (user.role === 'hospital_admin') {
      resolvedName = 'Hospital Administrator';
    }

    return {
      user: {
        id: user._id,
        _id: user._id,
        name: resolvedName,
        fullName: resolvedName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        hospitalId: user.hospitalId
      },
      tokens
    };
  }

  async rotateRefreshToken(tokenValue) {
    if (!tokenValue) {
      const err = new Error('Refresh token is required.');
      err.code = 'TOKEN_REQUIRED';
      err.statusCode = 400;
      throw err;
    }

    const tokenDoc = await RefreshToken.findOne({ token: tokenValue });
    if (!tokenDoc) {
      const err = new Error('Invalid refresh token.');
      err.code = 'INVALID_TOKEN';
      err.statusCode = 401;
      throw err;
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user || !user.isActive) {
      const err = new Error('User not found or inactive.');
      err.code = 'USER_INACTIVE';
      err.statusCode = 401;
      throw err;
    }

    // REUSE DETECTION:
    // If token was already revoked, someone is reusing an old token!
    // Revoke the entire token family immediately and invalidate all active sessions.
    if (tokenDoc.isRevoked) {
      await RefreshToken.updateMany(
        { familyId: tokenDoc.familyId },
        { $set: { isRevoked: true } }
      );
      // Invalidate current JWT sessions by incrementing tokenVersion
      await User.findByIdAndUpdate(user._id, { $inc: { tokenVersion: 1 } });

      await AuditLog.create({
        eventType: 'TOKEN_REUSE_DETECTED',
        actorId: user._id,
        actorRole: user.role,
        resourceType: 'RefreshToken',
        resourceId: tokenDoc._id.toString(),
        action: 'REFRESH_TOKEN',
        status: 'DENIED',
        reason: 'Attempted reuse of revoked refresh token. Entire family invalidated.'
      });

      const err = new Error('Security alert: Refresh token reuse detected. All sessions revoked.');
      err.code = 'TOKEN_REUSE_DETECTED';
      err.statusCode = 401;
      throw err;
    }

    // Check expiration
    if (tokenDoc.expiresAt < new Date()) {
      const err = new Error('Refresh token has expired.');
      err.code = 'TOKEN_EXPIRED';
      err.statusCode = 401;
      throw err;
    }

    // Revoke current token and generate new pair within the same family
    tokenDoc.isRevoked = true;
    await tokenDoc.save();

    const newTokens = await this.generateTokens(user, tokenDoc.familyId);
    return newTokens;
  }

  async logout(tokenValue) {
    if (tokenValue) {
      await RefreshToken.updateOne({ token: tokenValue }, { $set: { isRevoked: true } });
    }
    return { success: true };
  }

  async revokeAllSessions(userId) {
    await RefreshToken.updateMany({ userId }, { $set: { isRevoked: true } });
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { tokenVersion: 1 } },
      { new: true }
    );
    await AuditLog.create({
      eventType: 'ALL_SESSIONS_REVOKED',
      actorId: userId,
      resourceType: 'User',
      resourceId: userId.toString(),
      action: 'REVOKE_SESSIONS',
      status: 'EXECUTED'
    });
    return updatedUser;
  }

  async getMe(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      const err = new Error('User not found.');
      err.code = 'NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    return user;
  }
}

module.exports = new AuthService();
