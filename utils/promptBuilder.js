const { sanitizePrompt } = require('./helpers');

// Preset prompts for quick campaign generation
const PRESET_MAP = {
  beauty: 'premium skincare product photography with soft natural lighting',
  fashion: 'high-end fashion product photography with dramatic studio shadows',
  electronics: 'modern technology product ad with sleek reflective lighting',
  food: 'fresh commercial food photography with vibrant appetizing styling',
  jewelry: 'luxury jewelry commercial setup with elegant premium reflections',
  custom: ''
};

// Build the base prompt from preset and optional custom prompt
function getBasePrompt(preset = 'custom', customPrompt = '') {
  const cleanPreset = (preset || 'custom').toLowerCase();
  const presetPrompt = PRESET_MAP[cleanPreset] || '';
  return customPrompt?.trim() || presetPrompt || 'premium product ad with studio lighting';
}

// Build prompts for all three campaign themes
function getThemePrompts(basePrompt) {
  return {
    luxury: sanitizePrompt(`${basePrompt} marble surface elegant luxury ad premium commercial setup`),
    minimal: sanitizePrompt(`${basePrompt} clean white minimal ecommerce background modern studio`),
    festive: sanitizePrompt(`${basePrompt} vibrant festive sale campaign warm promotional lighting`)
  };
}

// Generate helpful prompt suggestions based on AI-generated tags
function getSuggestedPromptsFromTags(tags = []) {
  const lowerTags = tags.map((tag) => tag.toLowerCase());

  if (lowerTags.some((tag) => ['cosmetic', 'skincare', 'beauty', 'bottle'].includes(tag))) {
    return [
      'premium skincare shelf with soft daylight',
      'clean cosmetic studio with beige luxury tones',
      'minimal white beauty ad setup'
    ];
  }

  if (lowerTags.some((tag) => ['watch', 'jewelry', 'ring', 'bracelet'].includes(tag))) {
    return [
      'luxury dark reflective jewelry showcase',
      'black premium watch commercial setup',
      'high-end metallic studio lighting'
    ];
  }

  if (lowerTags.some((tag) => ['shoe', 'sneaker', 'fashion', 'bag'].includes(tag))) {
    return [
      'urban fashion campaign with bold lighting',
      'premium retail studio setup',
      'clean fashion ecommerce white stage'
    ];
  }

  if (lowerTags.some((tag) => ['phone', 'laptop', 'device', 'electronics'].includes(tag))) {
    return [
      'sleek futuristic tech desk with blue glow',
      'modern electronics ad with reflective surface',
      'minimal black technology showcase'
    ];
  }

  return [
    'premium studio product photography',
    'minimal ecommerce commercial background',
    'vibrant promotional ad scene'
  ];
}

module.exports = {
  PRESET_MAP,
  getBasePrompt,
  getThemePrompts,
  getSuggestedPromptsFromTags
};