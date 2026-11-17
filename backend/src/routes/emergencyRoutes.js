const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');

// All emergency endpoints are public (zero auth, works without login)
router.get('/nearest', (req, res, next) =>
  emergencyController.getNearestHospitals(req, res, next)
);

router.get('/offline-bundle', (req, res, next) =>
  emergencyController.getOfflineBundle(req, res, next)
);

module.exports = router;
