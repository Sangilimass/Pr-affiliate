const { query } = require('../database/connection');
const AmazonScraper = require('../services/amazonScraper');

// Search products on Amazon
const searchProducts = async (req, res) => {
    try {
        const { q: searchQuery, limit = 20 } = req.query;

        if (!searchQuery || searchQuery.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const maxResults = Math.min(parseInt(limit), 50); // Limit to 50 results max

        const scraper = new AmazonScraper();
        
        try {
            await scraper.loadProxyList();
            await scraper.initBrowser(process.env.USE_PROXY === 'true');

            // Search for products
            const searchResults = await scraper.searchProducts(searchQuery.trim(), maxResults);

            await scraper.cleanup();

            if (searchResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No products found for the search query'
                });
            }

            // Process search results to add affiliate links
            const processedResults = searchResults.map(product => {
                const asin = scraper.extractASIN(product.productUrl);
                return {
                    ...product,
                    asin,
                    affiliateUrl: asin ? scraper.generateAffiliateUrl(product.productUrl, asin) : product.productUrl
                };
            });

            res.json({
                success: true,
                data: {
                    query: searchQuery,
                    results: processedResults,
                    totalResults: processedResults.length,
                    searchedAt: new Date().toISOString()
                }
            });

        } catch (scrapingError) {
            await scraper.cleanup();
            throw scrapingError;
        }

    } catch (error) {
        console.error('Search products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search products'
        });
    }
};

// Get autocomplete suggestions
const getAutocompleteSuggestions = async (req, res) => {
    try {
        const { q: query } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Query must be at least 2 characters long'
            });
        }

        const scraper = new AmazonScraper();
        
        try {
            // Get suggestions from Amazon
            const suggestions = await scraper.getAutocompleteSuggestions(query.trim());

            res.json({
                success: true,
                data: {
                    query: query.trim(),
                    suggestions,
                    totalSuggestions: suggestions.length
                }
            });

        } catch (scrapingError) {
            console.error('Autocomplete error:', scrapingError);
            // Return empty suggestions on error instead of failing
            res.json({
                success: true,
                data: {
                    query: query.trim(),
                    suggestions: [],
                    totalSuggestions: 0
                }
            });
        }

    } catch (error) {
        console.error('Get autocomplete suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get suggestions'
        });
    }
};

// Search deals in cache
const searchDeals = async (req, res) => {
    try {
        const { q: searchQuery, category, minDiscount, maxPrice, limit = 20, offset = 0 } = req.query;

        if (!searchQuery || searchQuery.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const searchLimit = Math.min(parseInt(limit), 100);
        const searchOffset = parseInt(offset) || 0;

        // Build search conditions
        let whereConditions = ['is_active = true'];
        let queryParams = [];
        let paramIndex = 1;

        // Add text search
        whereConditions.push(`(title ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`);
        queryParams.push(`%${searchQuery.trim()}%`);
        paramIndex++;

        if (category) {
            whereConditions.push(`category ILIKE $${paramIndex}`);
            queryParams.push(`%${category}%`);
            paramIndex++;
        }

        if (minDiscount) {
            const discount = parseInt(minDiscount);
            if (discount > 0) {
                whereConditions.push(`discount_percentage >= $${paramIndex}`);
                queryParams.push(discount);
                paramIndex++;
            }
        }

        if (maxPrice) {
            const price = parseFloat(maxPrice);
            if (price > 0) {
                whereConditions.push(`price <= $${paramIndex}`);
                queryParams.push(price);
                paramIndex++;
            }
        }

        const whereClause = whereConditions.join(' AND ');

        // Search deals
        const searchResults = await query(
            `SELECT 
                id, asin, title, price, original_price, discount_percentage,
                image_url, product_url, affiliate_url, category, rating,
                review_count, availability, prime_eligible, deal_type,
                deal_expires_at, fetched_at
             FROM deals_cache
             WHERE ${whereClause}
             ORDER BY 
                CASE WHEN title ILIKE $1 THEN 1 ELSE 2 END,
                discount_percentage DESC,
                fetched_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...queryParams, searchLimit, searchOffset]
        );

        // Get total count
        const countResult = await query(
            `SELECT COUNT(*) as total FROM deals_cache WHERE ${whereClause}`,
            queryParams
        );

        const totalResults = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalResults / searchLimit);
        const currentPage = Math.floor(searchOffset / searchLimit) + 1;

        res.json({
            success: true,
            data: {
                query: searchQuery.trim(),
                results: searchResults.rows,
                pagination: {
                    currentPage,
                    totalPages,
                    totalResults,
                    limit: searchLimit,
                    offset: searchOffset,
                    hasNextPage: searchOffset + searchLimit < totalResults,
                    hasPrevPage: searchOffset > 0
                },
                searchedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Search deals error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search deals'
        });
    }
};

// Get trending searches (based on cached deals)
const getTrendingSearches = async (req, res) => {
    try {
        const result = await query(
            `SELECT 
                LOWER(TRIM(unnest(string_to_array(title, ' ')))) as keyword,
                COUNT(*) as frequency
             FROM deals_cache
             WHERE is_active = true 
                AND fetched_at >= NOW() - INTERVAL '7 days'
                AND LENGTH(TRIM(unnest(string_to_array(title, ' ')))) > 3
             GROUP BY LOWER(TRIM(unnest(string_to_array(title, ' '))))
             HAVING COUNT(*) >= 3
             ORDER BY frequency DESC
             LIMIT 20`
        );

        // Filter out common words
        const commonWords = ['the', 'and', 'for', 'with', 'from', 'pack', 'set', 'new', 'best', 'top', 'high', 'low', 'free', 'sale'];
        const trendingKeywords = result.rows
            .filter(row => !commonWords.includes(row.keyword))
            .slice(0, 10);

        res.json({
            success: true,
            data: {
                trendingSearches: trendingKeywords
            }
        });

    } catch (error) {
        console.error('Get trending searches error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trending searches'
        });
    }
};

// Get search suggestions based on user's tracked products
const getPersonalizedSuggestions = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Get categories from user's tracked products
        const result = await query(
            `SELECT DISTINCT 
                CASE 
                    WHEN tp.title ILIKE '%phone%' OR tp.title ILIKE '%mobile%' THEN 'Electronics'
                    WHEN tp.title ILIKE '%book%' THEN 'Books'
                    WHEN tp.title ILIKE '%cloth%' OR tp.title ILIKE '%shirt%' OR tp.title ILIKE '%dress%' THEN 'Fashion'
                    WHEN tp.title ILIKE '%home%' OR tp.title ILIKE '%kitchen%' THEN 'Home & Kitchen'
                    ELSE 'General'
                END as category,
                COUNT(*) as interest_score
             FROM tracked_products tp
             WHERE tp.user_id = $1 AND tp.is_active = true
             GROUP BY category
             ORDER BY interest_score DESC
             LIMIT 5`,
            [userId]
        );

        const personalizedCategories = result.rows;

        // Get related deals based on user interests
        let relatedDeals = [];
        if (personalizedCategories.length > 0) {
            const categoryConditions = personalizedCategories
                .map((_, index) => `category ILIKE $${index + 2}`)
                .join(' OR ');

            const categoryParams = personalizedCategories.map(cat => `%${cat.category}%`);

            const dealsResult = await query(
                `SELECT title, category, discount_percentage
                 FROM deals_cache
                 WHERE is_active = true AND (${categoryConditions})
                 ORDER BY discount_percentage DESC
                 LIMIT 10`,
                [userId, ...categoryParams]
            );

            relatedDeals = dealsResult.rows;
        }

        res.json({
            success: true,
            data: {
                personalizedCategories,
                relatedDeals,
                suggestions: personalizedCategories.map(cat => cat.category)
            }
        });

    } catch (error) {
        console.error('Get personalized suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch personalized suggestions'
        });
    }
};

module.exports = {
    searchProducts,
    getAutocompleteSuggestions,
    searchDeals,
    getTrendingSearches,
    getPersonalizedSuggestions
};

