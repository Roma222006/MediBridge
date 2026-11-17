const mongoose = require('mongoose');

const patientAccessLogSchema = new mongoose.Schema(
  {
    patientProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
      required: true,
      index: true
    },
    healthRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthRecord',
      default: null,
      index: true
    },
    consentArtifactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConsentArtifact',
      default: null
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    actorRole: {
      type: String,
      required: true
    },
    actorName: {
      type: String,
      default: 'Unknown'
    },
    action: {
      type: String,
      enum: ['VIEW_METADATA', 'DOWNLOAD_FILE', 'GRANT_CONSENT', 'REVOKE_CONSENT', 'UPLOAD_RECORD', 'DELETE_RECORD'],
      required: true
    },
    accessGranted: {
      type: Boolean,
      required: true,
      index: true
    },
    clinicalPurpose: {
      type: String,
      default: null
    },
    denialReason: {
      type: String,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

patientAccessLogSchema.index({ patientProfileId: 1, timestamp: -1 });

module.exports = mongoose.model('PatientAccessLog', patientAccessLogSchema);
