const bookingService = require('../services/bookingService');

class BookingController {
  async holdSlot(req, res, next) {
    try {
      const { slotId, patientProfileId } = req.body;
      if (!slotId || !patientProfileId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'slotId and patientProfileId are required.' }
        });
      }

      const result = await bookingService.holdSlot({
        slotId,
        patientProfileId,
        userId: req.user._id
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async confirmBooking(req, res, next) {
    try {
      const { slotId, patientProfileId, schemeApplied } = req.body;
      if (!slotId || !patientProfileId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'slotId and patientProfileId are required.' }
        });
      }

      const io = req.app.get('io');
      const result = await bookingService.confirmBooking({
        slotId,
        patientProfileId,
        schemeApplied,
        userId: req.user._id,
        io
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getBookingByReference(req, res, next) {
    try {
      const { ref } = req.params;
      const appointment = await bookingService.getBookingByReference(
        ref,
        req.user._id,
        req.user.role,
        req.user.hospitalId
      );

      res.json({
        success: true,
        data: appointment
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyBookings(req, res, next) {
    try {
      const bookings = await bookingService.getPatientBookings(req.user._id);
      res.json({
        success: true,
        data: bookings
      });
    } catch (err) {
      next(err);
    }
  }

  async cancelBooking(req, res, next) {
    try {
      const io = req.app.get('io');
      const appointment = await bookingService.cancelBooking({
        appointmentId: req.params.id,
        reason: req.body.reason,
        userId: req.user._id,
        io
      });

      res.json({
        success: true,
        message: 'Appointment cancelled successfully.',
        data: appointment
      });
    } catch (err) {
      next(err);
    }
  }

  async rescheduleBooking(req, res, next) {
    try {
      const { newSlotId } = req.body;
      if (!newSlotId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_SLOT', message: 'newSlotId is required to reschedule.' }
        });
      }

      const io = req.app.get('io');
      const appointment = await bookingService.rescheduleBooking({
        appointmentId: req.params.id,
        newSlotId,
        userId: req.user._id,
        io
      });

      res.json({
        success: true,
        message: 'Appointment rescheduled successfully.',
        data: appointment
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BookingController();
