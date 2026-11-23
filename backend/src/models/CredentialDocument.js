const mongoose = require('mongoose');
const tenantPlugin = require('../plugins/tenantPlugin');

const credentialDocumentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['registration_certificate', 'degree_certificate', 'other'],
      required: true
    },
    fileName: {
      type: String,
      required: true,
      trim: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    storageKey: {
      type: String,
      required: true
    },
    sha256: {
      type: String,
      required: true
    },
    version: {
      type: Number,
      default: 1
    },
    isCurrent: {
      type: Boolean,
      default: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

credentialDocumentSchema.plugin(tenantPlugin);
credentialDocumentSchema.index({ hospitalId: 1, doctorId: 1, type: 1, isCurrent: 1 });

module.exports = mongoose.model('CredentialDocument', credentialDocumentSchema);
