const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middlewares/authMiddleware');
const idempotencyMiddleware = require('../middlewares/idempotencyMiddleware');

router.use(authMiddleware);

router.post('/hold', (req, res, next) => bookingController.holdSlot(req, res, next));
router.post('/confirm', idempotencyMiddleware, (req, res, next) => bookingController.confirmBooking(req, res, next));
router.get('/reference/:ref', (req, res, next) => bookingController.getBookingByReference(req, res, next));
router.get('/my-bookings', (req, res, next) => bookingController.getMyBookings(req, res, next));
router.post('/:id/cancel', (req, res, next) => bookingController.cancelBooking(req, res, next));
router.post('/:id/reschedule', (req, res, next) => bookingController.rescheduleBooking(req, res, next));

module.exports = router;
