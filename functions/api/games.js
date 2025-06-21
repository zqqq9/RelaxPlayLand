/**
 * Fetches games from the KV store and filters them based on query parameters.
 * @param {EventContext} context - The context of the request.
 * @returns {Promise<Response>} - The response containing the list of games.
 */
export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const { status, category, search, page = 1, limit = 10 } = Object.fromEntries(url.searchParams);

        // Fetch all games from the KV store under the key 'games'
        const allGames = await env.DB.get('games', { type: 'json' }) || [];

        // Filter games based on query parameters
        let filteredGames = allGames;

        if (status) {
            filteredGames = filteredGames.filter(game => game.status === status);
        }

        if (category) {
            filteredGames = filteredGames.filter(game => game.category === category);
        }

        if (search) {
            const searchTerm = search.toLowerCase();
            filteredGames = filteredGames.filter(game =>
                game.name.toLowerCase().includes(searchTerm) ||
                game.description.toLowerCase().includes(searchTerm)
            );
        }

        // Sort games by date added, newest first
        filteredGames.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedGames = filteredGames.slice(startIndex, endIndex);

        const responsePayload = {
            success: true,
            total: filteredGames.length,
            page: Number(page),
            totalPages: Math.ceil(filteredGames.length / limit),
            games: paginatedGames,
            allGames: allGames // For admin stats
        };

        return new Response(JSON.stringify(responsePayload), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error fetching games:', error);
        const errorResponse = {
            success: false,
            message: 'Failed to fetch games',
            error: error.message,
        };
        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
} 