const { query } = require('../database/connection');
const AmazonScraper = require('../services/amazonScraper');

// Get deals with pagination
const getDeals = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const category = req.query.category;
        const minDiscount = parseInt(req.query.minDiscount) || 0;
        const maxPrice = parseFloat(req.query.maxPrice);
        const sortBy = req.query.sortBy || 'fetched_at'; // fetched_at, discount_percentage, price
        const sortOrder = req.query.sortOrder || 'DESC';

        // Validate limit and offset
        if (limit > 100) {
            return res.status(400).json({
                success: false,
                message: 'Limit cannot exceed 100'
            });
        }

        // Build query conditions
        let whereConditions = ['is_active = true'];
        let queryParams = [];
        let paramIndex = 1;

        if (category) {
            whereConditions.push(`category ILIKE $${paramIndex}`);
            queryParams.push(`%${category}%`);
            paramIndex++;
        }

        if (minDiscount > 0) {
            whereConditions.push(`discount_percentage >= $${paramIndex}`);
            queryParams.push(minDiscount);
            paramIndex++;
        }

        if (maxPrice) {
            whereConditions.push(`price <= $${paramIndex}`);
            queryParams.push(maxPrice);
            paramIndex++;
        }

        // Validate sort parameters
        const validSortColumns = ['fetched_at', 'discount_percentage', 'price', 'rating'];
        const validSortOrders = ['ASC', 'DESC'];
        
        if (!validSortColumns.includes(sortBy) || !validSortOrders.includes(sortOrder.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sort parameters'
            });
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get deals
        const dealsQuery = `
            SELECT 
                id, asin, title, price, original_price, discount_percentage,
                image_url, product_url, affiliate_url, category, rating,
                review_count, availability, prime_eligible, deal_type,
                deal_expires_at, fetched_at
            FROM deals_cache
            ${whereClause}
            ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);

        const dealsResult = await query(dealsQuery, queryParams);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM deals_cache
            ${whereClause}
        `;

        const countResult = await query(countQuery, queryParams.slice(0, -2)); // Remove limit and offset
        const totalDeals = parseInt(countResult.rows[0].total);

        // Calculate pagination info
        const totalPages = Math.ceil(totalDeals / limit);
        const currentPage = Math.floor(offset / limit) + 1;
        const hasNextPage = offset + limit < totalDeals;
        const hasPrevPage = offset > 0;

        res.json({
            success: true,
            data: {
                deals: dealsResult.rows,
                pagination: {
                    currentPage,
                    totalPages,
                    totalDeals,
                    limit,
                    offset,
                    hasNextPage,
                    hasPrevPage
                },
                fetchedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Get deals error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch deals'
        });
    }
};

// Refresh deals by scraping Amazon
const refreshDeals = async (req, res) => {
    try {
        const scraper = new AmazonScraper();
        
        // Initialize scraper
        await scraper.loadProxyList();
        await scraper.initBrowser(process.env.USE_PROXY === 'true');

        // Scrape deals
        const scrapedDeals = await scraper.scrapeDeals(50);

        if (scrapedDeals.length === 0) {
            await scraper.cleanup();
            return res.status(404).json({
                success: false,
                message: 'No deals found'
            });
        }

        // Process and save deals
        let savedCount = 0;
        let updatedCount = 0;

        for (const deal of scrapedDeals) {
            try {
                // Extract ASIN from URL
                const asin = scraper.extractASIN(deal.productUrl);
                if (!asin) continue;

                // Get detailed product information
                const productDetails = await scraper.scrapeProductDetails(deal.productUrl);
                
                // Check if deal already exists
                const existingDeal = await query(
                    'SELECT id FROM deals_cache WHERE asin = $1',
                    [asin]
                );

                if (existingDeal.rows.length > 0) {
                    // Update existing deal
                    await query(
                        `UPDATE deals_cache SET
                            title = $1, price = $2, original_price = $3, discount_percentage = $4,
                            image_url = $5, product_url = $6, affiliate_url = $7, rating = $8,
                            review_count = $9, availability = $10, prime_eligible = $11,
                            deal_type = $12, fetched_at = NOW(), updated_at = NOW()
                         WHERE asin = $13`,
                        [
                            productDetails.title, productDetails.price, productDetails.originalPrice,
                            productDetails.discountPercentage, productDetails.imageUrl, productDetails.productUrl,
                            productDetails.affiliateUrl, productDetails.rating, productDetails.reviewCount,
                            productDetails.availability, productDetails.primeEligible, deal.dealType || 'deal',
                            asin
                        ]
                    );
                    updatedCount++;
                } else {
                    // Insert new deal
                    await query(
                        `INSERT INTO deals_cache (
                            asin, title, price, original_price, discount_percentage,
                            image_url, product_url, affiliate_url, rating, review_count,
                            availability, prime_eligible, deal_type, fetched_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
                        [
                            asin, productDetails.title, productDetails.price, productDetails.originalPrice,
                            productDetails.discountPercentage, productDetails.imageUrl, productDetails.productUrl,
                            productDetails.affiliateUrl, productDetails.rating, productDetails.reviewCount,
                            productDetails.availability, productDetails.primeEligible, deal.dealType || 'deal'
                        ]
                    );
                    savedCount++;
                }

                // Add small delay between requests
                await scraper.randomDelay();

            } catch (dealError) {
                console.error('Error processing deal:', dealError.message);
                continue;
            }
        }

        await scraper.cleanup();

        res.json({
            success: true,
            message: 'Deals refreshed successfully',
            data: {
                scrapedDeals: scrapedDeals.length,
                savedDeals: savedCount,
                updatedDeals: updatedCount,
                fetchedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Refresh deals error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh deals'
        });
    }
};

// Get deal by ID
const getDealById = async (req, res) => {
    try {
        const dealId = parseInt(req.params.id);

        if (!dealId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid deal ID'
            });
        }

        const result = await query(
            `SELECT 
                id, asin, title, price, original_price, discount_percentage,
                image_url, product_url, affiliate_url, category, rating,
                review_count, availability, prime_eligible, deal_type,
                deal_expires_at, fetched_at, created_at
             FROM deals_cache
             WHERE id = $1 AND is_active = true`,
            [dealId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Deal not found'
            });
        }

        res.json({
            success: true,
            data: {
                deal: result.rows[0]
            }
        });

    } catch (error) {
        console.error('Get deal by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch deal'
        });
    }
};

// Get deal categories
const getCategories = async (req, res) => {
    try {
        const result = await query(
            `SELECT category, COUNT(*) as deal_count
             FROM deals_cache
             WHERE is_active = true AND category IS NOT NULL
             GROUP BY category
             ORDER BY deal_count DESC
             LIMIT 20`
        );

        res.json({
            success: true,
            data: {
                categories: result.rows
            }
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
};

// Get deal statistics
const getDealStats = async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_deals,
                COUNT(CASE WHEN discount_percentage >= 50 THEN 1 END) as high_discount_deals,
                COUNT(CASE WHEN prime_eligible = true THEN 1 END) as prime_deals,
                AVG(discount_percentage) as avg_discount,
                MAX(fetched_at) as last_updated
            FROM deals_cache
            WHERE is_active = true
        `;

        const result = await query(statsQuery);
        const stats = result.rows[0];

        res.json({
            success: true,
            data: {
                stats: {
                    totalDeals: parseInt(stats.total_deals),
                    highDiscountDeals: parseInt(stats.high_discount_deals),
                    primeDeals: parseInt(stats.prime_deals),
                    averageDiscount: parseFloat(stats.avg_discount) || 0,
                    lastUpdated: stats.last_updated
                }
            }
        });

    } catch (error) {
        console.error('Get deal stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch deal statistics'
        });
    }
};

module.exports = {
    getDeals,
    refreshDeals,
    getDealById,
    getCategories,
    getDealStats
};

