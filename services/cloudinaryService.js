const cloudinary = require('../config/cloudinary');

// Upload an image with Cloudinary AI features
async function uploadWithAI(dataURI, preset, basePrompt) {
  return cloudinary.uploader.upload(dataURI, {
    folder: 'adcraft_ai_campaigns/raw',
    resource_type: 'image',

    // Cloudinary AI Auto Tagging
    categorization: 'google_tagging',
    auto_tagging: 0.6,

    // Cloudinary AI Moderation
    moderation: 'aws_rek',

    // These are AdCraft's own tags, NOT AI-generated tags
    tags: [
      'adcraft-ai',
      'product-upload',
      `preset-${preset}`
    ],

    context: `alt=${basePrompt}|caption=AdCraft AI campaign asset`
  });
}


// Safe fallback upload without optional AI add-ons
async function uploadBasic(dataURI, preset, basePrompt) {
  return cloudinary.uploader.upload(dataURI, {
    folder: 'adcraft_ai_campaigns/raw',
    resource_type: 'image',

    tags: [
      'adcraft-ai',
      'product-upload',
      `preset-${preset}`
    ],

    context: `alt=${basePrompt}|caption=AdCraft AI campaign asset`
  });
}


// Background removal
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


// Generative background replacement
function buildAdUrl(publicId, prompt, width, height) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        effect: `gen_background_replace:prompt_${prompt}`
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


// Normal smart-crop fallback
function buildSmartCropUrl(publicId, width, height) {
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


// Search Cloudinary assets
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
