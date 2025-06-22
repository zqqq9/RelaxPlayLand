/**
 * Admin API endpoint to fetch games with filtering, sorting, and pagination
 * @param {EventContext} context - The context of the request.
 * @returns {Promise<Response>} - The response containing the list of games.
 */
export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const { status, search, page = 1, limit = 10 } = Object.fromEntries(url.searchParams);

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
        // For now, we'll just check if it exists
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

        // Filter games based on query parameters
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

        const responsePayload = {
            success: true,
            total: filteredGames.length,
            page: pageNum,
            totalPages: Math.ceil(filteredGames.length / pageSize),
            games: paginatedGames,
            allGames: allGames // For admin stats
        };

        return new Response(JSON.stringify(responsePayload), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });

    } catch (error) {
        console.error('Error in admin games API:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'Failed to fetch games',
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    });
} 