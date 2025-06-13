// frontend-server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001; // Render will set the PORT env var

// The URL of your live backend service
const API_URL = 'https://medreviewai.onrender.com';

// Proxy middleware options to correctly handle POST, PUT, DELETE, etc.
const apiProxy = createProxyMiddleware({
  target: API_URL,
  changeOrigin: true, // This is important for virtual hosted sites
  pathRewrite: { '^/api': '/api' }, // Keeps the /api path when proxying
});

// Use the proxy for any request to a path starting with /api
app.use('/api', apiProxy);

// Serve the static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// For any other request, serve the index.html file
// This is important for client-side routing and deep linking
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
  console.log(`Frontend service listening on port ${port}`);
});