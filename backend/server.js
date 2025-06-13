// backend/server.js

// --- 1. Imports and Initial Setup ---
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { Pool } = require('pg'); // Import the Pool class from pg
const PgSession = require('connect-pg-simple')(session);
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const prisma = new PrismaClient();
const app = express();
// FIX: Use the PORT environment variable provided by Render
const port = process.env.PORT || 3000;

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
// FIX: `connect-pg-simple` requires a `pg.Pool` instance, not a Prisma client.
// This was a critical error preventing sessions from working at all.
const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // For production environments like Render, SSL is often required to connect to the database.
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const sessionStore = new PgSession({
    pool: pgPool,
    tableName: 'Session', // This table will be created automatically
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
        // FIX: These settings are REQUIRED for cross-domain cookies to work in production over HTTPS.
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
    },
}));

// --- 6. API Routing ---
// All API routes are prefixed with /api
app.use('/api/account', accountRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', authRoutes);

// --- 7. Health Check and Root Route ---
// A proper health check route for monitoring services.
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'MedReview AI Backend is running.' });
});

// FIX: A catch-all for the root path to guide the frontend developer.
// This directly addresses your symptom. Instead of seeing the unhelpful "running" message,
// a misconfigured request to the root will now get a clear error, pointing to the real problem.
app.all('/', (req, res) => {
    res.status(404).json({ 
        status: 'error', 
        message: 'Endpoint not found. All API endpoints are located under the /api path. Your request to the root (/) was likely a mistake in the frontend code.' 
    });
});

// --- 8. Start the server ---
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});