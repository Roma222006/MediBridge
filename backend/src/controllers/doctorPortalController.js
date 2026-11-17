const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Referral = require('../models/Referral');

class DoctorPortalController {
  async getSchedule(req, res, next) {
    try {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found for this user.' }
        });
      }

      const { date } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];

      const appointments = await Appointment.find({
        doctorId: doctor._id,
        date: targetDate,
        status: { $in: ['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED'] }
      })
        .populate('patientProfileId', 'fullName gender dateOfBirth phone')
        .populate('serviceId', 'name specialty price')
        .sort({ startTime: 1 })
        .lean();

      res.json({
        success: true,
        data: {
          doctor: {
            id: doctor._id,
            name: doctor.name,
            specialty: doctor.specialty,
            regNumber: doctor.regNumber
          },
          date: targetDate,
          count: appointments.length,
          appointments
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getSpecialtyReferrals(req, res, next) {
    try {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' }
        });
      }

      const referrals = await Referral.find({
        receivingHospitalId: req.user.hospitalId,
        targetSpecialty: { $regex: doctor.specialty, $options: 'i' },
        status: { $in: ['SENT', 'RECEIVED', 'UNDER_REVIEW', 'ACCEPTED'] }
      })
        .populate('patientProfileId', 'fullName dateOfBirth gender')
        .populate('referringHospitalId', 'name address phone')
        .populate('referringDoctorId', 'name specialty')
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        count: referrals.length,
        data: referrals
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DoctorPortalController();
