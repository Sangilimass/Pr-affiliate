const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Test routes
app.get('/', (req, res) => {
    res.json({ message: 'Test server is running' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mock deals endpoint
app.get('/api/deals', (req, res) => {
    res.json({
        success: true,
        deals: [
            {
                id: 1,
                title: 'Test Product',
                price: 1000,
                originalPrice: 1500,
                discountPercentage: 33,
                imageUrl: '/placeholder.jpg',
                category: 'Electronics'
            }
        ],
        hasMore: false
    });
});

// Mock auth endpoints
app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        token: 'mock-jwt-token',
        user: {
            id: 1,
            firstName: 'Demo',
            lastName: 'User',
            email: 'demo@dealgalaxy.com'
        }
    });
});

app.post('/api/auth/register', (req, res) => {
    res.json({
        success: true,
        token: 'mock-jwt-token',
        user: {
            id: 1,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email
        }
    });
});

// Mock tracking endpoints
app.get('/api/track', (req, res) => {
    res.json([]);
});

app.post('/api/track', (req, res) => {
    res.json({
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Test server running on port ${PORT}`);
});

