const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { scrapingLimiter } = require('../middleware/rateLimiter');
const {
    trackProduct,
    getTrackedProducts,
    updateTrackedProduct,
    removeTrackedProduct,
    refreshTrackedPrices,
    getPriceHistory
} = require('../controllers/trackingController');

// Apply authentication to all routes
router.use(authenticateToken);

// Tracking routes
router.post('/', scrapingLimiter, trackProduct);
router.get('/', getTrackedProducts);
router.put('/:id', updateTrackedProduct);
router.delete('/:id', removeTrackedProduct);

// Price refresh routes (with rate limiting)
router.post('/refresh', scrapingLimiter, refreshTrackedPrices);
router.post('/refresh/:id', scrapingLimiter, refreshTrackedPrices);

// Price history route
router.get('/history/:asin', getPriceHistory);

module.exports = router;

