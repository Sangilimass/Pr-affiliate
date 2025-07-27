const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { searchLimiter, scrapingLimiter } = require('../middleware/rateLimiter');
const {
    searchProducts,
    getAutocompleteSuggestions,
    searchDeals,
    getTrendingSearches,
    getPersonalizedSuggestions
} = require('../controllers/searchController');

// Apply optional authentication to all routes
router.use(optionalAuth);

// Search routes with rate limiting
router.get('/products', scrapingLimiter, searchProducts);
router.get('/autocomplete', searchLimiter, getAutocompleteSuggestions);
router.get('/deals', searchLimiter, searchDeals);
router.get('/trending', getTrendingSearches);
router.get('/personalized', getPersonalizedSuggestions);

module.exports = router;

