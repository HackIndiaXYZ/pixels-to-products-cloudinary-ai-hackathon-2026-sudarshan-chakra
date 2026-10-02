const multer = require('multer');
const Campaign = require('../models/Campaign');
const {
  uploadWithAI,
  uploadBasic,
  buildBgRemovedUrl,
  buildAdUrl,
  buildSmartCropUrl
} = require('../services/cloudinaryService');
const {
  getBasePrompt,
  getThemePrompts,
  getSuggestedPromptsFromTags
} = require('../utils/promptBuilder');

// Configure multer to store uploaded files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
}).single('image');

// Export multer middleware
function uploadMiddleware(req, res, next) {
  upload(req, res, next);
}

// Generate a campaign, save it to MongoDB, and return the response
async function generateCampaign(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required'
      });
    }

    const preset = (req.body.preset || 'custom').toLowerCase();
    const customPrompt = req.body.prompt?.trim() || '';
    const basePrompt = getBasePrompt(preset, customPrompt);
    const themePrompts = getThemePrompts(basePrompt);

    // Convert uploaded image buffer to base64 data URI
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const warnings = [];
    const pipeline = {
      uploaded: false,
      moderated: false,
      tagged: false,
      backgroundRemoved: false,
      generated: false,
      optimized: false
    };

    let uploadResult;
    let moderationStatus = 'unavailable';
    let autoTags = [];
    let processingMode = 'Fallback Processing';
    let bgRemovedApplied = false;

    // Try using Cloudinary AI add-ons first
    try {
      uploadResult = await uploadWithAI(dataURI, preset, basePrompt);
      moderationStatus = uploadResult.moderation?.[0]?.status || 'approved';
      autoTags = uploadResult.tags || [];
      processingMode = 'AI Enhanced Processing';

      pipeline.uploaded = true;
      pipeline.moderated = moderationStatus !== 'unavailable';
      pipeline.tagged = autoTags.length > 0;
    } catch (error) {
      warnings.push(
        'Advanced moderation and auto-tagging add-ons were not available in the current Cloudinary environment, so the pipeline switched to fallback-safe upload mode.'
      );

      uploadResult = await uploadBasic(dataURI, preset, basePrompt);
      pipeline.uploaded = true;
    }

    const publicId = uploadResult.public_id;

    // Stop processing if moderation rejects the image
    if (moderationStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Image failed moderation and cannot be processed.',
        moderationStatus
      });
    }

    // Use preset-based fallback tags if AI tags are unavailable
    if (!autoTags.length) {
      autoTags = [preset, 'product', 'campaign-asset'];
    }

    // Try background removal
    let bgRemovedUrl = uploadResult.secure_url;
    try {
      bgRemovedUrl = buildBgRemovedUrl(publicId);
      pipeline.backgroundRemoved = true;
      bgRemovedApplied = true;
    } catch (error) {
      warnings.push('Background removal was unavailable, so the original product image is being used as a fallback preview.');
    }

    // Build one themed asset group with safe fallback
    function buildThemeAssets(prompt) {
      function makeVariant(width, height) {
        try {
          return buildAdUrl(publicId, prompt, width, height);
        } catch (error) {
          warnings.push(`Generative background was unavailable for ${width}x${height}, so smart crop fallback was used.`);
          return buildSmartCropUrl(publicId, width, height);
        }
      }

      return {
        square: makeVariant(1080, 1080),
        story: makeVariant(1080, 1920),
        banner: makeVariant(1920, 1080)
      };
    }

    const assets = {
      bgRemoved: bgRemovedUrl,
      luxury: buildThemeAssets(themePrompts.luxury),
      minimal: buildThemeAssets(themePrompts.minimal),
      festive: buildThemeAssets(themePrompts.festive)
    };

    pipeline.generated = true;
    pipeline.optimized = true;

    const suggestedPrompts = getSuggestedPromptsFromTags(autoTags, preset);

    // Save the generated campaign into MongoDB
    const campaign = await Campaign.create({
      publicId,
      originalImage: uploadResult.secure_url,
      folder: 'adcraft_ai_campaigns/raw',
      preset,
      promptUsed: basePrompt,
      moderationStatus,
      autoTags,
      warnings,
      pipeline,
      metadata: {
        format: uploadResult.format || 'unknown',
        width: uploadResult.width || null,
        height: uploadResult.height || null,
        totalVariants: 10
      },
      assets
    });

    return res.json({
      success: true,
      campaignId: campaign._id,
      metadata: {
        publicId: campaign.publicId,
        originalImage: campaign.originalImage,
        folder: campaign.folder,
        preset: campaign.preset,
        promptUsed: campaign.promptUsed,
        moderationStatus: campaign.moderationStatus,
        autoTags: campaign.autoTags,
        createdAt: campaign.createdAt,
        format: campaign.metadata.format,
        width: campaign.metadata.width,
        height: campaign.metadata.height,
        totalVariants: campaign.metadata.totalVariants,
        processingMode
      },
      warnings: campaign.warnings,
      pipeline: campaign.pipeline,
      assets: campaign.assets,
      suggestedPrompts,
      bgRemovedApplied
    });
  } catch (error) {
    console.error('Generate Campaign Error:', {
      message: error.message,
      name: error.name,
      http_code: error.http_code
    });

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate campaign'
    });
  }
}

// Return all saved campaigns
async function getCampaigns(req, res) {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).limit(50);

    return res.json({
      success: true,
      count: campaigns.length,
      campaigns
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch campaigns'
    });
  }
}

// Return a single campaign by database ID
async function getCampaignById(req, res) {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    return res.json({
      success: true,
      campaign
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch campaign'
    });
  }
}

// Delete a campaign from MongoDB only
async function deleteCampaign(req, res) {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    return res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete campaign'
    });
  }
}

module.exports = {
  uploadMiddleware,
  generateCampaign,
  getCampaigns,
  getCampaignById,
  deleteCampaign
};
