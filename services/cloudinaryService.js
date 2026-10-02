const cloudinary = require('../config/cloudinary');

// =====================================================
// UPLOAD WITH CLOUDINARY AI
// =====================================================
async function uploadWithAI(dataURI, preset, basePrompt) {
  return cloudinary.uploader.upload(dataURI, {
    folder: 'adcraft_ai_campaigns/raw',
    resource_type: 'image',

    // Cloudinary AI Auto Tagging
    categorization: 'google_tagging',
    auto_tagging: 0.6,

    // Cloudinary AI Moderation
    moderation: 'aws_rek',

    // These are STATIC AdCraft tags.
    // They are NOT counted as AI-generated tags.
    tags: [
      'adcraft-ai',
      'product-upload',
      `preset-${preset}`
    ],

    context:
      `alt=${basePrompt}|caption=AdCraft AI campaign asset`
  });
}


// =====================================================
// FALLBACK UPLOAD
// =====================================================
async function uploadBasic(dataURI, preset, basePrompt) {
  return cloudinary.uploader.upload(dataURI, {
    folder: 'adcraft_ai_campaigns/raw',
    resource_type: 'image',

    tags: [
      'adcraft-ai',
      'product-upload',
      `preset-${preset}`
    ],

    context:
      `alt=${basePrompt}|caption=AdCraft AI campaign asset`
  });
}


// =====================================================
// BACKGROUND REMOVAL
// =====================================================
function buildBgRemovedUrl(publicId) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        effect: 'background_removal'
      },
      {
        fetch_format: 'auto',
        quality: 'auto'
      }
    ]
  });
}


// =====================================================
// GENERATIVE BACKGROUND
// =====================================================
function buildAdUrl(
  publicId,
  prompt,
  width,
  height
) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        effect:
          `gen_background_replace:prompt_${prompt}`
      },
      {
        width,
        height,
        crop: 'fill',
        gravity: 'auto'
      },
      {
        fetch_format: 'auto',
        quality: 'auto'
      }
    ]
  });
}


// =====================================================
// SMART CROP FALLBACK
// =====================================================
function buildSmartCropUrl(
  publicId,
  width,
  height
) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width,
        height,
        crop: 'fill',
        gravity: 'auto'
      },
      {
        fetch_format: 'auto',
        quality: 'auto'
      }
    ]
  });
}


// =====================================================
// CLOUDINARY SEARCH
// =====================================================
async function searchAssets(expression) {
  return cloudinary.search
    .expression(expression)
    .sort_by('created_at', 'desc')
    .max_results(20)
    .execute();
}


module.exports = {
  uploadWithAI,
  uploadBasic,
  buildBgRemovedUrl,
  buildAdUrl,
  buildSmartCropUrl,
  searchAssets
};
