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

        // API URL - adjust this to your actual API endpoint
        const apiUrl = '/api/games';

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Games fetched successfully:', data);
                allGames = data;
                loadingIndicator.style.display = 'none';
                updateCategoryInfo();
                renderGames();
            })
            .catch(error => {
                console.error('Error fetching games:', error);
                // Show error message to user
                loadingIndicator.style.display = 'none';
                gamesContainer.innerHTML = `
                    <div class="error-message">
                        <p>Sorry, we couldn't load the games at this time.</p>
                        <p>Please try again later or contact support if the problem persists.</p>
                        <button id="retry-button" class="retry-button">Try Again</button>
                    </div>
                `;
                
                // Add event listener to retry button
                document.getElementById('retry-button').addEventListener('click', fetchGames);
            });
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