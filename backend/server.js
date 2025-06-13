// backend/server.js

// --- 1. Imports and Initial Setup ---
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const PgSession = require('connect-pg-simple')(session);
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

// --- NEW DEBUGGING MIDDLEWARE ---
// This must be the very first middleware to run.
// It will log every incoming request's method and path to your Render logs.
app.use((req, res, next) => {
    console.log(`[INCOMING REQUEST] Method: ${req.method}, Path: ${req.originalUrl}`);
    next();
});

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
const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const sessionStore = new PgSession({
    pool: pgPool,
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
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
    },
}));

// --- 6. API Routing ---
app.use('/api/account', accountRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', authRoutes);

// --- 7. Health Check and Root Route ---
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'MedReview AI Backend is running.' });
});

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