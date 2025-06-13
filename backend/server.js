// backend/server.js

// --- 1. Imports and Initial Setup ---
require('dotenv').config();
const express = require('express');
const path = require('path');
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
const pageRoutes = require('./routes/pages');

// --- 3. Core Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- 4. Static File Serving ---
app.use(express.static(path.join(__dirname, '../')));

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
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
}));

// --- 6. API and Page Routing ---
// Use prefixes to delegate routing to the specific files
app.use('/api', authRoutes); // Handles /api/signup, /api/login, etc.
app.use('/api/account', accountRoutes); // Handles /api/account/*
app.use('/api/reviews', reviewRoutes); // Handles /api/reviews/*
app.use('/', pageRoutes); // Handles /, /dashboard, /results.html, etc.

// --- 7. Favicon Handler ---
app.get('/favicon.ico', (req, res) => res.status(204).send());

// --- 8. Start the server ---
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});