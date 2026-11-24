const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: [
        'APPOINTMENT_NEW',
        'APPOINTMENT_CANCELLED',
        'APPOINTMENT_RESCHEDULED',
        'REASSIGNMENT_OUTCOME',
        'REFERRAL_NEW',
        'REFERRAL_STATUS',
        'CONSENT_GRANTED',
        'CONSENT_REVOKED',
        'LEAVE_STATUS',
        'EMERGENCY_ALERT',
        'HOSPITAL_REGISTRATION',
        'HOSPITAL_APPROVAL',
        'SECURITY_ALERT',
        'PLATFORM_INCIDENT',
        'GENERAL'
      ],
      default: 'GENERAL',
      index: true
    },
    priority: {
      type: String,
      enum: ['ROUTINE', 'URGENT', 'CRITICAL'],
      default: 'ROUTINE'
    },
    link: {
      type: String,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
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

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
