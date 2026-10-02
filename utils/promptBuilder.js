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

// Generate prompt suggestions from tags and preset
function getSuggestedPromptsFromTags(tags = [], preset = 'custom') {
  const lowerTags = tags.map((tag) => tag.toLowerCase());
  const cleanPreset = (preset || 'custom').toLowerCase();

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

  // Fallback suggestions based on preset when AI tags are unavailable
  if (cleanPreset === 'fashion') {
    return [
      'luxury fashion campaign with bold shadows',
      'minimal apparel studio backdrop',
      'premium retail editorial ad scene'
    ];
  }

  if (cleanPreset === 'beauty') {
    return [
      'soft skincare shelf with warm daylight',
      'minimal beauty studio in white tones',
      'premium cosmetic marble setup'
    ];
  }

  if (cleanPreset === 'electronics') {
    return [
      'sleek futuristic tech desk with blue glow',
      'minimal black electronics showcase',
      'premium reflective product launch setup'
    ];
  }

  if (cleanPreset === 'food') {
    return [
      'fresh product showcase with vibrant food styling',
      'minimal tabletop packaging ad',
      'bright promotional food campaign scene'
    ];
  }

  if (cleanPreset === 'jewelry') {
    return [
      'luxury jewelry display with dark reflections',
      'minimal premium accessory setup',
      'elegant showcase with metallic highlights'
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
