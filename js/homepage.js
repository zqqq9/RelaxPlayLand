document.addEventListener('DOMContentLoaded', () => {
    // Get the games container element
    const gamesContainer = document.getElementById('games-container');
    
    if (!gamesContainer) {
        console.error('Games container not found');
        return; // Exit early if container not found
    }
    
    // Fetch approved games from the API
    fetchApprovedGames();
    
    async function fetchApprovedGames() {
        try {
            // Determine if we're in local development or production
            const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiUrl = isLocalDev ? '/api/games' : 'https://relaxplayland.online/api/games';
            
            console.log(`Fetching games from: ${apiUrl}`);
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch games: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch games');
            }
            
            console.log(`Fetched ${data.games.length} approved games`);
            
            // Render the games
            renderGames(data.games);
            
        } catch (error) {
            console.error('Error fetching games:', error);
            renderErrorMessage('Failed to load games. Please try again later.');
        }
    }
    
    function renderGames(games) {
        // Clear existing content
        gamesContainer.innerHTML = '';
        
        // If no games are available, show placeholder
        if (games.length === 0) {
            renderPlaceholders(gamesContainer);
            return;
        }
        
        // Render each game
        games.forEach(game => {
            const gameCard = createGameCard(game);
            gamesContainer.appendChild(gameCard);
        });
        
        // If we have fewer than 3 games, add placeholders
        if (games.length < 3) {
            const placeholdersNeeded = 3 - games.length;
            for (let i = 0; i < placeholdersNeeded; i++) {
                const placeholderCard = createPlaceholderCard();
                gamesContainer.appendChild(placeholderCard);
            }
        }
    }
    
    function createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'card overflow-hidden';
        
        // Link to the template page with game ID or slug as parameter
        const gameUrl = `./game-template.html?id=${game.id || game.slug}`;
        
        // Create badge label based on category or a default
        const badgeLabel = game.category || 'Featured';
        
        // Determine badge color based on category
        let badgeColor = 'bg-apple-blue';
        if (game.category === 'Puzzle') {
            badgeColor = 'bg-apple-orange';
        } else if (game.category === 'Arcade') {
            badgeColor = 'bg-apple-green';
        } else if (game.category === 'Racing') {
            badgeColor = 'bg-apple-red';
        } else if (game.category === 'Shooter') {
            badgeColor = 'bg-apple-purple';
        }
        
        // Check if the image path exists or is valid
        const imageSrc = game.image || '';
        const useImagePlaceholder = !imageSrc || imageSrc.startsWith('/images/') && !imageSrc.includes('http');
        
        card.innerHTML = `
            <div class="relative">
                ${!useImagePlaceholder ? 
                  `<img src="${imageSrc}" alt="${game.name}" class="w-full h-48 object-cover">` : 
                  `<div style="background-color: #0A84FF; height: 12rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.25rem;">
                      ${game.name}
                   </div>`
                }
                <div class="absolute top-4 right-4 ${badgeColor} text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ${badgeLabel}
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold mb-3 text-apple-dark-gray">${game.name}</h3>
                <p class="text-apple-gray mb-4">${game.description || 'No description available.'}</p>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-apple-gray">Difficulty: ${game.difficulty || 'Medium'}</span>
                    <a href="${gameUrl}" class="btn-primary">Play Now</a>
                </div>
            </div>
        `;
        
        return card;
    }
    
    function createPlaceholderCard() {
        const card = document.createElement('div');
        card.className = 'card overflow-hidden opacity-60';
        
        // Generate a random color for the placeholder
        const colors = ['#34C759', '#AF52DE', '#0A84FF', '#FF9F0A', '#FF3B30'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        card.innerHTML = `
            <div class="relative">
                <div style="background-color: ${randomColor}; height: 12rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.25rem;">
                    Coming Soon
                </div>
                <div class="absolute top-4 right-4 bg-apple-green text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Soon
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold mb-3 text-apple-dark-gray">More Games Coming</h3>
                <p class="text-apple-gray mb-4">We're constantly adding new relaxing games to our collection. Stay tuned for more exciting titles!</p>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-apple-gray">Coming Soon</span>
                    <button disabled class="bg-apple-gray text-white px-4 py-2 rounded-lg text-sm">Coming Soon</button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    function renderPlaceholders(container) {
        container.innerHTML = ''; // Clear the container first
        for (let i = 0; i < 3; i++) {
            const placeholderCard = createPlaceholderCard();
            container.appendChild(placeholderCard);
        }
    }
    
    function renderErrorMessage(message) {
        gamesContainer.innerHTML = `
            <div class="col-span-full text-center py-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p class="text-lg font-medium text-gray-800">${message}</p>
            </div>
        `;
    }
}); 