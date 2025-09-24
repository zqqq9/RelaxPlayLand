const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// API endpoint to get games
app.get('/api/games', (req, res) => {
  try {
    const dataFilePath = path.join(__dirname, '..', 'data', 'games.json');
    const gamesData = fs.readFileSync(dataFilePath, 'utf8');
    const allGames = JSON.parse(gamesData);

    const { status, category, search } = req.query || {};
    const page = parseInt((req.query && req.query.page) || '1', 10) || 1;
    const limit = parseInt((req.query && req.query.limit) || '10', 10) || 10;

    let filtered = Array.isArray(allGames) ? [...allGames] : [];
    filtered = filtered.filter(g => g && g.status === 'approved');

    if (category) {
      filtered = filtered.filter(g => g && g.category === category);
    }

    if (search) {
      const s = String(search).toLowerCase();
      filtered = filtered.filter(g =>
        g && (
          (g.name && g.name.toLowerCase().includes(s)) ||
          (g.description && g.description.toLowerCase().includes(s))
        )
      );
    }

    filtered.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginated = filtered.slice(startIndex, endIndex);

    res.json({
      success: true,
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit),
      games: paginated,
    });
  } catch (error) {
    console.error('Error reading games data:', error);
    res.status(500).json({ error: 'Failed to load games data' });
  }
});

// Accept JSON for submit-game, align with Vercel function
app.options('/api/submit-game', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

app.post('/api/submit-game', (req, res) => {
  try {
    const required = ['gameName', 'gameCategory', 'gameDescription', 'gameHowToPlay', 'gameIframe', 'gameImage'];
    for (const k of required) {
      if (!req.body[k]) {
        return res.status(400).json({ success: false, message: `${k} is required` });
      }
    }

    const dataFilePath = path.join(__dirname, '..', 'data', 'games.json');
    const raw = fs.existsSync(dataFilePath) ? fs.readFileSync(dataFilePath, 'utf8') : '[]';
    const allGames = JSON.parse(raw);

    const slug = String(req.body.gameName).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    if (allGames.some(g => g && (g.slug === slug || g.name === req.body.gameName))) {
      return res.status(409).json({ success: false, message: 'A game with this name already exists.' });
    }

    const numericIds = allGames.map(g => parseInt(g.id, 10)).filter(n => !isNaN(n));
    const newId = (numericIds.length ? Math.max(...numericIds) + 1 : 1).toString();

    const tags = Array.isArray(req.body.gameTags)
      ? req.body.gameTags
      : (typeof req.body.gameTags === 'string' ? (safeParseArray(req.body.gameTags) || []) : []);

    const newGame = {
      id: newId,
      slug,
      name: req.body.gameName,
      category: req.body.gameCategory,
      description: req.body.gameDescription,
      howToPlay: req.body.gameHowToPlay,
      iframe: req.body.gameIframe,
      tags,
      image: req.body.gameImage,
      status: 'pending',
      dateAdded: new Date().toISOString()
    };

    allGames.push(newGame);
    fs.writeFileSync(dataFilePath, JSON.stringify(allGames, null, 2));

    res.json({ success: true, message: 'Game submitted successfully and is pending approval', game: newGame });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

function safeParseArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

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
  console.log(`Submit endpoint available at http://localhost:${PORT}/api/submit-game`);
}); 