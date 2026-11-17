const mongoose = require('mongoose');
const tenantPlugin = require('../plugins/tenantPlugin');

const sharedResourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['scanner_mri', 'scanner_ct', 'ot', 'dialysis_unit', 'cath_lab', 'ultrasound'],
      required: true
    },
    operatingDays: {
      type: [Number], // 0 = Sunday, 1 = Monday, ... 6 = Saturday
      default: [1, 2, 3, 4, 5, 6]
    },
    dailyCapacity: {
      type: Number,
      default: 20
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

sharedResourceSchema.plugin(tenantPlugin);

module.exports = mongoose.model('SharedResource', sharedResourceSchema);
