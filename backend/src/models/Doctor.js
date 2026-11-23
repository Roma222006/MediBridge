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
    councilName: {
      type: String,
      default: 'Tamil Nadu Medical Council'
    },
    councilState: {
      type: String,
      default: 'Tamil Nadu'
    },
    subSpecialty: {
      type: String,
      default: null
    },
    designation: {
      type: String,
      default: 'Consultant'
    },
    languagesSpoken: {
      type: [String],
      default: ['English', 'Tamil']
    },
    department: {
      type: String,
      default: 'General'
    },
    consultModes: {
      inPerson: { type: Boolean, default: true },
      teleconsult: { type: Boolean, default: true }
    },
    verificationStatus: {
      type: String,
      enum: [
        'PROFILE_INCOMPLETE',
        'SUBMITTED',
        'UNDER_REVIEW',
        'ADDITIONAL_INFO_REQUIRED',
        'VERIFIED',
        'REJECTED',
        'DEMO_NOT_VERIFIED',
        'UNVERIFIED'
      ],
      default: 'DEMO_NOT_VERIFIED'
    },
    reviewStage: {
      type: String,
      enum: ['HOSPITAL_STAGE', 'PLATFORM_STAGE', 'COMPLETED', 'NONE'],
      default: 'NONE'
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verificationHistory: [
      {
        stage: { type: String, enum: ['hospital', 'platform'] },
        status: {
          type: String,
          enum: [
            'PROFILE_INCOMPLETE',
            'SUBMITTED',
            'UNDER_REVIEW',
            'ADDITIONAL_INFO_REQUIRED',
            'VERIFIED',
            'REJECTED'
          ]
        },
        reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reviewerRole: String,
        comments: String,
        lookupSource: String,
        lookupOutcome: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
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
