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
            const response = await fetch(`${API_URL}?status=${currentStatus}&search=${searchQuery}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            allGames = data.games || [];
            updateStats();
            renderPage(currentPage);
        } catch (error) {
            console.error('Error fetching games:', error);
            gamesListEl.innerHTML = '<p class="text-red-500">Error loading games. Please try again later.</p>';
        }
    }

    function updateStats() {
        stats.total.textContent = allGames.length;
        stats.pending.textContent = allGames.filter(g => g.status === 'pending').length;
        stats.approved.textContent = allGames.filter(g => g.status === 'approved').length;
        stats.rejected.textContent = allGames.filter(g => g.status === 'rejected').length;
    }

    function renderPage(page) {
        currentPage = page;
        const gamesToRender = allGames; // In a real scenario, you'd filter/slice for pagination
        
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
        renderPagination(allGames.length, page);
    }
    
    function getGameHtml(game) {
        const statusColors = {
            pending: 'bg-yellow-400',
            approved: 'bg-green-500',
            rejected: 'bg-red-500',
        };
        return `
            <div class="flex items-center">
                <img src="${game.image || '/images/placeholder-game.jpg'}" alt="${game.name}" class="w-16 h-16 object-cover rounded-md mr-4">
                <div>
                    <h4 class="font-bold text-lg">${game.name}</h4>
                    <p class="text-sm text-gray-600">${game.category}</p>
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <span class="px-3 py-1 text-sm font-semibold text-white ${statusColors[game.status]} rounded-full">${game.status}</span>
                <p class="text-sm text-gray-500">${new Date(game.dateAdded).toLocaleDateString()}</p>
                <button data-id="${game.id}" class="view-details-btn px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">View Details</button>
            </div>
        `;
    }

    function addEventListenersToButtons() {
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.dataset.id));
        });
    }

    function renderPagination(totalItems, page) {
        // Simplified pagination for now
        paginationEl.innerHTML = `<p class="text-sm text-gray-600">Page ${page} of 1</p>`;
    }

    function openModal(gameId) {
        const game = allGames.find(g => g.id === gameId);
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
        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-1">
                    <img src="${game.image || '/images/placeholder-game.jpg'}" class="w-full h-auto object-cover rounded-lg shadow-md">
                    <div class="mt-4">
                        <h3 class="font-bold text-xl mb-2">${game.name}</h3>
                        <p class="text-gray-600">${game.category}</p>
                        <p class="text-sm text-gray-500 mt-1">Submitted: ${new Date(game.dateAdded).toLocaleString()}</p>
                    </div>
                </div>
                <div class="md:col-span-2 space-y-4">
                    <div><strong>Description:</strong><p class="line-clamp-4">${game.description}</p></div>
                    <div><strong>How to Play:</strong><p class="line-clamp-4">${game.howToPlay}</p></div>
                    <div><strong>Developer:</strong><p>${game.developer.name} (${game.developer.email})</p></div>
                    <div><strong>iFrame Code:</strong><pre class="bg-gray-100 p-2 rounded text-sm whitespace-pre-wrap">${escapeHtml(game.iframe)}</pre></div>
                    ${game.status === 'pending' ? `
                    <div class="flex justify-end space-x-4 pt-4">
                        <button id="reject-btn" class="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Reject</button>
                        <button id="approve-btn" class="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Approve</button>
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
            currentStatus = e.target.dataset.status;
            currentPage = 1;
            // Update active button style
            statusFiltersEl.querySelectorAll('button').forEach(btn => btn.classList.remove('bg-blue-600', 'text-white'));
            e.target.classList.add('bg-blue-600', 'text-white');
            fetchGames();
        }
    });

    searchInputEl.addEventListener('input', () => {
        searchQuery = searchInputEl.value;
        currentPage = 1;
        fetchGames();
    });

    // Initial Load
    fetchGames();
}); 