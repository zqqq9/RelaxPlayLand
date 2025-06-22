/**
 * Admin API endpoint to batch reject games
 * @param {EventContext} context - The context of the request.
 * @returns {Promise<Response>} - The response indicating success or failure.
 */
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        
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

        // Parse request body
        const requestData = await request.json();
        const { gameIds, feedback } = requestData;

        if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Game IDs are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

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

        // Update game statuses
        let updatedCount = 0;
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
        try {
            await env.DB.put('games', JSON.stringify(updatedGames));
        } catch (error) {
            console.error('Error updating KV store:', error);
            // Fallback to local file if KV store fails
            const fs = require('fs');
            const path = require('path');
            const dataPath = path.join(process.cwd(), 'data', 'games.json');
            
            fs.writeFileSync(dataPath, JSON.stringify(updatedGames, null, 2), 'utf8');
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Successfully rejected ${updatedCount} games`,
            updatedCount
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });

    } catch (error) {
        console.error('Error in batch reject:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'Failed to reject games',
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