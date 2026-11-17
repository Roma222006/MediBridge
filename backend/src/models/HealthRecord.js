const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['lab_report', 'prescription', 'radiology_scan', 'discharge_summary', 'other'],
      default: 'lab_report'
    },
    fileKey: {
      type: String,
      required: true,
      unique: true
    },
    fileName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['application/pdf', 'image/jpeg', 'image/png']
    },
    fileSizeBytes: {
      type: Number,
      required: true,
      max: 10 * 1024 * 1024 // 10 MB cap
    },
    sha256Hash: {
      type: String,
      required: true,
      index: true
    },
    scanStatus: {
      type: String,
      enum: ['PENDING_SCAN', 'CLEAN', 'INFECTED'],
      default: 'CLEAN'
    },
    version: {
      type: Number,
      default: 1
    },
    previousVersionRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthRecord',
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

healthRecordSchema.index({ patientProfileId: 1, isDeleted: 1 });
healthRecordSchema.index({ ownerUserId: 1, sha256Hash: 1 });

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
