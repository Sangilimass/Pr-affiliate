const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../database/connection');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Hash password
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user exists and token is valid
        const userResult = await query(
            'SELECT id, email, first_name, last_name, is_verified FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token - user not found'
            });
        }

        // Check if session exists and is valid
        const sessionResult = await query(
            'SELECT id FROM user_sessions WHERE user_id = $1 AND expires_at > NOW()',
            [decoded.userId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Session expired'
            });
        }

        // Update last used timestamp
        await query(
            'UPDATE user_sessions SET last_used = NOW() WHERE user_id = $1',
            [decoded.userId]
        );

        // Attach user to request
        req.user = userResult.rows[0];
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const userResult = await query(
            'SELECT id, email, first_name, last_name, is_verified FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length > 0) {
            req.user = userResult.rows[0];
        } else {
            req.user = null;
        }

        next();

    } catch (error) {
        req.user = null;
        next();
    }
};

// Create user session
const createSession = async (userId, ipAddress, userAgent) => {
    try {
        const token = generateToken(userId);
        const tokenHash = await hashPassword(token);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await query(
            `INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, tokenHash, expiresAt, ipAddress, userAgent]
        );

        return token;
    } catch (error) {
        console.error('Error creating session:', error);
        throw error;
    }
};

// Cleanup expired sessions
const cleanupExpiredSessions = async () => {
    try {
        const result = await query(
            'DELETE FROM user_sessions WHERE expires_at < NOW()'
        );
        console.log(`Cleaned up ${result.rowCount} expired sessions`);
    } catch (error) {
        console.error('Error cleaning up sessions:', error);
    }
};

// Validate email format
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password strength
const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

// Generate verification token
const generateVerificationToken = () => {
    return require('crypto').randomBytes(32).toString('hex');
};

// Generate password reset token
const generateResetToken = () => {
    return require('crypto').randomBytes(32).toString('hex');
};

module.exports = {
    generateToken,
    hashPassword,
    comparePassword,
    authenticateToken,
    optionalAuth,
    createSession,
    cleanupExpiredSessions,
    validateEmail,
    validatePassword,
    generateVerificationToken,
    generateResetToken
};

