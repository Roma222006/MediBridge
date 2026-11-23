const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const authMiddleware = require('../middlewares/authMiddleware');
const rbacMiddleware = require('../middlewares/rbacMiddleware');

router.use(authMiddleware);

// Create referral (Doctor ONLY)
router.post(
  '/',
  rbacMiddleware('doctor'),
  (req, res, next) => referralController.createReferral(req, res, next)
);

// List referrals for hospital
router.get(
  '/',
  rbacMiddleware('doctor', 'hospital_admin'),
  (req, res, next) => referralController.getReferrals(req, res, next)
);

// List referrals for current authenticated patient
router.get('/my-referrals', (req, res, next) =>
  referralController.getMyReferrals(req, res, next)
);

// State transitions
router.patch('/:id/receive', rbacMiddleware('doctor', 'hospital_admin'), (req, res, next) =>
  referralController.receiveReferral(req, res, next)
);

router.patch('/:id/review', rbacMiddleware('doctor', 'hospital_admin'), (req, res, next) =>
  referralController.reviewReferral(req, res, next)
);

router.patch('/:id/accept', rbacMiddleware('doctor', 'hospital_admin'), (req, res, next) =>
  referralController.acceptReferral(req, res, next)
);

router.patch('/:id/confirm', (req, res, next) =>
  referralController.patientConfirm(req, res, next)
);

router.patch('/:id/arrive', rbacMiddleware('doctor', 'hospital_admin'), (req, res, next) =>
  referralController.markPatientArrived(req, res, next)
);

router.patch('/:id/complete', rbacMiddleware('doctor', 'hospital_admin'), (req, res, next) =>
  referralController.completeReferral(req, res, next)
);

router.patch('/:id/reject', rbacMiddleware('doctor', 'hospital_admin'), (req, res, next) =>
  referralController.rejectReferral(req, res, next)
);

router.patch('/:id/withdraw', rbacMiddleware('doctor', 'patient'), (req, res, next) =>
  referralController.withdrawReferral(req, res, next)
);

module.exports = router;
