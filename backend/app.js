// Load environment variables from .env file
require('dotenv').config();

// Import the Express framework - this is the core of our web application
const express = require('express');
const ejs = require("ejs");
const { connectToMongoDB } = require('./db/connection');
const User = require('./models/User');
const Recipe = require('./models/Recipe');
const Inventory = require('./models/UserInventory');
const STUDENT_ID = "33810672";
const STUDENT_NAME = "Viet Tran";
const dbCheck = require('./middleware/dbCheck');
// Import CORS middleware
const cors = require('cors');
// Import Socket.io
const socketIo = require('socket.io');
// Import TTS Service
const ttsService = require('./utils/ttsService');


// Create an Express application instance
const app = express();

// Set local variables for server, will be used by form validation middleware
app.locals.STUDENT_ID = STUDENT_ID;
app.locals.STUDENT_NAME = STUDENT_NAME;

// Define the port number where our server will listen for requests
const PORT = 8081;

// Middleware to parse form data sent via POST requests
// extended: true allows for rich objects and arrays to be encoded
// This is essential for handling form submissions
app.use(express.urlencoded({ extended: true }));

// Add JSON parsing for API requests (e.g., from Angular frontend)
app.use(express.json());

// Enable CORS for all routes - adjust settings as needed
app.use(cors({
    origin: 'http://localhost:4200',  // Allow Angular dev server
    credentials: true  // If using cookies/auth
}));

// Import authentication middleware
const { requireLogin } = require('./middleware/auth');

// Database connection check middleware, applied globally
app.use(dbCheck);



// ============================================
// HOME ROUTE
// ============================================

app.get(`/api`, requireLogin, async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
    }
    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Fetch counts
        const userCount = await User.find().countDocuments();
        let recipeCount = await Recipe.find().countDocuments();
        const inventoryCount = await Inventory.find().countDocuments();
        if (user.role === 'chef') {
            recipeCount = await Recipe.find({ userId: user.userId }).countDocuments();
        }
        // Return dashboard data
        return res.json({
            user: {
                userId: user.userId,
                fullname: user.fullname,
                email: user.email,
                role: user.role
            },
            stats: {
                userCount,
                recipeCount,
                inventoryCount
            },
            student: {
                id: STUDENT_ID,
                name: STUDENT_NAME
            }
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        return res.status(500).json({ error: 'Failed to load dashboard' });
    }
});


// ============================================
// USER ROUTE
// ============================================

// Route now turn into API calls
const apiUserRoute = require('./routes/user');
app.use('/api/user', apiUserRoute);


// ============================================
// RECIPE ROUTE
// ============================================
const apiRecipeRoute = require('./routes/recipe');
app.use('/api/recipe', apiRecipeRoute);

// ============================================
// INVENTORY ROUTE
// ============================================
const apiInventoryRoute = require('./routes/inventory');
app.use('/api/inventory', apiInventoryRoute);


// Start the server and listen for incoming requests
// The callback function runs once the server starts successfully
// ============================================
// START SERVER
// ============================================


// Connect to MongoDB and start server

async function startServer() {
    // Start the server immediately
    const server = app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });

    // Initialize Socket.io for real-time communication (for text-to-speech)
    const io = socketIo(server, {
        cors: {
            origin: 'http://localhost:4200',  // Allow Angular dev server
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Socket.io event handlers
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Handle text-to-speech request
        socket.on('generate-speech', async (data) => {
            try {
                console.log(`Generating speech for recipe: ${data.recipeTitle}`);

                // Validate input
                if (!data.instructions || !Array.isArray(data.instructions) || data.instructions.length === 0) {
                    socket.emit('speech-error', {
                        error: 'Instructions array is required and must not be empty'
                    });
                    return;
                }

                // Format instructions for speech
                const formattedText = ttsService.formatInstructionsForSpeech(data.instructions);

                // Generate speech audio
                const audioBuffer = await ttsService.synthesizeSpeech(formattedText, {
                    languageCode: data.languageCode || 'en-US',
                    voiceName: data.voiceName || 'en-US-Neural2-A',
                    speakingRate: data.speakingRate || 1.0
                });

                // Convert buffer to base64 for transmission over Socket.io
                const audioBase64 = audioBuffer.toString('base64');

                // Send audio back to client
                socket.emit('speech-generated', {
                    success: true,
                    audioBase64: audioBase64,
                    contentType: 'audio/mpeg',
                    recipeTitle: data.recipeTitle
                });

                console.log(`Speech generated successfully for: ${data.recipeTitle}`);
            } catch (error) {
                console.error('Error generating speech:', error);
                socket.emit('speech-error', {
                    error: `Failed to generate speech: ${error.message}`
                });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    try {
        // Try to connect to MongoDB in the background
        const connected = await connectToMongoDB();
    } catch (error) {
        console.error('Failed to connect to database:', error);
        // Server keeps running even if MongoDB connection fails
    }

    return server;
}

startServer();