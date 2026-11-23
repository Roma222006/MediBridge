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

router.get('/session/:appointmentId/notes', (req, res, next) =>
  teleconsultController.getNotes(req, res, next)
);

router.post('/session/:appointmentId/notes', (req, res, next) =>
  teleconsultController.saveNotes(req, res, next)
);

router.post('/session/:appointmentId/end', (req, res, next) =>
  teleconsultController.endSession(req, res, next)
);

module.exports = router;
