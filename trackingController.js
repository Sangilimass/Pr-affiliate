const { query } = require('../database/connection');
const AmazonScraper = require('../services/amazonScraper');

// Track a product (add to user's tracking list)
const trackProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productUrl, keyword, targetPrice } = req.body;

        // Validate input
        if (!productUrl && !keyword) {
            return res.status(400).json({
                success: false,
                message: 'Product URL or keyword is required'
            });
        }

        if (targetPrice && (isNaN(targetPrice) || targetPrice <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Target price must be a positive number'
            });
        }

        const scraper = new AmazonScraper();
        let productData = null;

        try {
            await scraper.loadProxyList();
            await scraper.initBrowser(process.env.USE_PROXY === 'true');

            if (productUrl) {
                // Scrape product details from URL
                productData = await scraper.scrapeProductDetails(productUrl);
            } else if (keyword) {
                // Search for products and get the first result
                const searchResults = await scraper.searchProducts(keyword, 1);
                if (searchResults.length === 0) {
                    await scraper.cleanup();
                    return res.status(404).json({
                        success: false,
                        message: 'No products found for the given keyword'
                    });
                }

                // Get detailed information for the first result
                productData = await scraper.scrapeProductDetails(searchResults[0].productUrl);
            }

            await scraper.cleanup();

            if (!productData || !productData.asin) {
                return res.status(400).json({
                    success: false,
                    message: 'Unable to extract product information'
                });
            }

            // Check if user is already tracking this product
            const existingTrack = await query(
                'SELECT id FROM tracked_products WHERE user_id = $1 AND asin = $2',
                [userId, productData.asin]
            );

            if (existingTrack.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Product is already being tracked'
                });
            }

            // Insert tracked product
            const result = await query(
                `INSERT INTO tracked_products (
                    user_id, asin, title, current_price, target_price,
                    image_url, product_url, affiliate_url, last_checked
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                RETURNING id, asin, title, current_price, target_price, image_url, created_at`,
                [
                    userId, productData.asin, productData.title, productData.price,
                    targetPrice || null, productData.imageUrl, productData.productUrl,
                    productData.affiliateUrl
                ]
            );

            // Also save to price history
            if (productData.price) {
                await query(
                    'INSERT INTO price_history (asin, price, source) VALUES ($1, $2, $3)',
                    [productData.asin, productData.price, 'tracking']
                );
            }

            res.status(201).json({
                success: true,
                message: 'Product added to tracking list',
                data: {
                    trackedProduct: result.rows[0],
                    productDetails: productData
                }
            });

        } catch (scrapingError) {
            await scraper.cleanup();
            throw scrapingError;
        }

    } catch (error) {
        console.error('Track product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track product'
        });
    }
};

// Get user's tracked products
const getTrackedProducts = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const sortBy = req.query.sortBy || 'created_at';
        const sortOrder = req.query.sortOrder || 'DESC';

        // Validate access (users can only see their own tracked products)
        if (userId != req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Validate sort parameters
        const validSortColumns = ['created_at', 'last_checked', 'current_price', 'target_price', 'title'];
        const validSortOrders = ['ASC', 'DESC'];
        
        if (!validSortColumns.includes(sortBy) || !validSortOrders.includes(sortOrder.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sort parameters'
            });
        }

        // Get tracked products
        const result = await query(
            `SELECT 
                id, asin, title, current_price, target_price, image_url,
                product_url, affiliate_url, is_active, alert_sent,
                last_checked, created_at,
                CASE 
                    WHEN target_price IS NOT NULL AND current_price IS NOT NULL AND current_price <= target_price 
                    THEN true 
                    ELSE false 
                END as target_reached
             FROM tracked_products
             WHERE user_id = $1 AND is_active = true
             ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        // Get total count
        const countResult = await query(
            'SELECT COUNT(*) as total FROM tracked_products WHERE user_id = $1 AND is_active = true',
            [userId]
        );

        const totalProducts = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalProducts / limit);
        const currentPage = Math.floor(offset / limit) + 1;

        res.json({
            success: true,
            data: {
                trackedProducts: result.rows,
                pagination: {
                    currentPage,
                    totalPages,
                    totalProducts,
                    limit,
                    offset,
                    hasNextPage: offset + limit < totalProducts,
                    hasPrevPage: offset > 0
                }
            }
        });

    } catch (error) {
        console.error('Get tracked products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tracked products'
        });
    }
};

// Update tracked product (change target price or remove)
const updateTrackedProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = parseInt(req.params.id);
        const { targetPrice, isActive } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        // Verify ownership
        const ownershipCheck = await query(
            'SELECT id FROM tracked_products WHERE id = $1 AND user_id = $2',
            [productId, userId]
        );

        if (ownershipCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tracked product not found'
            });
        }

        // Build update query
        let updateFields = [];
        let queryParams = [];
        let paramIndex = 1;

        if (targetPrice !== undefined) {
            if (targetPrice !== null && (isNaN(targetPrice) || targetPrice <= 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Target price must be a positive number or null'
                });
            }
            updateFields.push(`target_price = $${paramIndex}`);
            queryParams.push(targetPrice);
            paramIndex++;
        }

        if (isActive !== undefined) {
            updateFields.push(`is_active = $${paramIndex}`);
            queryParams.push(isActive);
            paramIndex++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateFields.push(`updated_at = NOW()`);
        queryParams.push(productId);

        const updateQuery = `
            UPDATE tracked_products 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, asin, title, current_price, target_price, is_active, updated_at
        `;

        const result = await query(updateQuery, queryParams);

        res.json({
            success: true,
            message: 'Tracked product updated successfully',
            data: {
                trackedProduct: result.rows[0]
            }
        });

    } catch (error) {
        console.error('Update tracked product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update tracked product'
        });
    }
};

// Remove tracked product
const removeTrackedProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = parseInt(req.params.id);

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        // Verify ownership and delete
        const result = await query(
            'DELETE FROM tracked_products WHERE id = $1 AND user_id = $2 RETURNING id',
            [productId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tracked product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product removed from tracking list'
        });

    } catch (error) {
        console.error('Remove tracked product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove tracked product'
        });
    }
};

// Refresh prices for tracked products
const refreshTrackedPrices = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.id ? parseInt(req.params.id) : null;

        // Get tracked products to refresh
        let whereClause = 'user_id = $1 AND is_active = true';
        let queryParams = [userId];

        if (productId) {
            whereClause += ' AND id = $2';
            queryParams.push(productId);
        }

        const trackedProducts = await query(
            `SELECT id, asin, product_url, target_price FROM tracked_products WHERE ${whereClause}`,
            queryParams
        );

        if (trackedProducts.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No tracked products found'
            });
        }

        const scraper = new AmazonScraper();
        await scraper.loadProxyList();
        await scraper.initBrowser(process.env.USE_PROXY === 'true');

        let updatedCount = 0;
        let alertsTriggered = 0;

        for (const product of trackedProducts.rows) {
            try {
                // Scrape current price
                const productData = await scraper.scrapeProductDetails(product.product_url);
                
                if (productData && productData.price) {
                    // Update tracked product
                    await query(
                        `UPDATE tracked_products 
                         SET current_price = $1, last_checked = NOW(), updated_at = NOW()
                         WHERE id = $2`,
                        [productData.price, product.id]
                    );

                    // Add to price history
                    await query(
                        'INSERT INTO price_history (asin, price, source) VALUES ($1, $2, $3)',
                        [product.asin, productData.price, 'refresh']
                    );

                    // Check if target price is reached
                    if (product.target_price && productData.price <= product.target_price) {
                        await query(
                            'UPDATE tracked_products SET alert_sent = true WHERE id = $1',
                            [product.id]
                        );
                        alertsTriggered++;
                    }

                    updatedCount++;
                }

                // Add delay between requests
                await scraper.randomDelay();

            } catch (productError) {
                console.error(`Error refreshing product ${product.id}:`, productError.message);
                continue;
            }
        }

        await scraper.cleanup();

        res.json({
            success: true,
            message: 'Tracked product prices refreshed',
            data: {
                totalProducts: trackedProducts.rows.length,
                updatedProducts: updatedCount,
                alertsTriggered
            }
        });

    } catch (error) {
        console.error('Refresh tracked prices error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh tracked prices'
        });
    }
};

// Get price history for a product
const getPriceHistory = async (req, res) => {
    try {
        const asin = req.params.asin;
        const days = parseInt(req.query.days) || 30;

        if (!asin) {
            return res.status(400).json({
                success: false,
                message: 'ASIN is required'
            });
        }

        const result = await query(
            `SELECT price, recorded_at, source
             FROM price_history
             WHERE asin = $1 AND recorded_at >= NOW() - INTERVAL '${days} days'
             ORDER BY recorded_at ASC`,
            [asin]
        );

        res.json({
            success: true,
            data: {
                asin,
                priceHistory: result.rows,
                days
            }
        });

    } catch (error) {
        console.error('Get price history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch price history'
        });
    }
};

module.exports = {
    trackProduct,
    getTrackedProducts,
    updateTrackedProduct,
    removeTrackedProduct,
    refreshTrackedPrices,
    getPriceHistory
};

