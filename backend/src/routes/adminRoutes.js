const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const rbacMiddleware = require('../middlewares/rbacMiddleware');
const tenantGuard = require('../middlewares/tenantGuard');

router.use(authMiddleware);
router.use(rbacMiddleware('hospital_admin', 'super_admin'));
router.use(tenantGuard());

router.get('/overview', (req, res, next) => adminController.getOverview(req, res, next));
router.post('/slots', (req, res, next) => adminController.createSlot(req, res, next));
router.get('/slots', (req, res, next) => adminController.getSlots(req, res, next));
router.post('/services', (req, res, next) => adminController.createService(req, res, next));
router.get('/services', (req, res, next) => adminController.getServices(req, res, next));
router.get('/audit-logs', (req, res, next) => adminController.getAuditLogs(req, res, next));

module.exports = router;
