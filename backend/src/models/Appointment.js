const mongoose = require('mongoose');
const tenantPlugin = require('../plugins/tenantPlugin');

const appointmentSchema = new mongoose.Schema(
  {
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    patientProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
      required: true,
      index: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null,
      index: true
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: true,
      index: true
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true
    },
    startTime: {
      type: String, // 'HH:mm'
      required: true
    },
    endTime: {
      type: String, // 'HH:mm'
      required: true
    },
    type: {
      type: String,
      enum: ['consultation_in_person', 'consultation_tele', 'procedure_scan'],
      default: 'consultation_in_person'
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0
    },
    schemeApplied: {
      type: String,
      enum: ['none', 'pmjay', 'cmchis', 'private', 'other'],
      default: 'none'
    },
    status: {
      type: String,
      enum: [
        'RESERVED',
        'CONFIRMED',
        'CHECKED_IN',
        'IN_CONSULTATION',
        'COMPLETED',
        'CANCELLED',
        'RESCHEDULED',
        'NO_SHOW',
        'REASSIGNMENT_PENDING'
      ],
      default: 'RESERVED',
      index: true
    },
    statusHistory: [
      {
        fromStatus: String,
        toStatus: String,
        reason: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    reassignmentDetails: {
      originalDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
      eventId: String,
      reason: String,
      suggestedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
      suggestedSlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
      deadlineAt: Date,
      resolutionChoice: {
        type: String,
        enum: ['SUGGESTED_DOCTOR', 'SAME_DOCTOR_NEW_DATE', 'CANCELLED', 'EMERGENCY_REDIRECT', 'NONE'],
        default: 'NONE'
      }
    },
    teleconsultSession: {
      sessionId: String,
      participantToken: String,
      roomUrl: String,
      doctorJoinedAt: Date,
      patientJoinedAt: Date
    },
    version: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

appointmentSchema.plugin(tenantPlugin);

// Compound indexes for schedule checking and query performance
appointmentSchema.index({ patientProfileId: 1, date: 1, status: 1 });
appointmentSchema.index({ hospitalId: 1, date: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, date: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
