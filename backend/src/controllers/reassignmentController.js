const reassignmentService = require('../services/reassignmentService');

class ReassignmentController {
  async recordLeave(req, res, next) {
    try {
      const { doctorId, startDate, endDate, startTime, endTime, reason } = req.body;
      if (!doctorId || !startDate || !endDate || !reason) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'doctorId, startDate, endDate, and reason are required.' }
        });
      }

      const io = req.app.get('io');
      const result = await reassignmentService.recordDoctorLeave({
        hospitalId: req.user.hospitalId,
        doctorId,
        startDate,
        endDate,
        startTime,
        endTime,
        reason,
        recordedBy: req.user._id,
        io
      });

      res.status(201).json({
        success: true,
        message: `Leave recorded. ${result.affectedAppointmentsCount} appointment(s) flagged for reassignment.`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async resolveReassignment(req, res, next) {
    try {
      const { choice, replacementSlotId } = req.body;
      if (!choice) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_CHOICE', message: 'choice is required (SUGGESTED_DOCTOR, SAME_DOCTOR_NEW_DATE, EMERGENCY_REDIRECT, CANCELLED).' }
        });
      }

      const io = req.app.get('io');
      const result = await reassignmentService.resolveReassignment({
        appointmentId: req.params.id,
        choice,
        replacementSlotId,
        userId: req.user._id,
        io
      });

      res.json({
        success: true,
        message: 'Reassignment resolved successfully.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyPendingReassignments(req, res, next) {
    try {
      const appointments = await reassignmentService.getPendingReassignmentsForPatient(req.user._id);
      res.json({
        success: true,
        count: appointments.length,
        data: appointments
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReassignmentController();
