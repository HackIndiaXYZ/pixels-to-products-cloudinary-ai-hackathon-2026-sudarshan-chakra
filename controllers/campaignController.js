const multer = require('multer');
const mongoose = require('mongoose');

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

// Configure multer for in-memory image uploads
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

// Generate a complete campaign
async function generateCampaign(req, res) {
  try {
    // Make sure an image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required'
      });
    }

    // Read preset and custom prompt
    const preset = (req.body.preset || 'custom').toLowerCase();
    const customPrompt = req.body.prompt?.trim() || '';

    // Build campaign prompts
    const basePrompt = getBasePrompt(
      preset,
      customPrompt
    );

    const themePrompts = getThemePrompts(
      basePrompt
    );

    // Convert uploaded image to data URI
    const base64Image = Buffer
      .from(req.file.buffer)
      .toString('base64');

    const dataURI =
      `data:${req.file.mimetype};base64,${base64Image}`;

    // Store warnings instead of silently hiding failures
    const warnings = [];

    // Track every pipeline stage
    const pipeline = {
      uploaded: false,
      moderated: false,
      tagged: false,
      backgroundRemoved: false,
      generated: false,
      optimized: false
    };

    let uploadResult;

    // Do not assume moderation is approved.
    let moderationStatus = 'unavailable';

    // Only store real AI-generated tags here.
    let autoTags = [];

    let processingMode = 'Fallback Processing';

    let bgRemovedApplied = false;

    try {
      // Try Cloudinary upload with AI features
      uploadResult = await uploadWithAI(
        dataURI,
        preset,
        basePrompt
      );

      pipeline.uploaded = true;

      processingMode = 'AI Enhanced Processing';

      // Read moderation response only if Cloudinary returned it
      const moderationResults =
        Array.isArray(uploadResult.moderation)
          ? uploadResult.moderation
          : [];

      if (moderationResults.length > 0) {
        moderationStatus =
          moderationResults[0]?.status || 'pending';

        const normalizedModeration =
          String(moderationStatus).toLowerCase();

        // Moderation is considered completed only when
        // Cloudinary explicitly returns approved or rejected.
        pipeline.moderated =
          normalizedModeration === 'approved' ||
          normalizedModeration === 'rejected';

        if (!pipeline.moderated) {
          warnings.push(
            'Cloudinary moderation was requested, but the final moderation result is not available yet.'
          );
        }
      } else {
        moderationStatus = 'unavailable';
        pipeline.moderated = false;

        warnings.push(
          'Cloudinary moderation did not return a result. The image was not marked as approved automatically.'
        );
      }

      // Read returned tags
      const returnedTags =
        Array.isArray(uploadResult.tags)
          ? uploadResult.tags
          : [];

      // Remove AdCraft internal tags.
      // Only remaining tags are treated as AI-generated tags.
      const internalTags = new Set([
        'adcraft-ai',
        'product-upload',
        `preset-${preset}`
      ]);

      autoTags = returnedTags.filter(
        tag => !internalTags.has(tag)
      );

      pipeline.tagged = autoTags.length > 0;

      if (!pipeline.tagged) {
        warnings.push(
          'Cloudinary auto-tagging did not return AI-generated tags.'
        );
      }

    } catch (error) {
      // If optional AI services fail,
      // continue safely with a normal Cloudinary upload.
      warnings.push(
        'Advanced moderation or auto-tagging was unavailable, so fallback upload mode was used.'
      );

      uploadResult = await uploadBasic(
        dataURI,
        preset,
        basePrompt
      );

      pipeline.uploaded = true;

      pipeline.moderated = false;
      pipeline.tagged = false;

      moderationStatus = 'unavailable';
      autoTags = [];

      processingMode = 'Fallback Processing';

      console.error(
        'Cloudinary AI upload warning:',
        error.message
      );
    }

    const publicId = uploadResult.public_id;

    // Never continue if moderation explicitly rejected the image
    if (
      String(moderationStatus).toLowerCase() ===
      'rejected'
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Image failed Cloudinary moderation and cannot be processed.',
        moderationStatus
      });
    }

    // Build background-removed version
    let bgRemovedUrl = uploadResult.secure_url;

    try {
      bgRemovedUrl =
        buildBgRemovedUrl(publicId);

      pipeline.backgroundRemoved = true;
      bgRemovedApplied = true;

    } catch (error) {
      warnings.push(
        'Background removal transformation could not be created, so the original image is being used.'
      );

      console.error(
        'Background removal warning:',
        error.message
      );
    }

    // Create the three campaign formats for each theme
    function buildThemeAssets(prompt) {
      function makeVariant(width, height) {
        try {
          return buildAdUrl(
            publicId,
            prompt,
            width,
            height
          );
        } catch (error) {
          warnings.push(
            `Generative background URL could not be created for ${width}x${height}. Smart crop fallback was used.`
          );

          return buildSmartCropUrl(
            publicId,
            width,
            height
          );
        }
      }

      return {
        square: makeVariant(
          1080,
          1080
        ),

        story: makeVariant(
          1080,
          1920
        ),

        banner: makeVariant(
          1920,
          1080
        )
      };
    }

    // Generate all campaign assets
    const assets = {
      bgRemoved: bgRemovedUrl,

      luxury: buildThemeAssets(
        themePrompts.luxury
      ),

      minimal: buildThemeAssets(
        themePrompts.minimal
      ),

      festive: buildThemeAssets(
        themePrompts.festive
      )
    };

    // Campaign variants were successfully created
    pipeline.generated = true;

    // All generated URLs use f_auto and q_auto
    pipeline.optimized = true;

    // Generate prompt suggestions
    const suggestedPrompts =
      getSuggestedPromptsFromTags(
        autoTags,
        preset
      );

    // Save campaign to MongoDB
    const campaign =
      await Campaign.create({
        publicId,

        originalImage:
          uploadResult.secure_url,

        folder:
          'adcraft_ai_campaigns/raw',

        preset,

        promptUsed:
          basePrompt,

        moderationStatus,

        autoTags,

        warnings,

        pipeline,

        metadata: {
          format:
            uploadResult.format || 'unknown',

          width:
            uploadResult.width || null,

          height:
            uploadResult.height || null,

          totalVariants: 10
        },

        assets
      });

    // Return campaign data to frontend
    return res.json({
      success: true,

      campaignId:
        campaign._id,

      metadata: {
        publicId:
          campaign.publicId,

        originalImage:
          campaign.originalImage,

        folder:
          campaign.folder,

        preset:
          campaign.preset,

        promptUsed:
          campaign.promptUsed,

        moderationStatus:
          campaign.moderationStatus,

        autoTags:
          campaign.autoTags,

        createdAt:
          campaign.createdAt,

        format:
          campaign.metadata.format,

        width:
          campaign.metadata.width,

        height:
          campaign.metadata.height,

        totalVariants:
          campaign.metadata.totalVariants,

        processingMode
      },

      warnings:
        campaign.warnings,

      pipeline:
        campaign.pipeline,

      assets:
        campaign.assets,

      suggestedPrompts,

      bgRemovedApplied
    });

  } catch (error) {
    console.error(
      'Generate Campaign Error:',
      {
        message: error.message,
        name: error.name,
        http_code: error.http_code
      }
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        'Failed to generate campaign'
    });
  }
}

// Get all campaigns
async function getCampaigns(req, res) {
  try {
    const campaigns =
      await Campaign
        .find()
        .sort({ createdAt: -1 })
        .limit(50);

    return res.json({
      success: true,
      count: campaigns.length,
      campaigns
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error:
        error.message ||
        'Failed to fetch campaigns'
    });
  }
}

// Get one campaign by MongoDB ID
async function getCampaignById(req, res) {
  try {
    const { id } = req.params;

    // Validate ObjectId before querying MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID'
      });
    }

    const campaign =
      await Campaign.findById(id);

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
    console.error(
      'Get Campaign By ID Error:',
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        'Failed to fetch campaign'
    });
  }
}

// Delete one campaign
async function deleteCampaign(req, res) {
  try {
    const { id } = req.params;

    // Validate ObjectId before deleting
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID'
      });
    }

    const campaign =
      await Campaign.findByIdAndDelete(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    return res.json({
      success: true,
      message:
        'Campaign deleted successfully'
    });

  } catch (error) {
    console.error(
      'Delete Campaign Error:',
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        'Failed to delete campaign'
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
