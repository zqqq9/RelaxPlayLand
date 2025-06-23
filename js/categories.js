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
    const gamesPerPage = 9;

    // Check URL parameters for category
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
        currentCategory = categoryParam;
    }

    // Initialize the page
    fetchGames();

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

    // Function to fetch games from API
    function fetchGames() {
        loadingIndicator.style.display = 'block';
        noResults.style.display = 'none';
        gamesContainer.innerHTML = '';

        // For demo purposes, use the sample data directly
        // In a production environment, you would fetch from the API
        useSampleData();
        loadingIndicator.style.display = 'none';
        updateCategoryInfo();
        renderGames();

        /* Uncomment this section to use the actual API
        fetch('/api/games')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                allGames = data;
                loadingIndicator.style.display = 'none';
                
                // Update UI with fetched games
                updateCategoryInfo();
                renderGames();
            })
            .catch(error => {
                console.error('Error fetching games:', error);
                
                // For demo purposes, use sample data if API fails
                useSampleData();
                
                loadingIndicator.style.display = 'none';
                updateCategoryInfo();
                renderGames();
            });
        */
    }

    // Function to use sample data if API fails (for demo purposes)
    function useSampleData() {
        allGames = [
            {
                "id": "1750524758590",
                "slug": "golf-orbit",
                "name": "Golf Orbit",
                "category": "Adventure",
                "description": "Golf Orbit is an exciting golf simulator game within our sports category where you aim to launch golf balls to incredible heights, even reaching Mars. Have fun in one-shot golf battles, complete challenging levels, and master the art of the perfect shot.",
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
                "description": "Dalgona Candy Honeycomb Cookie is a fun, shape-carving challenge where you'll carefully cut out designs from honeycomb cookies. With levels that feature classic dalgona, American cookies, and more, you'll have plenty of shapes to carve.",
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
                "description": "Lumber Harvest: Tree Cutting Game is a relaxing progression game where you drive a powerful tractor to clear forests and collect timber. You'll upgrade your saw, expand your truck's capacity, and unlock new areas as you turn trees into profit.",
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
                "description": "Count Masters: Stickman Games is a fast-paced running game where you gather a growing army of stickmen to clash against rival crowds. Navigate through obstacles, choose the best paths to multiply your numbers, and lead your team to victory.",
                "tags": ["Runing", "Math"],
                "image": "https://imgs.crazygames.com/count-masters-stickman-games_16x9/20250220041115/count-masters-stickman-games_16x9-cover?metadata=none&quality=40&width=273&fit=crop&dpr=2",
                "dateAdded": "2025-06-22T13:33:04.349Z",
                "status": "approved"
            },
            {
                "id": "1750601268347",
                "slug": "capybara-clicker",
                "name": "Capybara Clicker",
                "category": "Other",
                "description": "Capybara Clicker is a clicker game where you multiply the capybara population by clicking. You can buy various upgrades to increase the output of capybaras, change the weather, and unlock new skins to make you the coolest capybara in town.",
                "tags": ["Clicker"],
                "image": "https://imgs.crazygames.com/games/capybara-clicker/cover-1678290947532.png?metadata=none&quality=40&width=273&fit=crop&dpr=2",
                "dateAdded": "2025-06-22T14:07:48.347Z",
                "status": "approved"
            }
        ];
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
                    <img src="${game.image}" alt="${game.name}" class="card-image">
                    <div class="card-content">
                        <h3 class="game-title">${game.name}</h3>
                        <p class="game-description">${game.description}</p>
                        <div class="flex flex-wrap mt-auto">
                            <span class="category-badge">${game.category}</span>
                            ${tagElements}
                        </div>
                        <button class="play-button mt-3">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"></path>
                            </svg>
                            Play Now
                        </button>
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