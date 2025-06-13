// backend/server.js

// --- 1. Imports and Initial Setup ---
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const port = 3000;

// --- 2. Route Imports ---
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const reviewRoutes = require('./routes/reviews');

// --- 3. Core Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- 4. Session Management Setup ---
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
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
}));

// --- 5. API Routing ---
// THE STATIC FILE AND PAGE ROUTERS HAVE BEEN REMOVED.
app.use('/api/account', accountRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', authRoutes);

// --- 6. Root/Health Check Route ---
// Add a simple root route to confirm the API is running.
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'MedReview AI Backend is running.' });
});

// --- 7. Start the server ---
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});