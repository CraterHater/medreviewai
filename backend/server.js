// backend/server.js

// --- 1. Imports and Initial Setup ---
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const { PrismaClient } = require('@prisma/client');
const cors = require('cors'); // For handling Cross-Origin Resource Sharing

const prisma = new PrismaClient();
const app = express();
const port = 3000;

// --- 2. Route Imports ---
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const reviewRoutes = require('./routes/reviews');

// --- 3. CORS Middleware Configuration ---
// This is the crucial fix. It MUST come before your routes are defined.
const corsOptions = {
    // This tells the backend to accept requests from your live frontend domain.
    origin: 'https://medreviewai-app.onrender.com', 
    credentials: true, // This allows session cookies to be sent and received.
};
app.use(cors(corsOptions));

// --- 4. Core Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- 5. Session Management Setup ---
const sessionStore = new PgSession({
    prisma: prisma,
    tableName: 'Session',
    createTableIfMissing: true,
});

app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'a-very-secret-key-that-should-be-in-env',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        // For production with HTTPS, you should also set:
        // secure: true, 
        // sameSite: 'none' 
    },
}));

// --- 6. API Routing --- 
// The order is from most specific to least specific.
app.use('/api/account', accountRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', authRoutes);

// --- 7. Root/Health Check Route ---
// A simple route to confirm the API server is running.
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'MedReview AI Backend is running.' });
});

// --- 8. Start the server ---
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});