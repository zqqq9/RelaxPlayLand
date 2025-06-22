const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
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

// Helper function to write games data
function saveGamesData(games) {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(games, null, 2), 'utf8');
        
        // Generate game pages for approved games
        generateGamePages(games);
        
        return true;
    } catch (error) {
        console.error('Error writing games data:', error);
        return false;
    }
}

// Helper function to generate game pages
function generateGamePages(games) {
    try {
        // Execute the game template generator script
        const { execSync } = require('child_process');
        execSync('node js/game-template.js', { stdio: 'inherit' });
        console.log('Game pages generated successfully');
    } catch (error) {
        console.error('Error generating game pages:', error);
    }
}

// Authentication middleware
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const apiKey = authHeader.split(' ')[1];
    
    // For development, accept any API key
    if (!apiKey) {
        return res.status(401).json({ success: false, message: 'Invalid API key' });
    }
    
    next();
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

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin interface: http://localhost:${PORT}/admin/login.html`);
}); 