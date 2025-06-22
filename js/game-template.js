/**
 * Game page template generator
 * This script creates HTML files for each approved game
 */

const fs = require('fs');
const path = require('path');

// Get games data
const dataPath = path.join(__dirname, '..', 'data', 'games.json');
const gamesDir = path.join(__dirname, '..', 'games');

// Create games directory if it doesn't exist
if (!fs.existsSync(gamesDir)) {
    fs.mkdirSync(gamesDir, { recursive: true });
}

// Read games data
let games = [];
try {
    const data = fs.readFileSync(dataPath, 'utf8');
    games = JSON.parse(data);
} catch (error) {
    console.error('Error reading games data:', error);
    process.exit(1);
}

// Filter for approved games
const approvedGames = games.filter(game => game.status === 'approved');

console.log(`Found ${approvedGames.length} approved games`);

// Generate HTML files for each game
approvedGames.forEach(game => {
    const gameFilePath = path.join(gamesDir, `${game.slug}.html`);
    
    // Create HTML content
    const htmlContent = generateGameHTML(game);
    
    // Write file
    try {
        fs.writeFileSync(gameFilePath, htmlContent, 'utf8');
        console.log(`Created game page: ${gameFilePath}`);
    } catch (error) {
        console.error(`Error creating game page for ${game.name}:`, error);
    }
});

console.log('Game page generation complete!');

/**
 * Generate HTML content for a game page
 * @param {Object} game - The game object
 * @returns {string} HTML content
 */
function generateGameHTML(game) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${game.name} | RelaxPlayLand</title>
    <meta name="description" content="${game.description || 'Play this fun game on RelaxPlayLand'}">
    <meta name="keywords" content="${game.tags ? game.tags.join(', ') : 'online games, free games, casual games, relaxing games'}">
    <meta name="author" content="RelaxPlayLand">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://relaxplayland.online/games/${game.slug}.html">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${game.name} | RelaxPlayLand">
    <meta property="og:description" content="${game.description || 'Play this fun game on RelaxPlayLand'}">
    <meta property="og:url" content="https://relaxplayland.online/games/${game.slug}.html">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="RelaxPlayLand">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${game.name} | RelaxPlayLand">
    <meta name="twitter:description" content="${game.description || 'Play this fun game on RelaxPlayLand'}">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    
    <!-- Tailwind CSS -->
    <link href="../dist/output.css" rel="stylesheet">
    
    <style>
        .game-iframe {
            width: 100%;
            height: 600px;
            border: none;
        }
        @media (max-width: 768px) {
            .game-iframe {
                height: 400px;
            }
        }
        .badge {
            display: inline-flex;
            align-items: center;
            border-radius: 9999px;
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .badge-difficulty-easy {
            background-color: #D1FAE5;
            color: #065F46;
        }
        .badge-difficulty-medium {
            background-color: #FEF3C7;
            color: #92400E;
        }
        .badge-difficulty-hard {
            background-color: #FEE2E2;
            color: #B91C1C;
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-50">
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <a href="/" class="text-2xl font-bold text-blue-600">RelaxPlayLand</a>
                </div>
                <div class="hidden md:block">
                    <div class="ml-10 flex items-baseline space-x-4">
                        <a href="/" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</a>
                        <a href="/#games" class="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">Games</a>
                        <a href="/#about" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">About</a>
                    </div>
                </div>
            </div>
        </nav>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <!-- Game Header -->
            <div class="p-6 border-b border-gray-200">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800">${game.name}</h1>
                        <div class="flex flex-wrap items-center mt-2 space-x-2">
                            <span class="badge bg-blue-100 text-blue-800">${game.category || 'Game'}</span>
                            <span class="badge ${getDifficultyClass(game.difficulty)}">${game.difficulty || 'Medium'}</span>
                        </div>
                    </div>
                    <a href="/" class="mt-4 md:mt-0 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Games
                    </a>
                </div>
            </div>

            <!-- Game Content -->
            <div class="p-6">
                <!-- Game Iframe -->
                <div class="bg-gray-800 rounded-lg overflow-hidden mb-8">
                    ${game.iframe || '<div class="flex items-center justify-center h-96 bg-gray-700 text-white">Game preview not available</div>'}
                </div>

                <!-- Game Info -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="md:col-span-2">
                        <h2 class="text-2xl font-bold mb-4 text-gray-800">About This Game</h2>
                        <p class="text-gray-600 mb-6">${game.description || 'No description available.'}</p>
                        
                        <h3 class="text-xl font-bold mb-3 text-gray-800">How to Play</h3>
                        <p class="text-gray-600 mb-6">${game.howToPlay || 'No instructions provided.'}</p>
                        
                        ${game.features ? `
                        <h3 class="text-xl font-bold mb-3 text-gray-800">Features</h3>
                        <p class="text-gray-600 mb-6">${game.features}</p>
                        ` : ''}
                    </div>

                    <div class="bg-gray-50 p-6 rounded-lg">
                        <h3 class="text-xl font-bold mb-4 text-gray-800">Game Details</h3>
                        <ul class="space-y-3">
                            <li class="flex justify-between">
                                <span class="text-gray-600">Category:</span>
                                <span class="font-medium text-gray-800">${game.category || 'N/A'}</span>
                            </li>
                            <li class="flex justify-between">
                                <span class="text-gray-600">Difficulty:</span>
                                <span class="font-medium text-gray-800">${game.difficulty || 'Medium'}</span>
                            </li>
                            <li class="flex justify-between">
                                <span class="text-gray-600">Controls:</span>
                                <span class="font-medium text-gray-800">${game.controls || 'Mouse/Keyboard'}</span>
                            </li>
                            <li class="flex justify-between">
                                <span class="text-gray-600">Players:</span>
                                <span class="font-medium text-gray-800">${game.players || 'Single Player'}</span>
                            </li>
                            <li class="flex justify-between">
                                <span class="text-gray-600">Age Rating:</span>
                                <span class="font-medium text-gray-800">${game.ageRating || 'All Ages'}</span>
                            </li>
                        </ul>

                        ${game.developer ? `
                        <div class="mt-6 pt-6 border-t border-gray-200">
                            <h4 class="font-bold text-gray-800 mb-2">Developer</h4>
                            <p class="text-gray-600">${game.developer.name || 'Unknown'}</p>
                            ${game.developer.website ? `<p class="text-blue-600 hover:underline"><a href="${game.developer.website}" target="_blank" rel="noopener noreferrer">${game.developer.website}</a></p>` : ''}
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-12 mt-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <h3 class="text-xl font-bold mb-4">RelaxPlayLand</h3>
                    <p class="text-gray-400">Your ultimate destination for relaxing online games.</p>
                </div>
                <div>
                    <h4 class="text-lg font-semibold mb-4">Quick Links</h4>
                    <ul class="space-y-2">
                        <li><a href="/" class="text-gray-400 hover:text-white transition-colors">Home</a></li>
                        <li><a href="/#games" class="text-gray-400 hover:text-white transition-colors">Games</a></li>
                        <li><a href="/#about" class="text-gray-400 hover:text-white transition-colors">About</a></li>
                        <li><a href="/submit-game.html" class="text-gray-400 hover:text-white transition-colors">Submit Game</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-lg font-semibold mb-4">Contact</h4>
                    <p class="text-gray-400">Have suggestions or feedback?</p>
                    <p class="text-gray-400">We'd love to hear from you!</p>
                </div>
            </div>
            <div class="border-t border-gray-700 mt-8 pt-8 text-center">
                <p class="text-gray-400">&copy; ${new Date().getFullYear()} RelaxPlayLand. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
}

/**
 * Get CSS class for difficulty badge
 * @param {string} difficulty - The difficulty level
 * @returns {string} CSS class
 */
function getDifficultyClass(difficulty) {
    if (!difficulty) return 'badge-difficulty-medium';
    
    const lowerDifficulty = difficulty.toLowerCase();
    
    if (lowerDifficulty === 'easy') {
        return 'badge-difficulty-easy';
    } else if (lowerDifficulty === 'hard') {
        return 'badge-difficulty-hard';
    } else {
        return 'badge-difficulty-medium';
    }
} 