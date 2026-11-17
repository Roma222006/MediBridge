const express = require('express');
const router = express.Router();
const reassignmentController = require('../controllers/reassignmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const rbacMiddleware = require('../middlewares/rbacMiddleware');
const tenantGuard = require('../middlewares/tenantGuard');

router.use(authMiddleware);

// Record doctor leave (Hospital Admin)
router.post(
  '/leave',
  rbacMiddleware('hospital_admin', 'super_admin'),
  tenantGuard(),
  (req, res, next) => reassignmentController.recordLeave(req, res, next)
);

// Resolve reassignment (Patient)
router.post('/resolve/:id', (req, res, next) =>
  reassignmentController.resolveReassignment(req, res, next)
);

// Patient pending reassignments list
router.get('/pending', (req, res, next) =>
  reassignmentController.getMyPendingReassignments(req, res, next)
);

module.exports = router;
