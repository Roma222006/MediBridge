const mongoose = require('mongoose');
const tenantPlugin = require('../plugins/tenantPlugin');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['radiology', 'consultation', 'laboratory', 'surgery', 'emergency', 'dialysis'],
      required: true
    },
    specialty: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    operatingDays: {
      type: [Number], // [0..6] days of the week when this service runs
      default: [1, 2, 3, 4, 5, 6]
    },
    sharedResourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SharedResource',
      default: null
    },
    slotDurationMinutes: {
      type: Number,
      default: 30
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

serviceSchema.plugin(tenantPlugin);
serviceSchema.index({ hospitalId: 1, specialty: 1, isActive: 1 });

module.exports = mongoose.model('Service', serviceSchema);
