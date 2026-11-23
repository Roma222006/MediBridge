const mongoose = require('mongoose');

const doctorLeaveRequestSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true
    },
    startDate: {
      type: String, // 'YYYY-MM-DD'
      required: true
    },
    endDate: {
      type: String, // 'YYYY-MM-DD'
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'RECORDED_BY_ADMIN', 'DECLINED'],
      default: 'SUBMITTED',
      index: true
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    adminNotes: {
      type: String,
      trim: true
    },
    recordedEventId: {
      type: String,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

doctorLeaveRequestSchema.index({ doctorId: 1, startDate: 1 });

module.exports = mongoose.model('DoctorLeaveRequest', doctorLeaveRequestSchema);
