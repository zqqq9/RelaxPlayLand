import { createGameSlug, sanitizeIframe } from '../utils/helpers';

export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const formData = await request.formData();

        const gameData = {};
        const requiredFields = ['gameName', 'gameCategory', 'gameDescription', 'gameHowToPlay', 'gameIframe', 'developerName', 'developerEmail', 'gameImage'];
        
        for (const field of requiredFields) {
            const value = formData.get(field);
            if (!value) {
                 return new Response(JSON.stringify({ success: false, message: `${field} is a required field.` }), { status: 400 });
            }
            gameData[field] = value;
        }
        
        // No more file upload. The 'gameImage' field is now a URL.
        const imageUrl = gameData.gameImage;
        
        // Validate if the provided URL is a valid URL
        try {
            new URL(imageUrl);
        } catch (_) {
            return new Response(JSON.stringify({ success: false, message: 'Invalid Image URL provided.' }), { status: 400 });
        }

        const allGames = await env.DB.get('games', { type: 'json' }) || [];
        const gameSlug = createGameSlug(gameData.gameName);

        if (allGames.some(game => game.slug === gameSlug)) {
            return new Response(JSON.stringify({ success: false, message: 'A game with this name already exists.' }), { status: 409 });
        }

        const newGame = {
            id: Date.now().toString(),
            slug: gameSlug,
            name: gameData.gameName,
            category: gameData.gameCategory,
            description: gameData.gameDescription,
            howToPlay: gameData.gameHowToPlay,
            iframe: sanitizeIframe(gameData.gameIframe),
            developer: {
                name: gameData.developerName,
                email: gameData.developerEmail,
                website: formData.get('developerWebsite') || ''
            },
            tags: JSON.parse(formData.get('gameTags') || '[]'),
            image: imageUrl, // Save the URL directly
            dateAdded: new Date().toISOString(),
            status: 'pending', // All new games are pending approval
        };

        allGames.push(newGame);

        await env.DB.put('games', JSON.stringify(allGames));

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Game submitted successfully! It is now pending review.',
            game: newGame
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Submission Error:', error);
        return new Response(JSON.stringify({ success: false, message: 'An unexpected error occurred.', error: error.message }), { status: 500 });
    }
} 