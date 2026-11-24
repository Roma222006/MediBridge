const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['patient', 'doctor', 'hospital_admin', 'super_admin'],
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    permissions: {
      type: [String],
      default: []
    },
    isProtected: {
      type: Boolean,
      default: true
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    history: [
      {
        permissions: [String],
        modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('RolePermission', rolePermissionSchema);
