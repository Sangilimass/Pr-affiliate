const { query } = require('../database/connection');
const {
    hashPassword,
    comparePassword,
    createSession,
    validateEmail,
    validatePassword,
    generateVerificationToken,
    generateResetToken
} = require('../middleware/auth');

// Register new user
const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        // Validate input
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate password strength
        if (!validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long and contain uppercase, lowercase, and number'
            });
        }

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);
        const verificationToken = generateVerificationToken();

        // Create user
        const result = await query(
            `INSERT INTO users (email, password_hash, first_name, last_name, verification_token)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, first_name, last_name, is_verified`,
            [email.toLowerCase(), passwordHash, firstName, lastName, verificationToken]
        );

        const user = result.rows[0];

        // Create session
        const token = await createSession(
            user.id,
            req.ip,
            req.get('User-Agent')
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    isVerified: user.is_verified
                },
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const result = await query(
            'SELECT id, email, password_hash, first_name, last_name, is_verified FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await comparePassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Create session
        const token = await createSession(
            user.id,
            req.ip,
            req.get('User-Agent')
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    isVerified: user.is_verified
                },
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

// Logout user
const logout = async (req, res) => {
    try {
        const userId = req.user.id;

        // Delete user sessions
        await query(
            'DELETE FROM user_sessions WHERE user_id = $1',
            [userId]
        );

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            `SELECT id, email, first_name, last_name, is_verified, created_at,
                    (SELECT COUNT(*) FROM tracked_products WHERE user_id = $1 AND is_active = true) as tracked_count,
                    (SELECT COUNT(*) FROM tracked_products WHERE user_id = $1 AND alert_sent = true) as alerts_sent
             FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    isVerified: user.is_verified,
                    createdAt: user.created_at,
                    stats: {
                        trackedProducts: parseInt(user.tracked_count),
                        alertsSent: parseInt(user.alerts_sent)
                    }
                }
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile'
        });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName } = req.body;

        // Validate input
        if (!firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'First name and last name are required'
            });
        }

        // Update user
        const result = await query(
            `UPDATE users SET first_name = $1, last_name = $2, updated_at = NOW()
             WHERE id = $3
             RETURNING id, email, first_name, last_name, is_verified`,
            [firstName, lastName, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    isVerified: user.is_verified
                }
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Validate new password strength
        if (!validatePassword(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters long and contain uppercase, lowercase, and number'
            });
        }

        // Get current password hash
        const result = await query(
            'SELECT password_hash FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isValidPassword = await comparePassword(currentPassword, result.rows[0].password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const newPasswordHash = await hashPassword(newPassword);

        // Update password
        await query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [newPasswordHash, userId]
        );

        // Delete all user sessions to force re-login
        await query(
            'DELETE FROM user_sessions WHERE user_id = $1',
            [userId]
        );

        res.json({
            success: true,
            message: 'Password changed successfully. Please login again.'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword
};

