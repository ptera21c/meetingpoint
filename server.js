const express = require('express');
const path = require('path');

const app = express();
const port = 5000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Add API key endpoint
app.get('/api/maps-api-key', (req, res) => {
    // Replace this with your actual Google Maps API key
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyBGdEmQis3s1IvUEUZJV8JWbcB5SiAhsYs' });
});

// Serve index.html for all routes (for SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Frontend server running at http://localhost:${port}`);
  console.log(`Open your browser to http://localhost:${port} to view the application`);
});
