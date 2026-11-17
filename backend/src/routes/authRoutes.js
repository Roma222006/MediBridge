const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/refresh-token', (req, res, next) => authController.refreshToken(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));

// Protected routes
router.use(authMiddleware);
router.get('/me', (req, res, next) => authController.getMe(req, res, next));
router.post('/revoke-all-sessions', (req, res, next) => authController.revokeAllSessions(req, res, next));

module.exports = router;
