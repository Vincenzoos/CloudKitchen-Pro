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


// Create an Express application instance
const app = express();

// Set local variables for server, will be used by form validation middleware
app.locals.STUDENT_ID = STUDENT_ID;
app.locals.STUDENT_NAME = STUDENT_NAME;

// Define the port number where our server will listen for requests
const PORT = 8081;

// Configure EJS as the templating/view engine
// This tells Express to use EJS to render our HTML pages
// app.set('view engine', 'ejs');
app.engine("html", ejs.renderFile);
app.set("view engine", "html");

// Tell Express where to find our EJS template files
// By default, Express looks for a 'views' folder in the project root
app.set('views', './views');

// Middleware to parse form data sent via POST requests
// extended: true allows for rich objects and arrays to be encoded
// This is essential for handling form submissions
app.use(express.urlencoded({ extended: true }));

// Add JSON parsing for API requests (e.g., from Angular frontend)
app.use(express.json());

// Serve static files (CSS, JS, images) from the 'public' directory
// This allows us to include Bootstrap CSS files locally if needed
app.use(express.static('public'));

// Serve Bootstrap files
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'));

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


// Note: dont use "/" to mount a route, it's RBAC rule will override other routes

// ============================================
// REPORT ROUTE
// ============================================
const reportRoute = require('./routes/report');
app.use('/report', reportRoute);

// ============================================
// RECIPE ROUTE
// ============================================
// const recipeRoute = require('./routes/recipe');
// app.use('/recipe', recipeRoute);
const apiRecipeRoute = require('./routes/recipe');
app.use('/api/recipe', apiRecipeRoute);

// ============================================
// INVENTORY ROUTE
// ============================================
// const inventoryRoute = require('./routes/inventory');
// app.use('/api/inventory', inventoryRoute);
const apiInventoryRoute = require('./routes/inventory');
app.use('/api/inventory', apiInventoryRoute);


// ============================================
// ERROR HANDLING (with Middleware)
// ============================================

// Handle 404 errors - Page not found
app.use((req, res) => {
    res.status(404).render('errors/404', {
        userId: req.query.userId || null
    });
});

// Handle 400 errors - Bad Request
app.use((req, res) => {
    res.status(400).render('errors/400', {
        userId: req.query.userId || null
    });
});

// Handle 500 errors - Internal Server Error
app.use((req, res) => {
    res.status(500).render('errors/500', {
        userId: req.query.userId || null
    });
});

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