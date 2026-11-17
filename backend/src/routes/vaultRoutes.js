const express = require('express');
const multer = require('multer');
const router = express.Router();
const vaultController = require('../controllers/vaultController');
const authMiddleware = require('../middlewares/authMiddleware');
const tenantGuard = require('../middlewares/tenantGuard');

// Configure Multer for in-memory upload handling with 10MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('Only PDF, JPG, and PNG files are permitted.');
      err.code = 'INVALID_MIME_TYPE';
      err.statusCode = 400;
      cb(err, false);
    }
  }
});

// Ephemeral 60s Token Download Route (public endpoint protected by signed JWT token)
router.get('/files/download', (req, res, next) =>
  vaultController.downloadFile(req, res, next)
);

// Protected Vault Routes
router.use(authMiddleware);
router.use(tenantGuard({ isVaultRoute: true }));

router.post('/upload', upload.single('file'), (req, res, next) =>
  vaultController.upload(req, res, next)
);

router.post('/consent', (req, res, next) =>
  vaultController.grantConsent(req, res, next)
);

router.patch('/consent/:id/revoke', (req, res, next) =>
  vaultController.revokeConsent(req, res, next)
);

router.get('/records', (req, res, next) =>
  vaultController.getRecords(req, res, next)
);

router.get('/records/:id/download-url', (req, res, next) =>
  vaultController.requestDownloadUrl(req, res, next)
);

router.delete('/records/:id', (req, res, next) =>
  vaultController.deleteRecord(req, res, next)
);

router.get('/access-logs', (req, res, next) =>
  vaultController.getAccessLogs(req, res, next)
);

router.get('/consents', (req, res, next) =>
  vaultController.getConsents(req, res, next)
);

module.exports = router;
