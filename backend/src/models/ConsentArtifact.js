const mongoose = require('mongoose');

const consentArtifactSchema = new mongoose.Schema(
  {
    patientProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
      required: true,
      index: true
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    grantedToDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },
    grantedToHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
      index: true
    },
    allowedRecordIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthRecord'
      }
    ],
    purpose: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REVOKED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    revokedAt: {
      type: Date,
      default: null
    },
    revocationReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

consentArtifactSchema.index({ grantedToDoctorId: 1, status: 1, expiresAt: 1 });

module.exports = mongoose.model('ConsentArtifact', consentArtifactSchema);
