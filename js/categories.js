document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const gamesContainer = document.getElementById('games-container');
    const categoryButtons = document.querySelectorAll('.category-item');
    const categoryTitle = document.getElementById('category-title');
    const categoryDescription = document.getElementById('category-description');
    const sortBySelect = document.getElementById('sort-by');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noResults = document.getElementById('no-results');
    const paginationContainer = document.getElementById('pagination');

    // Category descriptions
    const categoryDescriptions = {
        "all": "Browse all our free online games. Find your favorite games to play instantly in your browser with no downloads required.",
        "Puzzle": "Challenge your brain with our collection of puzzle games. From classic puzzles to innovative brain teasers, we have something for everyone.",
        "Arcade": "Experience the thrill of arcade games right in your browser. Fast-paced action and fun for all ages.",
        "Casual": "Enjoy our casual games collection - perfect for a quick gaming session or relaxing break. Easy to learn, fun to master.",
        "Action": "Get your adrenaline pumping with our action games. Fast reflexes and quick thinking required!",
        "Strategy": "Test your strategic thinking with our collection of strategy games. Plan, build, and conquer!",
        "Simulation": "Experience realistic simulations of real-world activities and scenarios. Build, manage, and explore in these immersive games.",
        "Adventure": "Embark on exciting journeys with our adventure games. Explore new worlds and discover hidden treasures.",
        "Sports": "Compete in various sports with our sports games collection. Experience the thrill of competition!",
        "Other": "Discover unique and interesting games that don't fit into traditional categories. From clickers to educational games, find something new!"
    };

    // Current state
    let allGames = [];
    let currentCategory = 'all';
    let currentSort = 'newest';
    let currentPage = 1;
    const gamesPerPage = 6;

    // Check URL parameters for category
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
        currentCategory = categoryParam;
    }

    // Initialize the page
    loadGames();

    // Add event listeners to category buttons
    categoryButtons.forEach(button => {
        // Set initial active state based on URL parameter
        if (button.dataset.category === currentCategory) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }

        button.addEventListener('click', function() {
            // Update active state
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Update current category and reset to page 1
            currentCategory = this.dataset.category;
            currentPage = 1;
            
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

    // Function to load games data
    function loadGames() {
        loadingIndicator.style.display = 'block';
        noResults.style.display = 'none';
        gamesContainer.innerHTML = '';

        // Use hardcoded game data directly instead of fetching from API
        allGames = [
            {
                "id": "1750524758590",
                "slug": "golf-orbit",
                "name": "Golf Orbit",
                "category": "Adventure",
                "description": "Golf Orbit is an exciting golf simulator game where you aim to launch golf balls to incredible heights, even reaching Mars. Have fun in one-shot golf battles and master the perfect shot.",
                "tags": ["Golf", "Sport"],
                "image": "https://imgs.crazygames.com/golf-orbit_16x9/20240620070701/golf-orbit_16x9-cover?metadata=none&quality=40&width=273&fit=crop&dpr=2",
                "dateAdded": "2025-06-21T16:52:38.590Z",
                "status": "approved"
            },
            {
                "id": "1750594882408",
                "slug": "dalgona-candy-honeycomb-cookie",
                "name": "Dalgona Candy Honeycomb Cookie",
                "category": "Puzzle",
                "description": "Dalgona Candy Honeycomb Cookie is a fun, shape-carving challenge where you'll carefully cut out designs from honeycomb cookies. With levels that feature classic dalgona and American cookies.",
                "tags": ["Puzzle"],
                "image": "https://imgs.crazygames.com/dalgona-candy-honeycomb-cookie-kam_16x9/20250521050634/dalgona-candy-honeycomb-cookie-kam_16x9-cover?metadata=none&quality=40&width=273&fit=crop&dpr=2",
                "dateAdded": "2025-06-22T12:21:22.408Z",
                "status": "approved"
            },
            {
                "id": "1750597764810",
                "slug": "lumber-harvest-tree-cutting-game",
                "name": "Lumber Harvest: Tree Cutting Game",
                "category": "Simulation",
                "description": "Lumber Harvest is a relaxing progression game where you drive a tractor to clear forests and collect timber. Upgrade your saw, expand your truck's capacity, and unlock new areas.",
                "tags": ["Simulation", "Tree"],
                "image": "https://imgs.crazygames.com/lumber-harvest-tree-cutting-game_16x9/20250619095414/lumber-harvest-tree-cutting-game_16x9-cover?metadata=none&quality=40&width=273&fit=crop&dpr=2",
                "dateAdded": "2025-06-22T13:09:24.810Z",
                "status": "approved"
            },
            {
                "id": "1750599184349",
                "slug": "count-masters-stickman-games",
                "name": "Count Masters: Stickman Games",
                "category": "Casual",
                "description": "Count Masters is a fast-paced running game where you gather a growing army of stickmen to clash against rival crowds. Navigate obstacles and multiply your numbers to win.",
                "tags": ["Running", "Math"],
                "image": "https://imgs.crazygames.com/count-masters-stickman-games_16x9/20250220041115/count-masters-stickman-games_16x9-cover?metadata=none&quality=40&width=273&fit=crop&dpr=2",
                "dateAdded": "2025-06-22T13:33:04.349Z",
                "status": "approved"
            },
            {
                "id": "1750601268347",
                "slug": "capybara-clicker",
                "name": "Capybara Clicker",
                "category": "Other",
                "description": "Capybara Clicker is a clicker game where you multiply the capybara population by clicking. Buy upgrades to increase capybara output, change weather, and unlock new skins.",
                "tags": ["Clicker"],
                "image": "https://imgs.crazygames.com/games/capybara-clicker/cover-1678290947532.png?metadata=none&quality=40&width=273&fit=crop&dpr=2",
                "dateAdded": "2025-06-22T14:07:48.347Z",
                "status": "approved"
            },
            {
                "id": "1750602347123",
                "slug": "2048",
                "name": "2048",
                "category": "Puzzle",
                "description": "2048 is an addictive number puzzle game where you combine matching tiles to create the number 2048. Slide tiles in four directions, merging identical numbers to double their value.",
                "tags": ["Puzzle", "Math", "Strategy"],
                "image": "https://imgs.crazygames.com/2048_16x9/20250620070701/2048_16x9-cover?metadata=none&quality=40&width=273&fit=crop&dpr=2",
                "dateAdded": "2025-06-22T15:12:48.347Z",
                "status": "approved"
            },
            {
                "id": "1750603456789",
                "slug": "snake-io",
                "name": "Snake.io",
                "category": "Arcade",
                "description": "Snake.io is a multiplayer snake game where you control a colorful snake and compete against other players. Eat glowing orbs to grow longer and eliminate opponents.",
                "tags": ["Multiplayer", "IO", "Snake"],
                "image": "https://imgs.crazygames.com/snake-io_16x9/20250620070701/snake-io_16x9-cover?metadata=none&quality=40&width=273&fit=crop&dpr=2",
                "dateAdded": "2025-06-22T16:34:48.347Z",
                "status": "approved"
            },
            {
                "id": "1750604567890",
                "slug": "city-builder",
                "name": "City Builder",
                "category": "Strategy",
                "description": "City Builder is a strategic simulation game where you design and manage your own thriving metropolis. Start with a small town and expand it into a bustling city.",
                "tags": ["Strategy", "Simulation", "Building"],
                "image": "https://imgs.crazygames.com/city-builder_16x9/20250620070701/city-builder_16x9-cover?metadata=none&quality=40&width=273&fit=crop&dpr=2",
                "dateAdded": "2025-06-22T17:23:48.347Z",
                "status": "approved"
            },
            {
                "id": "1750605678901",
                "slug": "basketball-stars",
                "name": "Basketball Stars",
                "category": "Sports",
                "description": "Basketball Stars is a fast-paced sports game where you play one-on-one basketball matches against the computer or friends. Choose from various players with unique abilities.",
                "tags": ["Sports", "Basketball", "Multiplayer"],
                "image": "https://imgs.crazygames.com/basketball-stars_16x9/20250620070701/basketball-stars_16x9-cover?metadata=none&quality=40&width=273&fit=crop&dpr=2",
                "dateAdded": "2025-06-22T18:12:48.347Z",
                "status": "approved"
            },
            {
                "id": "1750606789012",
                "slug": "parkour-race",
                "name": "Parkour Race",
                "category": "Action",
                "description": "Parkour Race is an exhilarating action game where you run, jump, and slide through challenging obstacle courses. Race against opponents and reach the finish line first.",
                "tags": ["Action", "Parkour", "Racing"],
                "image": "https://imgs.crazygames.com/parkour-race_16x9/20250620070701/parkour-race_16x9-cover?metadata=none&quality=40&width=273&fit=crop&dpr=2",
                "dateAdded": "2025-06-22T19:45:48.347Z",
                "status": "approved"
            }
        ];

        setTimeout(() => {
            loadingIndicator.style.display = 'none';
            updateCategoryInfo();
            renderGames();
        }, 500); // Small delay to show loading indicator
    }

    // Function to update category title and description
    function updateCategoryInfo() {
        // Update title
        if (currentCategory === 'all') {
            categoryTitle.textContent = 'All Games';
        } else {
            categoryTitle.textContent = `${currentCategory} Games`;
        }

        // Update description
        categoryDescription.textContent = categoryDescriptions[currentCategory] || categoryDescriptions['all'];
    }

    // Function to render games based on current category, sort, and page
    function renderGames() {
        // Clear games container
        gamesContainer.innerHTML = '';

        // Filter games by category and status
        let filteredGames = allGames.filter(game => game.status === "approved");
        if (currentCategory !== 'all') {
            filteredGames = filteredGames.filter(game => game.category === currentCategory);
        }

        // Sort games
        switch (currentSort) {
            case 'newest':
                filteredGames.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                break;
            case 'a-z':
                filteredGames.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        // Show no results message if no games found
        if (filteredGames.length === 0) {
            noResults.style.display = 'block';
            paginationContainer.innerHTML = '';
            return;
        } else {
            noResults.style.display = 'none';
        }

        // Paginate games
        const startIndex = (currentPage - 1) * gamesPerPage;
        const endIndex = startIndex + gamesPerPage;
        const paginatedGames = filteredGames.slice(startIndex, endIndex);

        // Render games
        paginatedGames.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'card';
            
            // Format tags for display
            const tagElements = game.tags && game.tags.length > 0 
                ? game.tags.map(tag => `<span class="category-badge">${tag}</span>`).join('')
                : '';
            
            gameCard.innerHTML = `
                <a href="/games/${game.slug}.html" class="block h-full flex flex-col">
                    <div class="relative">
                        <img src="${game.image}" alt="${game.name}" class="card-image">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                            <button class="play-button">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 mr-2">
                                    <path d="M8 5v14l11-7z"></path>
                                </svg>
                                Play Now
                            </button>
                        </div>
                    </div>
                    <div class="card-content">
                        <h3 class="game-title">${game.name}</h3>
                        <p class="game-description">${game.description}</p>
                        <div class="flex flex-wrap mt-auto">
                            <span class="category-badge primary-badge">${game.category}</span>
                            ${tagElements}
                        </div>
                    </div>
                </a>
            `;
            gamesContainer.appendChild(gameCard);
        });

        // Render pagination
        renderPagination(filteredGames.length);
    }

    // Function to render pagination
    function renderPagination(totalGames) {
        const totalPages = Math.ceil(totalGames / gamesPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-item ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                    ${currentPage === 1 ? 'disabled' : ''} 
                    data-page="${currentPage - 1}">
                &laquo;
            </button>
        `;

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust startPage if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First page
        if (startPage > 1) {
            paginationHTML += `<button class="pagination-item" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-item">...</span>`;
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-item ${i === currentPage ? 'active' : ''}" 
                        data-page="${i}">
                    ${i}
                </button>
            `;
        }

        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-item">...</span>`;
            }
            paginationHTML += `<button class="pagination-item" data-page="${totalPages}">${totalPages}</button>`;
        }

        // Next button
        paginationHTML += `
            <button class="pagination-item ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
                    ${currentPage === totalPages ? 'disabled' : ''} 
                    data-page="${currentPage + 1}">
                &raquo;
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;

        // Add event listeners to pagination buttons
        document.querySelectorAll('#pagination .pagination-item').forEach(button => {
            if (!button.hasAttribute('disabled') && button.dataset.page) {
                button.addEventListener('click', function() {
                    currentPage = parseInt(this.dataset.page);
                    renderGames();
                    // Scroll to top of games container
                    window.scrollTo({
                        top: gamesContainer.offsetTop - 100,
                        behavior: 'smooth'
                    });
                });
            }
        });
    }
}); 