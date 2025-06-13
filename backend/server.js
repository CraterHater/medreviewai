// backend/server.js

// --- 1. Imports and Initial Setup ---
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const prisma = new PrismaClient();
const app = express();
const port = 3000;

// --- 2. Route Imports ---
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const reviewRoutes = require('./routes/reviews');

// --- 3. CORS Middleware Configuration ---
const corsOptions = {
    origin: 'https://medreviewai-app.onrender.com', 
    credentials: true,
};
app.use(cors(corsOptions));

// --- 4. Core Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- 5. Session Management Setup ---
app.use(session({
    store: new PgSession({
        prisma: prisma,
        tableName: 'Session',
        createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'a-very-secret-key-that-should-be-in-env',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
    },
}));

// --- 6. API Routing ---
// Order is from most specific to least specific.
app.use('/api/account', accountRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', authRoutes);

// --- 7. Catch-all Route for 404s (THE FIX) ---
// The app.get('/') route has been REMOVED.
// This new route will catch any request that doesn't match the API routes above.
// It ensures that even if the proxy sends a request to an unknown path like '/',
// it will receive a proper JSON 404 error, not an HTML page or a success message.
app.all('*', (req, res) => {
    res.status(404).json({ message: `API route not found: Cannot ${req.method} ${req.originalUrl}` });
});

// --- 8. Start the server ---
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});