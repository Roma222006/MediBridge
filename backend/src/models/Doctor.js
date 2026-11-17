const mongoose = require('mongoose');
const tenantPlugin = require('../plugins/tenantPlugin');

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    specialty: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    qualifications: {
      type: String,
      required: true,
      trim: true
    },
    regNumber: {
      type: String,
      required: true,
      default: 'TNMC/2026/00000 (Demo, not verified)'
    },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED', 'UNVERIFIED', 'DEMO_NOT_VERIFIED'],
      default: 'DEMO_NOT_VERIFIED'
    },
    experienceYears: {
      type: Number,
      default: 5
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0
    },
    availableDays: {
      type: [Number], // [1, 2, 3, 4, 5] (Monday to Friday)
      default: [1, 2, 3, 4, 5, 6]
    },
    teleconsultAvailable: {
      type: Boolean,
      default: true
    },
    inPersonAvailable: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

doctorSchema.plugin(tenantPlugin);
doctorSchema.index({ hospitalId: 1, specialty: 1, isActive: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
