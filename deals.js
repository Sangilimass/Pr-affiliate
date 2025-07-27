const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { scrapingLimiter } = require('../middleware/rateLimiter');
const {
    getDeals,
    refreshDeals,
    getDealById,
    getCategories,
    getDealStats
} = require('../controllers/dealsController');

// Apply optional authentication to all routes
router.use(optionalAuth);

// Public routes
router.get('/', getDeals);
router.get('/stats', getDealStats);
router.get('/categories', getCategories);
router.get('/:id', getDealById);

// Admin/scraping routes (with rate limiting)
router.post('/refresh', scrapingLimiter, refreshDeals);

module.exports = router;

