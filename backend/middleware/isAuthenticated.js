// backend/middleware/isAuthenticated.js

function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    // If not authenticated, redirect to the login page.
    res.redirect('/login.html');
}

module.exports = isAuthenticated;