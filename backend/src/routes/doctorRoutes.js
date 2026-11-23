const express = require('express');
const multer = require('multer');
const router = express.Router();
const doctorPortalController = require('../controllers/doctorPortalController');
const authMiddleware = require('../middlewares/authMiddleware');
const rbacMiddleware = require('../middlewares/rbacMiddleware');
const tenantGuard = require('../middlewares/tenantGuard');

// Multer memory storage with 10MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('Only PDF, JPG, and PNG files are permitted for credential documents.');
      err.code = 'INVALID_MIME_TYPE';
      err.statusCode = 400;
      cb(err, false);
    }
  }
});

// Ephemeral 60s Token Download Route (public endpoint validated by signed JWT token)
router.get('/documents/download', (req, res, next) =>
  doctorPortalController.downloadDocument(req, res, next)
);

router.use(authMiddleware);
router.use(rbacMiddleware('doctor'));
router.use(tenantGuard());

router.get('/profile', (req, res, next) => doctorPortalController.getProfile(req, res, next));
router.patch('/profile', (req, res, next) => doctorPortalController.updateProfile(req, res, next));
router.post('/documents', upload.single('file'), (req, res, next) =>
  doctorPortalController.uploadCredentialDocument(req, res, next)
);
router.get('/documents', (req, res, next) =>
  doctorPortalController.getCredentialDocuments(req, res, next)
);
router.get('/documents/:id/download-url', (req, res, next) =>
  doctorPortalController.requestDocumentDownloadUrl(req, res, next)
);
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
