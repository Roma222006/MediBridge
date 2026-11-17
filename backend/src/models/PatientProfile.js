const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown'
    },
    phone: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      enum: ['self', 'spouse', 'child', 'parent', 'other'],
      default: 'self'
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true }
    },
    insurance: {
      provider: { type: String, trim: true },
      policyNumber: { type: String, trim: true },
      schemeType: {
        type: String,
        enum: ['none', 'pmjay', 'cmchis', 'private', 'other'],
        default: 'none'
      }
    },
    abhaNumber: {
      type: String,
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

patientProfileSchema.index({ userId: 1, isDefault: 1 });

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
