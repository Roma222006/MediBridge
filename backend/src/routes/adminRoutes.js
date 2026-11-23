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
router.get('/leave-requests', (req, res, next) => adminController.getDoctorLeaveRequests(req, res, next));
router.patch('/leave-requests/:id/record', (req, res, next) =>
  adminController.recordDoctorLeaveFromRequest(req, res, next)
);
router.patch('/leave-requests/:id/decline', (req, res, next) =>
  adminController.declineDoctorLeaveRequest(req, res, next)
);

// Doctor Credentialing & Multi-Stage Verification Routes
router.get('/doctors/:doctorId/documents', (req, res, next) =>
  adminController.getDoctorDocuments(req, res, next)
);
router.get('/doctors/:doctorId/documents/:docId/download-url', (req, res, next) =>
  adminController.requestDoctorDocumentDownloadUrl(req, res, next)
);
router.post('/doctors/:doctorId/verify-hospital', (req, res, next) =>
  adminController.verifyDoctorHospitalStage(req, res, next)
);
router.post('/doctors/:doctorId/verify-platform', (req, res, next) =>
  adminController.verifyDoctorPlatformStage(req, res, next)
);
router.post('/doctors/:doctorId/request-info', (req, res, next) =>
  adminController.requestDoctorAdditionalInfo(req, res, next)
);
router.post('/doctors/:doctorId/reject', (req, res, next) =>
  adminController.rejectDoctorVerification(req, res, next)
);

module.exports = router;
