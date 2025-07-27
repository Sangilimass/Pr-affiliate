const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
require('dotenv').config();

const { testConnection, initializeDatabase, closePool } = require('./database/connection');
const { apiLimiter } = require('./middleware/rateLimiter');
const { cleanupExpiredSessions } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const dealsRoutes = require('./routes/deals');
const trackRoutes = require('./routes/track');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://deal-galaxy.com', 'https://www.deal-galaxy.com'] 
        : true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// Rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Deal Galaxy API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/search', searchRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Deal Galaxy API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            deals: '/api/deals',
            tracking: '/api/track',
            search: '/api/search'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    
    // Don't leak error details in production
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message;

    res.status(err.status || 500).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// Scheduled tasks
if (process.env.NODE_ENV !== 'test') {
    // Clean up expired sessions every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Running scheduled task: cleanup expired sessions');
        await cleanupExpiredSessions();
    });

    // Auto-refresh deals every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        console.log('Running scheduled task: refresh deals');
        try {
            const { refreshDeals } = require('./controllers/dealsController');
            // Create a mock request/response for the scheduled task
            const mockReq = { query: {}, body: {} };
            const mockRes = {
                json: (data) => console.log('Scheduled deals refresh result:', data),
                status: (code) => ({ json: (data) => console.log(`Status ${code}:`, data) })
            };
            await refreshDeals(mockReq, mockRes);
        } catch (error) {
            console.error('Scheduled deals refresh failed:', error);
        }
    });
}

// Initialize database and start server
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database');
            process.exit(1);
        }

        // Initialize database schema
        const schemaInitialized = await initializeDatabase();
        if (!schemaInitialized) {
            console.error('❌ Failed to initialize database schema');
            process.exit(1);
        }

        // Start server
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Deal Galaxy API server running on port ${PORT}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
        });

        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);
            
            server.close(async () => {
                console.log('🔌 HTTP server closed');
                
                try {
                    await closePool();
                    console.log('✅ Graceful shutdown completed');
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });

            // Force shutdown after 30 seconds
            setTimeout(() => {
                console.error('⏰ Forced shutdown after timeout');
                process.exit(1);
            }, 30000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        return server;

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start server if this file is run directly
if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };

