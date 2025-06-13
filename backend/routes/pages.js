// backend/routes/pages.js

const express = require('express');
const path = require('path');
const isAuthenticated = require('../middleware/isAuthenticated');

const router = express.Router();

// Serve the main index.html for the root route
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Protected page routes
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});
router.get('/review-editor.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/review-editor.html'));
});
router.get('/results.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/results.html'));
});

// Verification status pages
router.get('/verification-success.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/verification-success.html'));
});
router.get('/verification-failed.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/verification-failed.html'));
});


module.exports = router;