// frontend-server.js
const express = require('express');
const https = require('https');
const path = require('path');
const url = require('url');

const app = express();
const port = process.env.PORT || 3001;

// The URL of your live backend service
const API_URL = 'https://medreviewai.onrender.com';

// This is our manual proxy for all /api routes
app.all('/api/*', (req, res) => {
    const apiEndpoint = new url.URL(req.originalUrl, API_URL);

    const options = {
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            // Forward any other important headers if necessary
        },
    };

    const proxyReq = https.request(apiEndpoint, options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        console.error('Proxy Request Error:', err);
        res.status(502).send('Bad Gateway');
    });

    // Forward the request body from the original request to the proxy request
    if (req.body) {
        proxyReq.write(JSON.stringify(req.body));
    }
    
    proxyReq.end();
});


// Serve the static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// For any other request that isn't for a static file or the API, serve the index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
    console.log(`Frontend service listening on port ${port}`);
});