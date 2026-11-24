const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['general', 'security', 'notification', 'maintenance', 'backup'],
      required: true,
      index: true
    },
    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    lastModifiedRole: {
      type: String,
      default: 'super_admin'
    },
    history: [
      {
        previousValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        modifiedRole: String,
        reason: String,
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
