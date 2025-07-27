const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const { query } = require('../database/connection');

class AmazonScraper {
    constructor() {
        this.browser = null;
        this.proxyList = [];
        this.currentProxyIndex = 0;
        this.affiliateTag = process.env.AMAZON_AFFILIATE_TAG || 'dealgalaxy-21';
        this.baseUrl = 'https://www.amazon.in';
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ];
    }

    // Initialize browser with proxy support
    async initBrowser(useProxy = false) {
        try {
            const launchOptions = {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            };

            if (useProxy && this.proxyList.length > 0) {
                const proxy = this.getNextProxy();
                launchOptions.args.push(`--proxy-server=${proxy.protocol}://${proxy.ip}:${proxy.port}`);
            }

            this.browser = await puppeteer.launch(launchOptions);
            console.log('✅ Browser initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Browser initialization failed:', error.message);
            return false;
        }
    }

    // Load proxy list from external source
    async loadProxyList() {
        try {
            if (!process.env.USE_PROXY || process.env.USE_PROXY === 'false') {
                return [];
            }

            const response = await axios.get(process.env.PROXY_LIST_URL, { timeout: 10000 });
            const proxies = response.data.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const [ip, port] = line.trim().split(':');
                    return { ip, port: parseInt(port), protocol: 'http' };
                })
                .filter(proxy => proxy.ip && proxy.port);

            this.proxyList = proxies.slice(0, 50); // Limit to first 50 proxies
            console.log(`✅ Loaded ${this.proxyList.length} proxies`);
            return this.proxyList;
        } catch (error) {
            console.error('❌ Failed to load proxy list:', error.message);
            return [];
        }
    }

    // Get next proxy in rotation
    getNextProxy() {
        if (this.proxyList.length === 0) return null;
        const proxy = this.proxyList[this.currentProxyIndex];
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
        return proxy;
    }

    // Get random user agent
    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    // Add random delay to avoid detection
    async randomDelay() {
        const min = parseInt(process.env.SCRAPING_DELAY_MIN) || 1000;
        const max = parseInt(process.env.SCRAPING_DELAY_MAX) || 3000;
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Extract ASIN from Amazon URL
    extractASIN(url) {
        const asinMatch = url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
        return asinMatch ? asinMatch[1] : null;
    }

    // Generate affiliate URL
    generateAffiliateUrl(productUrl, asin) {
        try {
            const url = new URL(productUrl);
            url.searchParams.set('tag', this.affiliateTag);
            return url.toString();
        } catch (error) {
            return `${this.baseUrl}/dp/${asin}?tag=${this.affiliateTag}`;
        }
    }

    // Scrape product details from Amazon product page
    async scrapeProductDetails(productUrl) {
        let page = null;
        try {
            if (!this.browser) {
                await this.initBrowser();
            }

            page = await this.browser.newPage();
            await page.setUserAgent(this.getRandomUserAgent());
            
            // Set viewport and headers
            await page.setViewport({ width: 1366, height: 768 });
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            });

            // Navigate to product page
            await page.goto(productUrl, { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });

            await this.randomDelay();

            // Extract product data
            const productData = await page.evaluate(() => {
                const getTextContent = (selector) => {
                    const element = document.querySelector(selector);
                    return element ? element.textContent.trim() : null;
                };

                const getAttribute = (selector, attribute) => {
                    const element = document.querySelector(selector);
                    return element ? element.getAttribute(attribute) : null;
                };

                // Extract title
                const title = getTextContent('#productTitle') || 
                             getTextContent('.product-title') ||
                             getTextContent('h1.a-size-large');

                // Extract price information
                const currentPrice = getTextContent('.a-price-current .a-offscreen') ||
                                   getTextContent('.a-price .a-offscreen') ||
                                   getTextContent('#priceblock_dealprice') ||
                                   getTextContent('#priceblock_ourprice');

                const originalPrice = getTextContent('.a-price-was .a-offscreen') ||
                                    getTextContent('#priceblock_listprice') ||
                                    getTextContent('.a-text-strike .a-offscreen');

                // Extract image
                const imageUrl = getAttribute('#landingImage', 'src') ||
                               getAttribute('#imgBlkFront', 'src') ||
                               getAttribute('.a-dynamic-image', 'src');

                // Extract rating
                const rating = getTextContent('.a-icon-alt') ||
                             getTextContent('[data-hook="average-star-rating"] .a-icon-alt');

                // Extract review count
                const reviewCount = getTextContent('#acrCustomerReviewText') ||
                                  getTextContent('[data-hook="total-review-count"]');

                // Extract availability
                const availability = getTextContent('#availability span') ||
                                   getTextContent('.a-color-success') ||
                                   getTextContent('.a-color-state');

                // Check if Prime eligible
                const primeEligible = !!document.querySelector('[aria-label*="Prime"]') ||
                                    !!document.querySelector('.a-icon-prime');

                return {
                    title,
                    currentPrice,
                    originalPrice,
                    imageUrl,
                    rating,
                    reviewCount,
                    availability,
                    primeEligible
                };
            });

            // Process extracted data
            const asin = this.extractASIN(productUrl);
            const processedData = this.processProductData(productData, productUrl, asin);

            await page.close();
            return processedData;

        } catch (error) {
            console.error('❌ Error scraping product details:', error.message);
            if (page) await page.close();
            throw error;
        }
    }

    // Process and clean scraped product data
    processProductData(rawData, productUrl, asin) {
        const cleanPrice = (priceStr) => {
            if (!priceStr) return null;
            const match = priceStr.match(/[\d,]+\.?\d*/);
            return match ? parseFloat(match[0].replace(/,/g, '')) : null;
        };

        const cleanRating = (ratingStr) => {
            if (!ratingStr) return null;
            const match = ratingStr.match(/(\d+\.?\d*)/);
            return match ? parseFloat(match[1]) : null;
        };

        const cleanReviewCount = (reviewStr) => {
            if (!reviewStr) return null;
            const match = reviewStr.match(/[\d,]+/);
            return match ? parseInt(match[0].replace(/,/g, '')) : null;
        };

        const currentPrice = cleanPrice(rawData.currentPrice);
        const originalPrice = cleanPrice(rawData.originalPrice);
        const discountPercentage = (currentPrice && originalPrice && originalPrice > currentPrice) 
            ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
            : 0;

        return {
            asin,
            title: rawData.title || 'Unknown Product',
            price: currentPrice,
            originalPrice: originalPrice,
            discountPercentage,
            imageUrl: rawData.imageUrl,
            productUrl,
            affiliateUrl: this.generateAffiliateUrl(productUrl, asin),
            rating: cleanRating(rawData.rating),
            reviewCount: cleanReviewCount(rawData.reviewCount),
            availability: rawData.availability || 'Unknown',
            primeEligible: rawData.primeEligible || false,
            fetchedAt: new Date()
        };
    }

    // Search for products on Amazon
    async searchProducts(keyword, maxResults = 20) {
        let page = null;
        try {
            if (!this.browser) {
                await this.initBrowser();
            }

            page = await this.browser.newPage();
            await page.setUserAgent(this.getRandomUserAgent());
            await page.setViewport({ width: 1366, height: 768 });

            const searchUrl = `${this.baseUrl}/s?k=${encodeURIComponent(keyword)}`;
            await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            await this.randomDelay();

            // Extract search results
            const products = await page.evaluate((maxResults) => {
                const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');
                const results = [];

                for (let i = 0; i < Math.min(productElements.length, maxResults); i++) {
                    const element = productElements[i];
                    
                    const titleElement = element.querySelector('h2 a span') || element.querySelector('.s-title-instructions-style span');
                    const title = titleElement ? titleElement.textContent.trim() : null;

                    const linkElement = element.querySelector('h2 a');
                    const productUrl = linkElement ? 'https://www.amazon.in' + linkElement.getAttribute('href') : null;

                    const priceElement = element.querySelector('.a-price-current .a-offscreen') || element.querySelector('.a-price .a-offscreen');
                    const price = priceElement ? priceElement.textContent.trim() : null;

                    const imageElement = element.querySelector('.s-image');
                    const imageUrl = imageElement ? imageElement.getAttribute('src') : null;

                    const ratingElement = element.querySelector('.a-icon-alt');
                    const rating = ratingElement ? ratingElement.textContent.trim() : null;

                    if (title && productUrl) {
                        results.push({
                            title,
                            productUrl,
                            price,
                            imageUrl,
                            rating
                        });
                    }
                }

                return results;
            }, maxResults);

            await page.close();
            return products;

        } catch (error) {
            console.error('❌ Error searching products:', error.message);
            if (page) await page.close();
            throw error;
        }
    }

    // Get autocomplete suggestions
    async getAutocompleteSuggestions(query) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/s`, {
                params: {
                    k: query,
                    ref: 'nb_sb_noss'
                },
                headers: {
                    'User-Agent': this.getRandomUserAgent(),
                    'Accept': 'application/json'
                },
                timeout: 5000
            });

            // Parse suggestions from response
            const suggestions = [];
            if (response.data && response.data.suggestions) {
                response.data.suggestions.forEach(suggestion => {
                    if (suggestion.value) {
                        suggestions.push(suggestion.value);
                    }
                });
            }

            return suggestions.slice(0, 10); // Limit to 10 suggestions
        } catch (error) {
            console.error('❌ Error getting autocomplete suggestions:', error.message);
            return [];
        }
    }

    // Scrape deals from Amazon deals page
    async scrapeDeals(maxDeals = 50) {
        let page = null;
        try {
            if (!this.browser) {
                await this.initBrowser();
            }

            page = await this.browser.newPage();
            await page.setUserAgent(this.getRandomUserAgent());
            await page.setViewport({ width: 1366, height: 768 });

            const dealsUrl = `${this.baseUrl}/deals`;
            await page.goto(dealsUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            await this.randomDelay();

            // Extract deals
            const deals = await page.evaluate((maxDeals, baseUrl) => {
                const dealElements = document.querySelectorAll('[data-testid="deal-card"]');
                const results = [];

                for (let i = 0; i < Math.min(dealElements.length, maxDeals); i++) {
                    const element = dealElements[i];
                    
                    const titleElement = element.querySelector('[data-testid="deal-title"]');
                    const title = titleElement ? titleElement.textContent.trim() : null;

                    const linkElement = element.querySelector('a');
                    const productUrl = linkElement ? baseUrl + linkElement.getAttribute('href') : null;

                    const priceElement = element.querySelector('[data-testid="deal-price"]');
                    const price = priceElement ? priceElement.textContent.trim() : null;

                    const originalPriceElement = element.querySelector('[data-testid="list-price"]');
                    const originalPrice = originalPriceElement ? originalPriceElement.textContent.trim() : null;

                    const discountElement = element.querySelector('[data-testid="percentage-off"]');
                    const discount = discountElement ? discountElement.textContent.trim() : null;

                    const imageElement = element.querySelector('img');
                    const imageUrl = imageElement ? imageElement.getAttribute('src') : null;

                    if (title && productUrl) {
                        results.push({
                            title,
                            productUrl,
                            price,
                            originalPrice,
                            discount,
                            imageUrl,
                            dealType: 'deal_of_day'
                        });
                    }
                }

                return results;
            }, maxDeals, this.baseUrl);

            await page.close();
            return deals;

        } catch (error) {
            console.error('❌ Error scraping deals:', error.message);
            if (page) await page.close();
            throw error;
        }
    }

    // Close browser
    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            console.log('✅ Browser closed');
        }
    }

    // Cleanup method
    async cleanup() {
        await this.closeBrowser();
    }
}

module.exports = AmazonScraper;

