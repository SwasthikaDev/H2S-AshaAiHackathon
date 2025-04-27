const express = require('express');
const jwt = require('jsonwebtoken');
const { createUser, verifyUser } = require('../db');
const router = express.Router();

// Register new user
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Create new user
        const user = await createUser({ name, email, password });

        // Generate token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({ token, userId: user.id });
    } catch (error) {
        if (error.message === 'Email already registered') {
            res.status(400).json({ message: error.message });
        } else if (error.message === 'Maximum user limit reached') {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Error creating user' });
        }
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Verify user credentials
        const user = await verifyUser(email, password);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({ token, userId: user.id });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

module.exports = router;
