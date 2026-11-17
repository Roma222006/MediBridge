const express = require('express');
const router = express.Router();
const teleconsultController = require('../controllers/teleconsultController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/session/:appointmentId/join', (req, res, next) =>
  teleconsultController.joinSession(req, res, next)
);

router.get('/session/:appointmentId/status', (req, res, next) =>
  teleconsultController.getSessionStatus(req, res, next)
);

module.exports = router;
