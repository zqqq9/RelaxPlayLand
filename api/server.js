const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// API endpoint to get games
app.get('/api/games', (req, res) => {
  try {
    const gamesData = fs.readFileSync(path.join(__dirname, 'games.json'), 'utf8');
    const games = JSON.parse(gamesData);
    res.json(games);
  } catch (error) {
    console.error('Error reading games data:', error);
    res.status(500).json({ error: 'Failed to load games data' });
  }
});

// Catch-all route to serve index.html for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 