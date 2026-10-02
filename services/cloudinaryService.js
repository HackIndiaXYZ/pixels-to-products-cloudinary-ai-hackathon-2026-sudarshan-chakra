const cloudinary = require('../config/cloudinary');

// Upload an image with AI features enabled
async function uploadWithAI(dataURI, preset, basePrompt) {
  return cloudinary.uploader.upload(dataURI, {
    folder: 'adcraft_ai_campaigns/raw',
    resource_type: 'image',
    categorization: 'google_tagging',
    auto_tagging: 0.6,
    moderation: 'aws_rek',
    tags: ['adcraft-ai', 'product-upload', `preset-${preset}`],
    context: `alt=${basePrompt}|caption=AdCraft AI campaign asset`
  });
}

// Upload an image without AI features as a fallback
async function uploadBasic(dataURI, preset, basePrompt) {
  return cloudinary.uploader.upload(dataURI, {
    folder: 'adcraft_ai_campaigns/raw',
    resource_type: 'image',
    tags: ['adcraft-ai', 'product-upload', `preset-${preset}`],
    context: `alt=${basePrompt}|caption=AdCraft AI campaign asset`
  });
}

// Build a background-removed image URL
function buildBgRemovedUrl(publicId) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { effect: 'background_removal' },
      { fetch_format: 'auto', quality: 'auto' }
    ]
  });
}

// Build a generative AI background URL
function buildAdUrl(publicId, prompt, width, height) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { effect: `gen_background:prompt_${prompt}` },
      { width, height, crop: 'fill', gravity: 'auto' },
      { fetch_format: 'auto', quality: 'auto' }
    ]
  });
}

// Build a generative AI background URL
function buildAdUrl(publicId, prompt, width, height) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { effect: `gen_background_replace:prompt_${prompt}` },
      { width, height, crop: 'fill', gravity: 'auto' },
      { fetch_format: 'auto', quality: 'auto' }
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
