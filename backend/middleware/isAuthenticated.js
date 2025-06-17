// backend/middleware/isAuthenticated.js

function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        // User is authenticated, proceed to the next handler
        return next();
    }
    
    // --- THE FIX ---
    // User is not authenticated. Send a 401 Unauthorized status code
    // with a JSON message instead of redirecting.
    res.status(401).json({ message: 'Authentication required. Please log in.' });
}

module.exports = isAuthenticated;