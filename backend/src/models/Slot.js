const mongoose = require('mongoose');
const tenantPlugin = require('../plugins/tenantPlugin');

const slotSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null,
      index: true
    },
    sharedResourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SharedResource',
      default: null,
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
    status: {
      type: String,
      enum: ['AVAILABLE', 'HOLD', 'BOOKED', 'BLOCKED_LEAVE'],
      default: 'AVAILABLE',
      index: true
    },
    holdExpiresAt: {
      type: Date,
      default: null,
      index: true
    },
    heldByPatientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
      default: null
    },
    bookedAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
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

slotSchema.plugin(tenantPlugin);

// Compound indexes for availability searches and conflict prevention
slotSchema.index({ hospitalId: 1, date: 1, status: 1 });
slotSchema.index({ doctorId: 1, date: 1, startTime: 1 });
slotSchema.index({ sharedResourceId: 1, date: 1, startTime: 1 });

module.exports = mongoose.model('Slot', slotSchema);
