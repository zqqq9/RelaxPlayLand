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
    
    // Add CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Send the games data
    res.json(games);
  } catch (error) {
    console.error('Error reading games data:', error);
    res.status(500).json({ error: 'Failed to load games data' });
  }
});

// Catch-all route to serve index.html for any other routes
app.get('*', (req, res) => {
  // Exclude API routes from catch-all
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  const filePath = path.join(__dirname, '..', 'index.html');
  
  // Check if the file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoint available at http://localhost:${PORT}/api/games`);
}); 