document.addEventListener('DOMContentLoaded', () => {
    const gamesListEl = document.getElementById('games-list');
    const noGamesMessageEl = document.getElementById('no-games-message');
    const paginationEl = document.getElementById('pagination');
    const statusFiltersEl = document.getElementById('status-filters');
    const searchInputEl = document.getElementById('search-input');
    
    const stats = {
        total: document.getElementById('total-games'),
        pending: document.getElementById('pending-games'),
        approved: document.getElementById('approved-games'),
        rejected: document.getElementById('rejected-games'),
    };

    const modal = {
        el: document.getElementById('game-details-modal'),
        body: document.getElementById('modal-body'),
        closeBtn: document.getElementById('close-modal-btn'),
    };

    let currentPage = 1;
    let currentStatus = '';
    let searchQuery = '';
    let allGames = [];

    const API_URL = '/api/games';

    async function fetchGames() {
        try {
            // Build the URL with query parameters
            const url = new URL(API_URL, window.location.origin);
            if (currentStatus) url.searchParams.append('status', currentStatus);
            if (searchQuery) url.searchParams.append('search', searchQuery);
            if (currentPage) url.searchParams.append('page', currentPage);
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            
            // The API now returns a paginated list of games and the full list for stats
            const gamesForStats = data.allGames || [];
            const gamesForDisplay = data.games || [];

            updateStats(gamesForStats);
            renderPage(gamesForDisplay, data.total, data.page, data.totalPages);

        } catch (error) {
            console.error('Error fetching games:', error);
            gamesListEl.innerHTML = '<p class="text-red-500">Error loading games. Please try again later.</p>';
        }
    }

    function updateStats(games) {
        stats.total.textContent = games.length;
        stats.pending.textContent = games.filter(g => g.status === 'pending').length;
        stats.approved.textContent = games.filter(g => g.status === 'approved').length;
        stats.rejected.textContent = games.filter(g => g.status === 'rejected').length;
    }

    function renderPage(gamesToRender, total, page, totalPages) {
        currentPage = page;
        allGames = gamesToRender;
        
        gamesListEl.innerHTML = '';
        if (gamesToRender.length === 0) {
            noGamesMessageEl.classList.remove('hidden');
            paginationEl.classList.add('hidden');
            return;
        }

        noGamesMessageEl.classList.add('hidden');
        paginationEl.classList.remove('hidden');
        
        gamesToRender.forEach(game => {
            const gameEl = document.createElement('div');
            gameEl.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-lg';
            gameEl.innerHTML = getGameHtml(game);
            gamesListEl.appendChild(gameEl);
        });

        addEventListenersToButtons();
        renderPagination(total, page, totalPages);
    }
    
    function getGameHtml(game) {
        const statusColors = {
            pending: 'bg-yellow-400',
            approved: 'bg-green-500',
            rejected: 'bg-red-500',
        };
        
        const statusIcons = {
            pending: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
            approved: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
            rejected: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
        };
        
        return `
            <div class="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center mb-4 md:mb-0">
                    <img src="${game.image || '/images/placeholder-game.jpg'}" alt="${game.name}" class="w-16 h-16 object-cover rounded-md mr-4">
                    <div>
                        <h4 class="font-bold text-lg text-gray-800">${game.name}</h4>
                        <div class="flex items-center mt-1">
                            <span class="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded mr-2">${game.category}</span>
                            <span class="text-sm text-gray-500">${new Date(game.dateAdded).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="flex items-center px-3 py-1 text-sm font-semibold text-white ${statusColors[game.status]} rounded-full">
                        ${statusIcons[game.status]}
                        ${game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                    </span>
                    <button data-id="${game.id}" class="view-details-btn px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                    </button>
                </div>
            </div>
        `;
    }

    function addEventListenersToButtons() {
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.dataset.id));
        });
    }

    function renderPagination(totalItems, page, totalPages) {
        if (totalPages <= 1) {
            paginationEl.innerHTML = `<p class="text-sm text-gray-600">Showing all ${totalItems} items</p>`;
            return;
        }
        
        const createPageButton = (pageNum, isActive = false, isDisabled = false) => {
            const baseClasses = "px-3 py-1 rounded-md text-sm font-medium";
            const activeClasses = isActive 
                ? "bg-indigo-600 text-white" 
                : "bg-white text-gray-700 hover:bg-gray-50";
            const disabledClasses = isDisabled 
                ? "opacity-50 cursor-not-allowed" 
                : "cursor-pointer";
                
            return `<button data-page="${pageNum}" class="${baseClasses} ${activeClasses} ${disabledClasses}" ${isDisabled ? 'disabled' : ''}>${pageNum}</button>`;
        };
        
        let paginationHTML = `
            <div class="flex items-center justify-between">
                <p class="text-sm text-gray-600">Showing page ${page} of ${totalPages}</p>
                <div class="flex space-x-1">
        `;
        
        // Previous button
        paginationHTML += `
            <button data-page="${page - 1}" class="px-3 py-1 rounded-md text-sm font-medium ${page === 1 ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'}" ${page === 1 ? 'disabled' : ''}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
        `;
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page if not visible
        if (startPage > 1) {
            paginationHTML += createPageButton(1);
            if (startPage > 2) paginationHTML += `<span class="px-3 py-1">...</span>`;
        }
        
        // Visible pages
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += createPageButton(i, i === page);
        }
        
        // Last page if not visible
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) paginationHTML += `<span class="px-3 py-1">...</span>`;
            paginationHTML += createPageButton(totalPages);
        }
        
        // Next button
        paginationHTML += `
            <button data-page="${page + 1}" class="px-3 py-1 rounded-md text-sm font-medium ${page === totalPages ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'}" ${page === totalPages ? 'disabled' : ''}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        `;
        
        paginationHTML += `
                </div>
            </div>
        `;
        
        paginationEl.innerHTML = paginationHTML;
        
        // Add event listeners to pagination buttons
        paginationEl.querySelectorAll('button:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const pageNum = parseInt(btn.dataset.page);
                if (pageNum && pageNum !== currentPage) {
                    currentPage = pageNum;
                    fetchGames();
                }
            });
        });
    }

    function openModal(gameId) {
        // We need to find the game in the complete list fetched for stats
        const allGamesList = JSON.parse(JSON.stringify(allGames));
        const game = allGamesList.find(g => g.id === gameId);
        if (!game) return;

        modal.body.innerHTML = getModalBodyHtml(game);
        modal.el.classList.remove('opacity-0', 'pointer-events-none');
        document.body.classList.add('modal-active');
        
        document.getElementById('approve-btn')?.addEventListener('click', () => handleApproval(game.id, true));
        document.getElementById('reject-btn')?.addEventListener('click', () => handleApproval(game.id, false));
    }

    function closeModal() {
        modal.el.classList.add('opacity-0', 'pointer-events-none');
        document.body.classList.remove('modal-active');
    }

    function getModalBodyHtml(game) {
        const statusColors = {
            pending: 'bg-yellow-400',
            approved: 'bg-green-500',
            rejected: 'bg-red-500',
        };
        
        const statusLabels = {
            pending: 'Pending Review',
            approved: 'Approved',
            rejected: 'Rejected'
        };

        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-1">
                    <div class="relative">
                        <img src="${game.image || '/images/placeholder-game.jpg'}" class="w-full h-auto object-cover rounded-lg shadow-md">
                        <span class="absolute top-3 right-3 px-3 py-1 text-sm font-semibold text-white ${statusColors[game.status]} rounded-full">
                            ${statusLabels[game.status]}
                        </span>
                    </div>
                    <div class="mt-4">
                        <h3 class="font-bold text-xl mb-2 text-gray-800">${game.name}</h3>
                        <div class="flex flex-wrap gap-2 mb-3">
                            <span class="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded">${game.category}</span>
                            ${game.tags && game.tags.length > 0 ? game.tags.map(tag => 
                                `<span class="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">${tag}</span>`
                            ).join('') : ''}
                        </div>
                        <div class="text-sm text-gray-500 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Submitted: ${new Date(game.dateAdded).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div class="md:col-span-2 space-y-5">
                    <div>
                        <h4 class="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-2">Description</h4>
                        <div class="bg-gray-50 p-4 rounded-lg">${game.description}</div>
                    </div>
                    <div>
                        <h4 class="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-2">How to Play</h4>
                        <div class="bg-gray-50 p-4 rounded-lg">${game.howToPlay}</div>
                    </div>
                    <div>
                        <h4 class="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-2">Developer</h4>
                        <div class="bg-gray-50 p-4 rounded-lg flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <div>
                                <p class="font-medium">${game.developer.name}</p>
                                <p class="text-sm text-gray-500">${game.developer.email}</p>
                                ${game.developer.website ? `<a href="${game.developer.website}" target="_blank" class="text-sm text-indigo-600 hover:text-indigo-800 mt-1 inline-block">${game.developer.website}</a>` : ''}
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-2">iFrame Code</h4>
                        <pre class="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap border border-gray-200 overflow-auto">${escapeHtml(game.iframe)}</pre>
                    </div>
                    ${game.status === 'pending' ? `
                    <div class="flex justify-end space-x-4 pt-4 border-t border-gray-200 mt-6">
                        <button id="reject-btn" class="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Reject
                        </button>
                        <button id="approve-btn" class="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Approve
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async function handleApproval(gameId, isApproved) {
        const action = isApproved ? 'approve' : 'reject';
        try {
            const response = await fetch(`/api/admin/${action}-game/${gameId}`, { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                Toastify({ text: `Game ${action}ed successfully`, backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)" }).showToast();
                // We need to re-fetch all games to update the view
                fetchGames();
                closeModal();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            Toastify({ text: `Error: ${error.message}`, style: { background: "var(--toastify-color-error)" } }).showToast();
        }
    }

    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    // Event Listeners
    modal.closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => e.key === 'Escape' && closeModal());
    
    statusFiltersEl.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
            const status = e.target.dataset.status;
            if (status !== currentStatus) {
                currentStatus = status;
                currentPage = 1;
                // Update active button style
                statusFiltersEl.querySelectorAll('button').forEach(btn => {
                    btn.classList.remove('bg-indigo-600', 'text-white', 'text-gray-700', 'bg-gray-200');
                    if (btn.dataset.status === currentStatus) {
                        btn.classList.add('bg-indigo-600', 'text-white');
                    } else {
                        btn.classList.add('text-gray-700', 'bg-gray-200');
                    }
                });
                
                // Add transition effect
                e.target.classList.add('transform', 'scale-105');
                setTimeout(() => {
                    e.target.classList.remove('transform', 'scale-105');
                }, 200);
                
                fetchGames();
            }
        }
    });

    searchInputEl.addEventListener('input', debounce(() => {
        searchQuery = searchInputEl.value;
        currentPage = 1;
        fetchGames();
    }, 300));

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // Initial Load
    fetchGames();
}); 