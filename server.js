const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'images', 'games');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Create a safe filename
        const gameName = req.body.gameName || 'game';
        const slug = gameName.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        
        const extension = file.originalname.split('.').pop();
        cb(null, `${slug}-${Date.now()}.${extension}`);
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'relaxplayland-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));
app.use(express.static('.'));

// API Routes
const dataPath = path.join(__dirname, 'data', 'games.json');

// Helper function to read games data
function getGamesData() {
    try {
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading games data:', error);
        return [];
    }
}

// Helper function to save games data
function saveGamesData(games) {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(games, null, 2));
        // No need to generate individual game pages anymore since we're using a template approach
        return true;
    } catch (error) {
        console.error('Error saving games data:', error);
        return false;
    }
}

// Helper function to generate game pages (kept for backward compatibility but no longer used)
function generateGamePages(games) {
    // This function is no longer needed as we're using a template approach
    console.log('Game page generation skipped - using template approach instead');
    return true;
}

// Admin credentials (in a real app, these would be stored securely)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_API_KEY = 'secret-api-key-' + Date.now();

// Authentication middleware
function authenticate(req, res, next) {
    // Check for API key in header
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const apiKey = authHeader.split(' ')[1];
        
        // Validate API key
        if (apiKey === ADMIN_API_KEY) {
            return next();
        }
    }
    
    // Check for session-based authentication
    if (req.session && req.session.isAdmin) {
        return next();
    }
    
    return res.status(401).json({ success: false, message: 'Authentication required' });
}

// API endpoint to get all games (admin)
app.get('/api/admin/games', authenticate, (req, res) => {
    try {
        const allGames = getGamesData();
        const { status, search, page = 1, limit = 10 } = req.query;
        
        // Filter games
        let filteredGames = [...allGames];
        
        if (status) {
            filteredGames = filteredGames.filter(game => game.status === status);
        }
        
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredGames = filteredGames.filter(game => 
                game.name.toLowerCase().includes(searchTerm) || 
                (game.description && game.description.toLowerCase().includes(searchTerm))
            );
        }
        
        // Sort games by date added, newest first
        filteredGames.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        
        // Apply pagination
        const pageNum = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const startIndex = (pageNum - 1) * pageSize;
        const endIndex = pageNum * pageSize;
        const paginatedGames = filteredGames.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            total: filteredGames.length,
            page: pageNum,
            totalPages: Math.ceil(filteredGames.length / pageSize),
            games: paginatedGames,
            allGames: allGames // For admin stats
        });
    } catch (error) {
        console.error('Error in /api/admin/games:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// API endpoint to get a specific game (admin)
app.get('/api/admin/games/:id', authenticate, (req, res) => {
    try {
        const allGames = getGamesData();
        const game = allGames.find(g => g.id === req.params.id);
        
        if (!game) {
            return res.status(404).json({ success: false, message: 'Game not found' });
        }
        
        res.json({ success: true, game });
    } catch (error) {
        console.error('Error in /api/admin/games/:id:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// API endpoint to approve a game
app.post('/api/admin/approve-game/:id', authenticate, (req, res) => {
    try {
        const allGames = getGamesData();
        const gameIndex = allGames.findIndex(g => g.id === req.params.id);
        
        if (gameIndex === -1) {
            return res.status(404).json({ success: false, message: 'Game not found' });
        }
        
        const { feedback } = req.body;
        
        // Update game status
        allGames[gameIndex] = {
            ...allGames[gameIndex],
            status: 'approved',
            adminFeedback: feedback || '',
            approvedAt: new Date().toISOString()
        };
        
        // Save updated games
        if (!saveGamesData(allGames)) {
            return res.status(500).json({ success: false, message: 'Failed to save game data' });
        }
        
        res.json({ success: true, message: 'Game approved successfully', game: allGames[gameIndex] });
    } catch (error) {
        console.error('Error in /api/admin/approve-game/:id:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// API endpoint to reject a game
app.post('/api/admin/reject-game/:id', authenticate, (req, res) => {
    try {
        const allGames = getGamesData();
        const gameIndex = allGames.findIndex(g => g.id === req.params.id);
        
        if (gameIndex === -1) {
            return res.status(404).json({ success: false, message: 'Game not found' });
        }
        
        const { feedback } = req.body;
        
        // Update game status
        allGames[gameIndex] = {
            ...allGames[gameIndex],
            status: 'rejected',
            adminFeedback: feedback || '',
            rejectedAt: new Date().toISOString()
        };
        
        // Save updated games
        if (!saveGamesData(allGames)) {
            return res.status(500).json({ success: false, message: 'Failed to save game data' });
        }
        
        res.json({ success: true, message: 'Game rejected successfully', game: allGames[gameIndex] });
    } catch (error) {
        console.error('Error in /api/admin/reject-game/:id:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// API endpoint for batch approval
app.post('/api/admin/games/batch-approve', authenticate, (req, res) => {
    try {
        const { gameIds, feedback } = req.body;
        
        if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Game IDs are required' });
        }
        
        const allGames = getGamesData();
        let updatedCount = 0;
        
        // Update game statuses
        const updatedGames = allGames.map(game => {
            if (gameIds.includes(game.id)) {
                updatedCount++;
                return {
                    ...game,
                    status: 'approved',
                    adminFeedback: feedback || '',
                    approvedAt: new Date().toISOString()
                };
            }
            return game;
        });
        
        // Save updated games
        if (!saveGamesData(updatedGames)) {
            return res.status(500).json({ success: false, message: 'Failed to save game data' });
        }
        
        res.json({ success: true, message: `Successfully approved ${updatedCount} games`, updatedCount });
    } catch (error) {
        console.error('Error in /api/admin/games/batch-approve:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// API endpoint for batch rejection
app.post('/api/admin/games/batch-reject', authenticate, (req, res) => {
    try {
        const { gameIds, feedback } = req.body;
        
        if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Game IDs are required' });
        }
        
        const allGames = getGamesData();
        let updatedCount = 0;
        
        // Update game statuses
        const updatedGames = allGames.map(game => {
            if (gameIds.includes(game.id)) {
                updatedCount++;
                return {
                    ...game,
                    status: 'rejected',
                    adminFeedback: feedback || '',
                    rejectedAt: new Date().toISOString()
                };
            }
            return game;
        });
        
        // Save updated games
        if (!saveGamesData(updatedGames)) {
            return res.status(500).json({ success: false, message: 'Failed to save game data' });
        }
        
        res.json({ success: true, message: `Successfully rejected ${updatedCount} games`, updatedCount });
    } catch (error) {
        console.error('Error in /api/admin/games/batch-reject:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// API endpoint to submit a new game
app.post('/api/submit-game', upload.single('gameImageFile'), (req, res) => {
    try {
        const { 
            gameName, gameCategory, gameDifficulty, gameControls, 
            gamePlayers, gameAgeRating, gameDescription, gameHowToPlay,
            gameFeatures, gameTags, gameImage, gameIframe,
            developerName, developerEmail, developerWebsite
        } = req.body;
        
        // Validate required fields
        if (!gameName || !gameCategory || !gameDescription || !gameHowToPlay || !gameIframe || !developerName || !developerEmail) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        // Create slug from game name
        const slug = gameName.toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-')     // Replace spaces with hyphens
            .replace(/-+/g, '-');     // Remove consecutive hyphens
        
        // Get existing games
        const allGames = getGamesData();
        
        // Check if slug already exists
        if (allGames.some(g => g.slug === slug)) {
            return res.status(400).json({ success: false, message: 'A game with a similar name already exists' });
        }
        
        // Generate a new ID
        const newId = (Math.max(...allGames.map(g => parseInt(g.id))) + 1).toString();
        
        // Parse tags
        let parsedTags = [];
        try {
            parsedTags = gameTags ? JSON.parse(gameTags) : [];
        } catch (e) {
            console.error('Error parsing tags:', e);
            parsedTags = [];
        }
        
        // Handle image path
        let imagePath = gameImage || '';
        
        // If a file was uploaded, use its path
        if (req.file) {
            // Convert backslashes to forward slashes for web paths
            imagePath = '/' + path.relative('.', req.file.path).replace(/\\/g, '/');
        }
        
        // Create new game object
        const newGame = {
            id: newId,
            slug,
            name: gameName,
            category: gameCategory,
            difficulty: gameDifficulty || 'Medium',
            controls: gameControls || 'Mouse/Touch',
            players: gamePlayers || 'Single Player',
            ageRating: gameAgeRating || 'All Ages',
            description: gameDescription,
            howToPlay: gameHowToPlay,
            features: gameFeatures || '',
            iframe: gameIframe,
            tags: parsedTags,
            image: imagePath,
            developer: {
                name: developerName,
                email: developerEmail,
                website: developerWebsite || ''
            },
            dateAdded: new Date().toISOString(),
            status: 'pending'
        };
        
        // Add new game to the list
        allGames.push(newGame);
        
        // Save updated games
        if (!saveGamesData(allGames)) {
            return res.status(500).json({ success: false, message: 'Failed to save game data' });
        }
        
        res.json({ success: true, message: 'Game submitted successfully and is pending approval', game: newGame });
    } catch (error) {
        console.error('Error in /api/submit-game:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Admin login API
app.post('/api/admin/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validate credentials
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            // Set session
            req.session.isAdmin = true;
            
            res.json({
                success: true,
                message: 'Login successful',
                apiKey: ADMIN_API_KEY
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    } catch (error) {
        console.error('Error in /api/admin/login:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Admin logout API
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
});

// Public API endpoint to get approved games
app.get('/api/games', (req, res) => {
    try {
        const allGames = getGamesData();
        const { status, category, search, page = 1, limit = 10 } = req.query;
        
        // Filter games - by default only show approved games for public API
        let filteredGames = allGames.filter(game => game.status === 'approved');
        
        if (status && status !== 'approved') {
            // Only allow filtering by status for admin users (would need authentication)
            // For now, we'll just ignore this parameter for public API
        }
        
        if (category) {
            filteredGames = filteredGames.filter(game => game.category === category);
        }
        
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredGames = filteredGames.filter(game => 
                game.name.toLowerCase().includes(searchTerm) || 
                (game.description && game.description.toLowerCase().includes(searchTerm))
            );
        }
        
        // Sort games by date added, newest first
        filteredGames.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        
        // Apply pagination
        const pageNum = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const startIndex = (pageNum - 1) * pageSize;
        const endIndex = pageNum * pageSize;
        const paginatedGames = filteredGames.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            total: filteredGames.length,
            page: pageNum,
            totalPages: Math.ceil(filteredGames.length / pageSize),
            games: paginatedGames
        });
    } catch (error) {
        console.error('Error in /api/games:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Public API endpoint to get a specific game by ID
app.get('/api/games/:id', (req, res) => {
    try {
        const gameId = req.params.id;
        const allGames = getGamesData();
        
        // Find the game by ID or slug
        const game = allGames.find(g => g.id === gameId || g.slug === gameId);
        
        if (!game) {
            return res.status(404).json({ success: false, message: 'Game not found' });
        }
        
        // For public API, only return approved games
        if (game.status !== 'approved') {
            // Check if the request is from an admin (would need authentication)
            const isAdmin = req.session.isAdmin || req.headers.authorization === `Bearer ${ADMIN_API_KEY}`;
            
            if (!isAdmin) {
                return res.status(404).json({ success: false, message: 'Game not found' });
            }
        }
        
        // Format game data for the template
        const gameData = {
            ...game,
            gameUrl: game.iframe || `/public/games/${game.slug}/index.html`,
            instructions: game.howToPlay || 'No instructions available.',
            features: game.features || 'No features listed.'
        };
        
        res.json({
            success: true,
            game: gameData
        });
    } catch (error) {
        console.error('Error in /api/games/:id:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Add specific route for game template
app.get('/game-template', (req, res) => {
    res.sendFile(path.join(__dirname, 'game-template.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin interface: http://localhost:${PORT}/admin/login.html`);
    
    // Log available games on startup
    try {
        const games = getGamesData();
        const approvedGames = games.filter(game => game.status === 'approved');
        console.log(`Total games: ${games.length}`);
        console.log(`Approved games: ${approvedGames.length}`);
        console.log('Approved game slugs:', approvedGames.map(g => g.slug).join(', '));
    } catch (error) {
        console.error('Error logging game data:', error);
    }
}); 