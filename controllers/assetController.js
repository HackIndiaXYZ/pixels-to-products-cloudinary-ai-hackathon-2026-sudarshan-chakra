const { searchAssets } = require('../services/cloudinaryService');

// Search assets stored in Cloudinary
async function searchCloudinaryAssets(req, res) {
  try {
    const query = req.query.q?.trim() || 'folder="adcraft_ai_campaigns/raw"';

    const result = await searchAssets(query);

    return res.json({
      success: true,
      total: result.total_count,
      resources: result.resources
    });
  } catch (error) {
    console.error('Asset Search Error:', {
      message: error.message,
      http_code: error.http_code
    });

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to search assets'
    });
  }
}

module.exports = {
  searchCloudinaryAssets
};