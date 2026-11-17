const express = require('express');
const router = express.Router();
const doctorPortalController = require('../controllers/doctorPortalController');
const authMiddleware = require('../middlewares/authMiddleware');
const rbacMiddleware = require('../middlewares/rbacMiddleware');
const tenantGuard = require('../middlewares/tenantGuard');

router.use(authMiddleware);
router.use(rbacMiddleware('doctor'));
router.use(tenantGuard());

router.get('/schedule', (req, res, next) => doctorPortalController.getSchedule(req, res, next));
router.get('/referrals', (req, res, next) => doctorPortalController.getSpecialtyReferrals(req, res, next));

module.exports = router;
