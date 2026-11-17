const authService = require('../services/authService');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, phone, password, role, hospitalId, fullName } = req.body;
      if (!email || !phone || !password) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'Email, phone, and password are required.' }
        });
      }

      const result = await authService.register({
        email,
        phone,
        password,
        role,
        hospitalId,
        fullName
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'Email and password are required.' }
        });
      }

      const result = await authService.login({
        email,
        password,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.rotateRefreshToken(refreshToken);
      res.json({
        success: true,
        data: tokens
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.json({
        success: true,
        message: 'Logged out successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  async revokeAllSessions(req, res, next) {
    try {
      await authService.revokeAllSessions(req.user._id);
      res.json({
        success: true,
        message: 'All active sessions have been invalidated.'
      });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user._id);
      res.json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
