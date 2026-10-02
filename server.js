require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db');
require('./config/cloudinary');

const campaignRoutes = require('./routes/campaignRoutes');
const assetRoutes = require('./routes/assetRoutes');

const app = express();

// Connect to MongoDB database
connectDB();

// Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api/campaigns', campaignRoutes);
app.use('/api/assets', assetRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AdCraft AI backend is running'
  });
});

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/history', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'history.html'));
});

app.get('/campaign/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'campaign.html'));
});

app.get('/assets', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assets.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`AdCraft AI server running at http://localhost:${PORT}`);
});