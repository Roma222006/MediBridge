const mongoose = require('mongoose');

const consultationNoteSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },
    patientProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
      required: true
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    version: {
      type: Number,
      default: 1
    },
    isDraft: {
      type: Boolean,
      default: false
    },
    savedAt: {
      type: Date,
      default: Date.now
    },
    convertedToReferral: {
      type: Boolean,
      default: false
    },
    recommendInPerson: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

consultationNoteSchema.index({ appointmentId: 1, doctorId: 1 });

module.exports = mongoose.model('ConsultationNote', consultationNoteSchema);
