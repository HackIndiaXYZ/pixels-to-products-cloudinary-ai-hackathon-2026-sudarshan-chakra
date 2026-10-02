const express = require('express');
const { searchCloudinaryAssets } = require('../controllers/assetController');

const router = express.Router();

// Search assets from Cloudinary
router.get('/search', searchCloudinaryAssets);

module.exports = router;