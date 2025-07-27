const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'deal_galaxy',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        client.release();
        return true;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        return false;
    }
};

// Execute query with error handling
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
        return res;
    } catch (err) {
        console.error('Query error:', err);
        throw err;
    }
};

// Get a client from the pool for transactions
const getClient = async () => {
    return await pool.connect();
};

// Initialize database schema
const initializeDatabase = async () => {
    const fs = require('fs');
    const path = require('path');
    
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        await query(schema);
        console.log('✅ Database schema initialized successfully');
        return true;
    } catch (err) {
        console.error('❌ Database schema initialization failed:', err.message);
        return false;
    }
};

// Graceful shutdown
const closePool = async () => {
    try {
        await pool.end();
        console.log('✅ Database pool closed');
    } catch (err) {
        console.error('❌ Error closing database pool:', err);
    }
};

module.exports = {
    pool,
    query,
    getClient,
    testConnection,
    initializeDatabase,
    closePool
};

