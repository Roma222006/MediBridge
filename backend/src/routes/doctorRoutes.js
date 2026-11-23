const express = require('express');
const router = express.Router();
const doctorPortalController = require('../controllers/doctorPortalController');
const authMiddleware = require('../middlewares/authMiddleware');
const rbacMiddleware = require('../middlewares/rbacMiddleware');
const tenantGuard = require('../middlewares/tenantGuard');

router.use(authMiddleware);
router.use(rbacMiddleware('doctor'));
router.use(tenantGuard());

router.get('/profile', (req, res, next) => doctorPortalController.getProfile(req, res, next));
router.get('/schedule', (req, res, next) => doctorPortalController.getSchedule(req, res, next));
router.get('/slots', (req, res, next) => doctorPortalController.getSlots(req, res, next));
router.post('/leave-request', (req, res, next) =>
  doctorPortalController.submitLeaveRequest(req, res, next)
);
router.get('/leave-requests', (req, res, next) =>
  doctorPortalController.getLeaveRequests(req, res, next)
);
router.patch('/appointments/:id/status', (req, res, next) =>
  doctorPortalController.updateAppointmentStatus(req, res, next)
);
router.get('/notifications', (req, res, next) =>
  doctorPortalController.getNotifications(req, res, next)
);
router.patch('/notifications/:id/read', (req, res, next) =>
  doctorPortalController.markNotificationRead(req, res, next)
);
router.get('/referrals', (req, res, next) => doctorPortalController.getSpecialtyReferrals(req, res, next));

module.exports = router;
