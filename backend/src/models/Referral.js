const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema(
  {
    referralNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    dedupeKey: {
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
    referringHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true
    },
    referringDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },
    receivingHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true
    },
    targetSpecialty: {
      type: String,
      required: true,
      index: true
    },
    clinicalSummary: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['ROUTINE', 'URGENT', 'CRITICAL'],
      default: 'ROUTINE',
      index: true
    },
    initialTeleconsultAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    status: {
      type: String,
      enum: [
        'SENT',
        'RECEIVED',
        'UNDER_REVIEW',
        'ACCEPTED',
        'PATIENT_NOTIFIED',
        'ARRIVED',
        'COMPLETED',
        'REJECTED',
        'WITHDRAWN',
        'EXPIRED',
        'TRANSFERRED'
      ],
      default: 'SENT',
      index: true
    },
    alternativeHospitals: [
      {
        hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
        suggestedReason: String
      }
    ],
    responseDeadlineAt: {
      type: Date,
      required: true,
      index: true
    },
    patientConfirmedAt: {
      type: Date,
      default: null
    },
    assignedCityDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null
    },
    assignedCitySlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      default: null
    },
    journeyMetrics: {
      sentAt: { type: Date, default: Date.now },
      receivedAt: { type: Date, default: null },
      acceptedAt: { type: Date, default: null },
      arrivedAt: { type: Date, default: null },
      completedAt: { type: Date, default: null },
      sentToReceivedMinutes: { type: Number, default: null },
      arrivalToCompletionMinutes: { type: Number, default: null }
    },
    statusHistory: [
      {
        fromStatus: String,
        toStatus: String,
        reason: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

referralSchema.index({ receivingHospitalId: 1, status: 1 });
referralSchema.index({ referringHospitalId: 1, status: 1 });
referralSchema.index({ patientProfileId: 1, status: 1 });

module.exports = mongoose.model('Referral', referralSchema);
