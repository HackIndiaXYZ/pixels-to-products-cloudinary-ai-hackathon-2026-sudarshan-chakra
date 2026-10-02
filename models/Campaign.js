const mongoose = require('mongoose');

// Define the schema for a saved campaign
const campaignSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true
    },
    originalImage: {
      type: String,
      required: true
    },
    folder: {
      type: String,
      default: 'adcraft_ai_campaigns/raw'
    },
    preset: {
      type: String,
      default: 'custom'
    },
    promptUsed: {
      type: String,
      required: true
    },
    moderationStatus: {
      type: String,
      default: 'unavailable'
    },
    autoTags: {
      type: [String],
      default: []
    },
    warnings: {
      type: [String],
      default: []
    },
    pipeline: {
      uploaded: { type: Boolean, default: false },
      moderated: { type: Boolean, default: false },
      tagged: { type: Boolean, default: false },
      backgroundRemoved: { type: Boolean, default: false },
      generated: { type: Boolean, default: false },
      optimized: { type: Boolean, default: false }
    },
    metadata: {
      format: { type: String, default: 'unknown' },
      width: { type: Number, default: null },
      height: { type: Number, default: null },
      totalVariants: { type: Number, default: 10 }
    },
    assets: {
      bgRemoved: { type: String, default: '' },
      luxury: {
        square: { type: String, default: '' },
        story: { type: String, default: '' },
        banner: { type: String, default: '' }
      },
      minimal: {
        square: { type: String, default: '' },
        story: { type: String, default: '' },
        banner: { type: String, default: '' }
      },
      festive: {
        square: { type: String, default: '' },
        story: { type: String, default: '' },
        banner: { type: String, default: '' }
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Campaign', campaignSchema);