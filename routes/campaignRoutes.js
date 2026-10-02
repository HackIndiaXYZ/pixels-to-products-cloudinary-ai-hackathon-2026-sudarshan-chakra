const express = require('express');
const {
  uploadMiddleware,
  generateCampaign,
  getCampaigns,
  getCampaignById,
  deleteCampaign
} = require('../controllers/campaignController');

const router = express.Router();

// Generate a new campaign
router.post('/generate', uploadMiddleware, generateCampaign);

// Get all campaigns
router.get('/', getCampaigns);

// Get one campaign by ID
router.get('/:id', getCampaignById);

// Delete one campaign by ID
router.delete('/:id', deleteCampaign);

module.exports = router;