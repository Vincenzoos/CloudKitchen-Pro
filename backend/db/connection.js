
// ODM (Object Document Mapper) for MongoDB and Node.js
const mongoose = require('mongoose');

// MongoDB connection string with database name included
// Mongoose automatically handles database selection through the connection string
const mongoURI = 'mongodb://localhost:27017/fit2095-a2';

// Function to establish Mongoose connection
async function connectToMongoDB() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB via Mongoose');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

// Handle connection events
// Event listeners handle connection states (connected, error, disconnected) for better monitoring
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
// Ensures the connection is properly closed when the application exits
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Mongoose connection closed due to app termination');
    process.exit(0);
});

// Helper to report connection state
function isDatabaseConnected() {
    // 1 = connected
    return mongoose.connection && mongoose.connection.readyState === 1;
}

module.exports = { connectToMongoDB, isDatabaseConnected };