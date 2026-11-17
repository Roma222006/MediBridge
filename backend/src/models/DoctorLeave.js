const mongoose = require('mongoose');
const tenantPlugin = require('../plugins/tenantPlugin');

const doctorLeaveSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },
    startDate: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true
    },
    endDate: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true
    },
    startTime: {
      type: String, // 'HH:mm'
      default: '00:00'
    },
    endTime: {
      type: String, // 'HH:mm'
      default: '23:59'
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    affectedAppointmentsCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CANCELLED'],
      default: 'ACTIVE'
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

doctorLeaveSchema.plugin(tenantPlugin);
doctorLeaveSchema.index({ hospitalId: 1, doctorId: 1, startDate: 1 });

module.exports = mongoose.model('DoctorLeave', doctorLeaveSchema);
