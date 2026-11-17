const express = require('express');
const router = express.Router();
const patientProfileController = require('../controllers/patientProfileController');
const authMiddleware = require('../middlewares/authMiddleware');
const rbacMiddleware = require('../middlewares/rbacMiddleware');

router.use(authMiddleware);
router.use(rbacMiddleware('patient', 'super_admin'));

router.post('/', (req, res, next) => patientProfileController.createProfile(req, res, next));
router.get('/', (req, res, next) => patientProfileController.getProfiles(req, res, next));
router.get('/:id', (req, res, next) => patientProfileController.getProfileById(req, res, next));
router.put('/:id', (req, res, next) => patientProfileController.updateProfile(req, res, next));
router.delete('/:id', (req, res, next) => patientProfileController.deleteProfile(req, res, next));

module.exports = router;
