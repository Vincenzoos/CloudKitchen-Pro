const express = require('express');
const User = require('../models/User');
const { userValidationMiddleware } = require('../middleware/validation');
const { EMAIL_REGEX, PASSWORD_REGEX, PASSWORD_MIN_LENGTH } = require('../utils/user/constants');
const STUDENT_ID = "33810672";
const STUDENT_NAME = "Viet Tran";

const router = express.Router();

// ============================================
// REGISTRATION ROUTE
// ============================================

// POST user registration - uses userValidationMiddleware
router.post(`/register-${STUDENT_ID}`, userValidationMiddleware, async (req, res) => {
    // Check for validation errors
    if (req.validationErrors && req.validationErrors.length) {
        // status 400: Bad Request
        return res.status(400).json({ errors: req.validationErrors });
    }
    // Proceed to create user
    try {
        // Get validated user data
        const data = req.validatedUser;

        // Check if user already exists by email, return conflict if so
        const exists = await User.findOne({ email: data.email });
        // status 409: Conflict
        if (exists) return res.status(409).json({ error: 'Email already registered' });

        // Create and save new user
        const newUser = new User(data);
        await newUser.save();

        // Return success response if user created successfully
        return res.status(201).json({ message: 'User registered', userId: newUser.userId });
    } catch (err) {
        // Handle server errors when handling registration
        console.error(err);
        // status 500: Internal Server Error
        return res.status(500).json({ error: 'Registration failed' });
    }
});

// ============================================
// LOGIN ROUTE
// ============================================

// POST user login
router.post(`/login-${STUDENT_ID}`, async (req, res) => {
    try {
        const { email, password } = req.body;
        const trimmedEmail = email ? email.trim().toLowerCase() : "";

        // Email validation
        if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
            return res.status(400).json({
                errors: ['Invalid email format.'],
                formData: req.body
            });
        }

        // Password validation
        if (!password || password.length < PASSWORD_MIN_LENGTH || !PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                errors: ['Password is required and must meet complexity requirements.'],
                formData: req.body
            });
        }

        // Find user by email (since email is unique)
        const user = await User.findOne({ email: trimmedEmail });

        // User not found
        if (!user) {
            return res.status(400).json({
                errors: ['Account not found.'],
                formData: req.body
            });
        }

        // Password mismatch
        if (user.password !== password) {
            return res.status(400).json({
                errors: ['Invalid credentials.'],
                formData: req.body
            });
        }

        // Login successful
        user.isLoggedIn = true;
        await user.save();

        // Return success JSON with userId and message
        return res.status(200).json({ message: 'Successfully logged in', userId: user.userId });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ errors: ['An error occurred during login.'] });
    }
});

// ============================================
// LOGOUT ROUTE
// ============================================
router.get(`/logout-${STUDENT_ID}`, async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
    }
    try {
        const user = await User.findOne({ userId });
        if (user) {
            user.isLoggedIn = false;
            await user.save();
            return res.json({ message: 'Successfully logged out', userId: user.userId });
        }
        // If user not found, return 404
        return res.status(404).json({ error: 'User not found' });
    } catch (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
    }
});

module.exports = router;