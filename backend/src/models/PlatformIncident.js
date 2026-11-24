const mongoose = require('mongoose');

const platformIncidentSchema = new mongoose.Schema(
  {
    incidentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    service: {
      type: String,
      required: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['OPEN', 'INVESTIGATING', 'ACKNOWLEDGED', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true
    },
    assignedTo: {
      type: String,
      default: 'Unassigned'
    },
    assignedAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    internalNotes: [
      {
        note: { type: String, required: true },
        authorName: { type: String, default: 'Super Admin' },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    firstDetectedAt: {
      type: Date,
      default: Date.now
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolutionDetails: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

platformIncidentSchema.index({ status: 1, severity: 1, firstDetectedAt: -1 });

module.exports = mongoose.model('PlatformIncident', platformIncidentSchema);
