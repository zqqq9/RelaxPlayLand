export async function onRequestPost(context) {
    try {
        const { env, params } = context;
        const gameId = params.id;

        if (!gameId) {
            return new Response(JSON.stringify({ success: false, message: 'Game ID is required.' }), { status: 400 });
        }

        const allGames = await env.DB.get('games', { type: 'json' }) || [];
        
        const gameIndex = allGames.findIndex(game => game.id === gameId);

        if (gameIndex === -1) {
            return new Response(JSON.stringify({ success: false, message: 'Game not found.' }), { status: 404 });
        }

        allGames[gameIndex].status = 'approved';

        await env.DB.put('games', JSON.stringify(allGames));

        return new Response(JSON.stringify({ success: true, message: 'Game approved successfully.' }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Approval Error:', error);
        return new Response(JSON.stringify({ success: false, message: 'An unexpected error occurred.', error: error.message }), { status: 500 });
    }
} 