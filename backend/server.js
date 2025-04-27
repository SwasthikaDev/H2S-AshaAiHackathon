const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const { initDB } = require('./db');

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:9000', 'http://127.0.0.1:9000', 'http://127.0.0.1:5000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// Initialize database
initDB().catch(console.error);

// Chat endpoint for n8n chatbot integration
app.post('/chat', async (req, res) => {
    try {
        const { type, sessionId, text, route } = req.body;
        
        console.log('Chat request received:', {
            type,
            sessionId,
            text,
            route
        });

        // Forward the request to n8n chatbot service
        // This is a placeholder - you'll need to implement the actual n8n integration
        // For now, just echo back the message
        res.json({
            text: `You said: ${text}`,
            sessionId,
            route
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// File upload endpoint
app.post('/upload', async (req, res) => {
    try {
        const { type, file, sessionId, route, text } = req.body;
        
        console.log('File upload received:', {
            type,
            fileName: file?.originalname,
            sessionId,
            route,
            text
        });

        res.json({
            text: 'File received and being processed...',
            sessionId,
            route
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = 9002; // Changed to port 9002 to avoid conflicts
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
