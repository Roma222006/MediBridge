const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const authMiddleware = require('../middlewares/authMiddleware');
const rbacMiddleware = require('../middlewares/rbacMiddleware');
const tenantGuard = require('../middlewares/tenantGuard');

// Public availability search endpoints
router.get('/', (req, res, next) => searchController.search(req, res, next));
router.get('/slots', (req, res, next) => searchController.getSlots(req, res, next));
router.get('/hospitals/:id', (req, res, next) => searchController.getHospitalDetails(req, res, next));

// Hospital admin bed capacity update (protected & tenant-isolated)
router.patch(
  '/hospitals/:id/bed-capacity',
  authMiddleware,
  rbacMiddleware('hospital_admin', 'super_admin'),
  tenantGuard(),
  (req, res, next) => searchController.updateBedCapacity(req, res, next)
);

module.exports = router;
