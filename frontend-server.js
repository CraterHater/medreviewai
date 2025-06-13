// frontend-server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001; // Render will set the PORT env var

// The URL of your live backend service
const API_URL = 'https://medreviewai.onrender.com';

// --- THE FIX IS HERE ---
// Proxy middleware options are simplified.
// We remove pathRewrite because the app.use('/api', ...) handles it.
const apiProxy = createProxyMiddleware({
  target: API_URL,
  changeOrigin: true, // This is important for virtual hosted sites
});
// --- END OF FIX ---

// Use the proxy for any request to a path starting with /api
app.use('/api', apiProxy);

// Serve the static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// For any other request that isn't for a static file or the API, serve the index.html
// This allows for client-side routing and page reloads to work.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
  console.log(`Frontend service listening on port ${port}`);
});