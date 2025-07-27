-- Deal Galaxy Database Schema

-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DealsCache table for storing scraped deals
CREATE TABLE IF NOT EXISTS deals_cache (
    id SERIAL PRIMARY KEY,
    asin VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    price DECIMAL(10, 2),
    original_price DECIMAL(10, 2),
    discount_percentage INTEGER,
    image_url TEXT,
    product_url TEXT NOT NULL,
    affiliate_url TEXT,
    category VARCHAR(100),
    rating DECIMAL(2, 1),
    review_count INTEGER,
    availability VARCHAR(50),
    prime_eligible BOOLEAN DEFAULT FALSE,
    deal_type VARCHAR(50), -- lightning, deal_of_day, coupon, etc.
    deal_expires_at TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TrackedProducts table for user price tracking
CREATE TABLE IF NOT EXISTS tracked_products (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    asin VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    current_price DECIMAL(10, 2),
    target_price DECIMAL(10, 2),
    image_url TEXT,
    product_url TEXT NOT NULL,
    affiliate_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    alert_sent BOOLEAN DEFAULT FALSE,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, asin)
);

-- BlogPosts table for content management
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image TEXT,
    author VARCHAR(100) DEFAULT 'Deal Galaxy Team',
    status VARCHAR(20) DEFAULT 'published', -- draft, published, archived
    meta_title VARCHAR(255),
    meta_description TEXT,
    tags TEXT[], -- Array of tags
    view_count INTEGER DEFAULT 0,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price History table for tracking price changes
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    asin VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'scraper' -- scraper, manual, api
);

-- User Sessions table for managing authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Proxy Pool table for managing proxy rotation
CREATE TABLE IF NOT EXISTS proxy_pool (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    port INTEGER NOT NULL,
    protocol VARCHAR(10) DEFAULT 'http', -- http, https, socks4, socks5
    country VARCHAR(2),
    is_active BOOLEAN DEFAULT TRUE,
    success_rate DECIMAL(5, 2) DEFAULT 0.00,
    last_tested TIMESTAMP,
    response_time INTEGER, -- in milliseconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ip_address, port)
);

-- Scraping Jobs table for managing scraping tasks
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id SERIAL PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL, -- deals, product_track, search
    status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed
    parameters JSONB,
    result JSONB,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deals_cache_asin ON deals_cache(asin);
CREATE INDEX IF NOT EXISTS idx_deals_cache_fetched_at ON deals_cache(fetched_at);
CREATE INDEX IF NOT EXISTS idx_deals_cache_is_active ON deals_cache(is_active);
CREATE INDEX IF NOT EXISTS idx_deals_cache_category ON deals_cache(category);
CREATE INDEX IF NOT EXISTS idx_deals_cache_deal_type ON deals_cache(deal_type);

CREATE INDEX IF NOT EXISTS idx_tracked_products_user_id ON tracked_products(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_products_asin ON tracked_products(asin);
CREATE INDEX IF NOT EXISTS idx_tracked_products_is_active ON tracked_products(is_active);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

CREATE INDEX IF NOT EXISTS idx_price_history_asin ON price_history(asin);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_proxy_pool_is_active ON proxy_pool(is_active);
CREATE INDEX IF NOT EXISTS idx_proxy_pool_success_rate ON proxy_pool(success_rate);

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_cache_updated_at BEFORE UPDATE ON deals_cache FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracked_products_updated_at BEFORE UPDATE ON tracked_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proxy_pool_updated_at BEFORE UPDATE ON proxy_pool FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

