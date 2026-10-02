// Sanitize text so it is safer to use inside Cloudinary transformation URLs
function sanitizePrompt(prompt = '') {
  return prompt
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9,_-]/g, '');
}

// Capitalize the first letter of a string
function capitalize(value = '') {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

module.exports = {
  sanitizePrompt,
  capitalize
};