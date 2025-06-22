/**
 * Admin API endpoint to reject a game
 * @param {EventContext} context - The context of the request.
 * @returns {Promise<Response>} - The response indicating success or failure.
 */
export async function onRequestPost(context) {
    try {
        const { request, env, params } = context;
        const gameId = params.id;
        
        if (!gameId) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Game ID is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate authentication
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Authentication required'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // In production, you would validate the API key here
        const apiKey = authHeader.split(' ')[1];
        if (!apiKey) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Invalid API key'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Parse request body for feedback
        const requestData = await request.json();
        const { feedback } = requestData;

        // Try to get games from KV store
        let allGames;
        try {
            allGames = await env.DB.get('games', { type: 'json' });
        } catch (error) {
            console.error('Error fetching from KV store:', error);
            // Fallback to local file if KV store fails
            const fs = require('fs');
            const path = require('path');
            const dataPath = path.join(process.cwd(), 'data', 'games.json');
            
            if (fs.existsSync(dataPath)) {
                const gamesData = fs.readFileSync(dataPath, 'utf8');
                allGames = JSON.parse(gamesData);
            } else {
                allGames = [];
            }
        }

        if (!allGames || !Array.isArray(allGames)) {
            allGames = [];
        }

        // Find the game and update its status
        const gameIndex = allGames.findIndex(game => game.id === gameId);
        
        if (gameIndex === -1) {
            return new Response(JSON.stringify({
                success: false,
                message: `Game with ID ${gameId} not found`
            }), {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            });
        }

        // Update the game
        allGames[gameIndex] = {
            ...allGames[gameIndex],
            status: 'rejected',
            adminFeedback: feedback || '',
            rejectedAt: new Date().toISOString()
        };

        // Save updated games
        try {
            await env.DB.put('games', JSON.stringify(allGames));
        } catch (error) {
            console.error('Error updating KV store:', error);
            // Fallback to local file if KV store fails
            const fs = require('fs');
            const path = require('path');
            const dataPath = path.join(process.cwd(), 'data', 'games.json');
            
            fs.writeFileSync(dataPath, JSON.stringify(allGames, null, 2), 'utf8');
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Game ${gameId} has been rejected`,
            game: allGames[gameIndex]
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });

    } catch (error) {
        console.error('Error rejecting game:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'Failed to reject game',
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }
}

/**
 * Handle OPTIONS requests for CORS
 */
export function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    });
} 