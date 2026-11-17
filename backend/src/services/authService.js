const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const PatientProfile = require('../models/PatientProfile');
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
      expiresIn: 900 // 15 minutes
    };
  }

  async register({ email, phone, password, role = 'patient', hospitalId = null, fullName = '' }) {
    const existing = await User.findOne({ email });
    if (existing) {
      const err = new Error('An account with this email address already exists.');
      err.code = 'EMAIL_EXISTS';
      err.statusCode = 409;
      throw err;
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
        fullName: fullName || email.split('@')[0],
        dateOfBirth: new Date('1990-01-01'),
        gender: 'other',
        phone: user.phone,
        relationship: 'self',
        isDefault: true
      });
    }

    const tokens = await this.generateTokens(user);

    await AuditLog.create({
      eventType: 'USER_REGISTERED',
      actorId: user._id,
      actorRole: user.role,
      resourceType: 'User',
      resourceId: user._id.toString(),
      action: 'REGISTER',
      status: 'EXECUTED'
    });

    return {
      user: {
        id: user._id,
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

    return {
      user: {
        id: user._id,
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
