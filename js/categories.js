document.addEventListener('DOMContentLoaded', function() {
    // Sample game data - in a real implementation, this would be loaded from a server
    const games = [
        {
            id: 1,
            title: "Puzzle Master",
            description: "Challenge your brain with this addictive puzzle game.",
            thumbnail: "/images/games/puzzle-master.jpg",
            url: "/games/puzzle-master.html",
            categories: ["puzzle", "casual", "relaxing"],
            popularity: 95,
            dateAdded: "2024-05-01"
        },
        {
            id: 2,
            title: "Space Shooter",
            description: "Defend the galaxy in this action-packed arcade game.",
            thumbnail: "/images/games/space-shooter.jpg",
            url: "/games/space-shooter.html",
            categories: ["arcade", "action"],
            popularity: 88,
            dateAdded: "2024-04-28"
        },
        {
            id: 3,
            title: "Candy Match",
            description: "Match colorful candies in this relaxing puzzle game.",
            thumbnail: "/images/games/candy-match.jpg",
            url: "/games/candy-match.html",
            categories: ["puzzle", "casual", "relaxing"],
            popularity: 92,
            dateAdded: "2024-05-03"
        },
        {
            id: 4,
            title: "Medieval Kingdom",
            description: "Build your kingdom and conquer territories in this strategy game.",
            thumbnail: "/images/games/medieval-kingdom.jpg",
            url: "/games/medieval-kingdom.html",
            categories: ["strategy", "adventure"],
            popularity: 85,
            dateAdded: "2024-04-15"
        },
        {
            id: 5,
            title: "Soccer Stars",
            description: "Play soccer with your favorite stars in this fun sports game.",
            thumbnail: "/images/games/soccer-stars.jpg",
            url: "/games/soccer-stars.html",
            categories: ["sports", "casual", "multiplayer"],
            popularity: 80,
            dateAdded: "2024-04-20"
        },
        {
            id: 6,
            title: "Jungle Adventure",
            description: "Explore the mysterious jungle and collect treasures.",
            thumbnail: "/images/games/jungle-adventure.jpg",
            url: "/games/jungle-adventure.html",
            categories: ["adventure", "action"],
            popularity: 82,
            dateAdded: "2024-05-05"
        },
        {
            id: 7,
            title: "Word Connect",
            description: "Test your vocabulary in this challenging word game.",
            thumbnail: "/images/games/word-connect.jpg",
            url: "/games/word-connect.html",
            categories: ["puzzle", "relaxing"],
            popularity: 78,
            dateAdded: "2024-04-10"
        },
        {
            id: 8,
            title: "Racing Fever",
            description: "Race against opponents in this high-speed driving game.",
            thumbnail: "/images/games/racing-fever.jpg",
            url: "/games/racing-fever.html",
            categories: ["action", "sports"],
            popularity: 90,
            dateAdded: "2024-05-02"
        },
        {
            id: 9,
            title: "Chess Master",
            description: "Challenge your strategic thinking in this classic board game.",
            thumbnail: "/images/games/chess-master.jpg",
            url: "/games/chess-master.html",
            categories: ["strategy", "relaxing", "multiplayer"],
            popularity: 75,
            dateAdded: "2024-04-25"
        },
        {
            id: 10,
            title: "Bubble Pop",
            description: "Pop colorful bubbles in this addictive casual game.",
            thumbnail: "/images/games/bubble-pop.jpg",
            url: "/games/bubble-pop.html",
            categories: ["casual", "puzzle", "relaxing"],
            popularity: 87,
            dateAdded: "2024-05-04"
        },
        {
            id: 11,
            title: "Zombie Survival",
            description: "Survive the zombie apocalypse in this thrilling action game.",
            thumbnail: "/images/games/zombie-survival.jpg",
            url: "/games/zombie-survival.html",
            categories: ["action", "adventure"],
            popularity: 89,
            dateAdded: "2024-04-18"
        },
        {
            id: 12,
            title: "Mahjong Gardens",
            description: "Relax with this beautiful Mahjong solitaire game.",
            thumbnail: "/images/games/mahjong-gardens.jpg",
            url: "/games/mahjong-gardens.html",
            categories: ["puzzle", "relaxing"],
            popularity: 83,
            dateAdded: "2024-04-30"
        }
    ];

    // Category descriptions
    const categoryDescriptions = {
        "all": "Browse all our free online games. Find your favorite games to play instantly in your browser with no downloads required.",
        "puzzle": "Challenge your brain with our collection of puzzle games. From classic puzzles to innovative brain teasers, we have something for everyone.",
        "arcade": "Experience the thrill of arcade games right in your browser. Fast-paced action and fun for all ages.",
        "casual": "Enjoy our casual games collection - perfect for a quick gaming session or relaxing break. Easy to learn, fun to master.",
        "action": "Get your adrenaline pumping with our action games. Fast reflexes and quick thinking required!",
        "strategy": "Test your strategic thinking with our collection of strategy games. Plan, build, and conquer!",
        "relaxing": "Unwind with our selection of relaxing games. Perfect for stress relief and peaceful entertainment.",
        "adventure": "Embark on exciting journeys with our adventure games. Explore new worlds and discover hidden treasures.",
        "sports": "Compete in various sports with our sports games collection. Experience the thrill of competition!",
        "multiplayer": "Play with friends or meet new people in our multiplayer games. Cooperative and competitive options available."
    };

    // DOM elements
    const gamesContainer = document.getElementById('games-container');
    const categoryButtons = document.querySelectorAll('.category-item');
    const categoryTitle = document.getElementById('category-title');
    const categoryDescription = document.getElementById('category-description');
    const sortBySelect = document.getElementById('sort-by');

    // Current state
    let currentCategory = 'all';
    let currentSort = 'popular';

    // Check URL parameters for category
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
        currentCategory = categoryParam;
        // Update active button
        categoryButtons.forEach(button => {
            if (button.dataset.category === currentCategory) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    // Initialize the page
    updateCategoryInfo();
    renderGames();

    // Add event listeners to category buttons
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Update current category
            currentCategory = this.dataset.category;
            
            // Update URL without reloading the page
            const url = new URL(window.location);
            if (currentCategory === 'all') {
                url.searchParams.delete('category');
            } else {
                url.searchParams.set('category', currentCategory);
            }
            window.history.pushState({}, '', url);

            // Update UI
            updateCategoryInfo();
            renderGames();
        });
    });

    // Add event listener to sort select
    sortBySelect.addEventListener('change', function() {
        currentSort = this.value;
        renderGames();
    });

    // Function to update category title and description
    function updateCategoryInfo() {
        // Update title
        if (currentCategory === 'all') {
            categoryTitle.textContent = 'All Games';
        } else {
            // Capitalize first letter and add "Games"
            const categoryName = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);
            categoryTitle.textContent = `${categoryName} Games`;
        }

        // Update description
        categoryDescription.textContent = categoryDescriptions[currentCategory] || categoryDescriptions['all'];
    }

    // Function to render games based on current category and sort
    function renderGames() {
        // Clear loading indicator
        gamesContainer.innerHTML = '';

        // Filter games by category
        let filteredGames = games;
        if (currentCategory !== 'all') {
            filteredGames = games.filter(game => game.categories.includes(currentCategory));
        }

        // Sort games
        switch (currentSort) {
            case 'popular':
                filteredGames.sort((a, b) => b.popularity - a.popularity);
                break;
            case 'newest':
                filteredGames.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                break;
            case 'a-z':
                filteredGames.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }

        // Render games
        if (filteredGames.length === 0) {
            gamesContainer.innerHTML = `
                <div class="col-span-full text-center py-10">
                    <p class="text-gray-600">No games found in this category.</p>
                </div>
            `;
        } else {
            filteredGames.forEach(game => {
                const gameCard = document.createElement('div');
                gameCard.className = 'card overflow-hidden';
                gameCard.innerHTML = `
                    <a href="${game.url}" class="block">
                        <img src="${game.thumbnail}" alt="${game.title}" class="w-full h-48 object-cover">
                        <div class="p-4">
                            <h3 class="font-bold text-lg mb-2 text-apple-dark-gray">${game.title}</h3>
                            <p class="text-apple-gray text-sm mb-3">${game.description}</p>
                            <div class="flex flex-wrap">
                                ${game.categories.map(cat => 
                                    `<span class="category-badge">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </a>
                `;
                gamesContainer.appendChild(gameCard);
            });
        }
    }
}); 