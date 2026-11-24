const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: 'text'
    },
    licenseNumber: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['district_hq', 'tertiary', 'private', 'phc'],
      default: 'private',
      index: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    address: {
      street: String,
      area: String,
      city: { type: String, required: true, index: true },
      district: { type: String, required: true, index: true },
      state: { type: String, default: 'Tamil Nadu' },
      pincode: { type: String, required: true }
    },
    phone: {
      type: String,
      required: true
    },
    emergencyPhone: {
      type: String,
      default: '108'
    },
    email: {
      type: String,
      trim: true
    },
    schemesSupported: [
      {
        type: String,
        enum: ['pmjay', 'cmchis', 'private_star', 'private_hdfc', 'private_icici', 'none'],
        index: true
      }
    ],
    bedCapacity: {
      general: {
        total: { type: Number, default: 0 },
        available: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
      },
      icu: {
        total: { type: Number, default: 0 },
        available: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
      }
    },
    emergencyAvailable: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    approvalStatus: {
      type: String,
      enum: ['APPROVED', 'PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUIRED', 'REJECTED'],
      default: 'APPROVED',
      index: true
    },
    accountStatus: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true
    },
    suspensionReason: {
      type: String,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    infoRequiredNote: {
      type: String,
      default: null
    },
    website: {
      type: String,
      default: null
    },
    operatingHours: {
      type: String,
      default: '24/7 Emergency & OPD (08:00 - 20:00)'
    },
    documents: [
      {
        title: { type: String, required: true },
        docType: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['VERIFIED', 'PENDING', 'REJECTED'], default: 'PENDING' }
      }
    ],
    statusHistory: [
      {
        status: String,
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        actorRole: String,
        reason: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    ianaTimezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  {
    timestamps: true
  }
);

hospitalSchema.index({ location: '2dsphere' });
hospitalSchema.index({ 'address.district': 1, type: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);
