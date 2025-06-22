document.addEventListener('DOMContentLoaded', () => {
    const gamesListEl = document.getElementById('games-list');
    const noGamesMessageEl = document.getElementById('no-games-message');
    const paginationEl = document.getElementById('pagination');
    const statusFiltersEl = document.getElementById('status-filters');
    const searchInputEl = document.getElementById('search-input');
    const batchActionsEl = document.getElementById('batch-actions');
    
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

    const batchModal = {
        el: document.getElementById('batch-confirm-modal'),
        title: document.getElementById('batch-confirm-title'),
        message: document.getElementById('batch-confirm-message'),
        count: document.getElementById('batch-count'),
        feedbackPreview: document.getElementById('batch-feedback-preview'),
        feedbackText: document.getElementById('batch-feedback-text'),
        confirmBtn: document.getElementById('batch-confirm-btn'),
        cancelBtn: document.getElementById('batch-cancel-btn'),
        closeBtn: document.getElementById('close-batch-modal-btn'),
    };

    let currentPage = 1;
    let currentStatus = '';
    let searchQuery = '';
    let allGames = [];
    let selectedGames = new Set();
    let isBatchMode = false;
    let batchActionType = null; // 'approve' or 'reject'

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
        selectedGames.clear();
        updateBatchActions();
        
        gamesListEl.innerHTML = '';
        if (gamesToRender.length === 0) {
            noGamesMessageEl.classList.remove('hidden');
            paginationEl.classList.add('hidden');
            batchActionsEl.classList.add('hidden');
            return;
        }

        noGamesMessageEl.classList.add('hidden');
        paginationEl.classList.remove('hidden');
        
        if (currentStatus === 'pending' && gamesToRender.length > 0) {
            batchActionsEl.classList.remove('hidden');
        } else {
            batchActionsEl.classList.add('hidden');
        }
        
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
        
        const badgeClasses = {
            pending: 'badge-pending',
            approved: 'badge-approved',
            rejected: 'badge-rejected'
        };
        
        const dateAdded = new Date(game.dateAdded);
        const formattedDate = dateAdded.toLocaleDateString();
        const formattedTime = dateAdded.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const checkboxHtml = game.status === 'pending' ? `
            <div class="flex-shrink-0 mr-3 ${isBatchMode ? '' : 'hidden'}" id="checkbox-container-${game.id}">
                <input type="checkbox" id="select-game-${game.id}" data-id="${game.id}" class="select-game-checkbox w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
            </div>
        ` : '';
        
        return `
            <div class="game-item flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                ${checkboxHtml}
                <div class="flex items-center mb-4 md:mb-0">
                    <div class="relative">
                        <img src="${game.image || '/images/placeholder-game.jpg'}" alt="${game.name}" class="w-16 h-16 object-cover rounded-md mr-4">
                        ${game.status === 'pending' ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>' : ''}
                    </div>
                    <div>
                        <h4 class="font-bold text-lg text-gray-800">${game.name}</h4>
                        <div class="flex items-center mt-1">
                            <span class="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded mr-2">${game.category}</span>
                            <span class="text-sm text-gray-500 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                ${formattedDate} at ${formattedTime}
                            </span>
                        </div>
                        ${game.developer ? `
                        <div class="text-xs text-gray-500 mt-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            ${game.developer.name}
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="badge flex items-center ${badgeClasses[game.status]}">
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
        
        document.querySelectorAll('.select-game-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const gameId = checkbox.dataset.id;
                if (checkbox.checked) {
                    selectedGames.add(gameId);
                } else {
                    selectedGames.delete(gameId);
                }
                updateBatchActions();
            });
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
        
        // Add event listener for preview button
        document.getElementById('preview-game-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            previewGame(game);
        });
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
                        ${game.status === 'pending' ? `
                        <div class="mt-4">
                            <a href="#" id="preview-game-btn" class="w-full text-center block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Preview Game
                            </a>
                        </div>
                        ` : ''}
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
                    <div class="pt-4 border-t border-gray-200 mt-6">
                        <h4 class="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-2">Review Feedback</h4>
                        <textarea id="feedback-text" placeholder="Add feedback for the developer (optional)" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none" rows="3"></textarea>
                        <div class="flex justify-end space-x-4 mt-4">
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
                    </div>
                    ` : ''}
                    ${game.status !== 'pending' && game.feedback ? `
                    <div class="pt-4 border-t border-gray-200 mt-6">
                        <h4 class="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-2">Review Feedback</h4>
                        <div class="bg-gray-50 p-4 rounded-lg">${game.feedback}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async function handleApproval(gameId, isApproved) {
        const action = isApproved ? 'approve' : 'reject';
        const feedback = document.getElementById('feedback-text')?.value || '';
        
        try {
            const response = await fetch(`/api/admin/${action}-game/${gameId}`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ feedback })
            });
            
            const result = await response.json();
            if (result.success) {
                Toastify({ 
                    text: `Game ${isApproved ? 'approved' : 'rejected'} successfully`, 
                    backgroundColor: isApproved ? 
                        "linear-gradient(to right, #00b09b, #96c93d)" : 
                        "linear-gradient(to right, #ff5f6d, #ffc371)",
                    duration: 3000
                }).showToast();
                
                // We need to re-fetch all games to update the view
                fetchGames();
                closeModal();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            Toastify({ 
                text: `Error: ${error.message}`, 
                style: { background: "var(--toastify-color-error)" },
                duration: 4000
            }).showToast();
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
    
    // Batch modal event listeners
    batchModal.confirmBtn.addEventListener('click', () => {
        handleBatchApproval(batchActionType === 'approve');
        closeBatchModal();
    });
    
    batchModal.cancelBtn.addEventListener('click', closeBatchModal);
    batchModal.closeBtn.addEventListener('click', closeBatchModal);
    
    // Global event listeners
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeModal();
            closeBatchModal();
        }
    });
    
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

    // Add preview game functionality
    function previewGame(game) {
        // Create a preview modal
        const previewModal = document.createElement('div');
        previewModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        previewModal.id = 'game-preview-modal';
        
        previewModal.innerHTML = `
            <div class="bg-white w-11/12 h-5/6 rounded-lg flex flex-col relative">
                <div class="p-4 border-b flex justify-between items-center">
                    <h3 class="font-bold text-lg">Game Preview: ${game.name}</h3>
                    <button id="close-preview-btn" class="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="flex-1 p-4 overflow-hidden">
                    <div class="w-full h-full">
                        ${game.iframe}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(previewModal);
        
        // Add event listener to close button
        document.getElementById('close-preview-btn').addEventListener('click', () => {
            document.body.removeChild(previewModal);
        });
    }

    // Batch approval functionality
    function toggleBatchMode() {
        isBatchMode = !isBatchMode;
        const checkboxContainers = document.querySelectorAll('[id^="checkbox-container-"]');
        
        checkboxContainers.forEach(container => {
            if (isBatchMode) {
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
            }
        });
        
        const batchModeBtn = document.getElementById('batch-mode-btn');
        if (isBatchMode) {
            batchModeBtn.textContent = 'Cancel Selection';
            batchModeBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
            batchModeBtn.classList.add('bg-gray-500', 'hover:bg-gray-600');
        } else {
            batchModeBtn.textContent = 'Select Games';
            batchModeBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
            batchModeBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
            selectedGames.clear();
        }
        
        updateBatchActions();
    }
    
    function updateBatchActions() {
        const batchCount = document.getElementById('batch-selected-count');
        const batchApproveBtn = document.getElementById('batch-approve-btn');
        const batchRejectBtn = document.getElementById('batch-reject-btn');
        
        if (batchCount) {
            batchCount.textContent = selectedGames.size;
            
            if (selectedGames.size > 0) {
                batchApproveBtn.disabled = false;
                batchRejectBtn.disabled = false;
                batchApproveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                batchRejectBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                batchApproveBtn.disabled = true;
                batchRejectBtn.disabled = true;
                batchApproveBtn.classList.add('opacity-50', 'cursor-not-allowed');
                batchRejectBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }
    }
    
    async function handleBatchApproval(isApproved) {
        if (selectedGames.size === 0) return;
        
        const action = isApproved ? 'approve' : 'reject';
        const gameIds = Array.from(selectedGames);
        const feedback = document.getElementById('batch-feedback')?.value || '';
        
        try {
            const response = await fetch(`/api/admin/batch-${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ gameIds, feedback })
            });
            
            const result = await response.json();
            if (result.success) {
                Toastify({ 
                    text: `${gameIds.length} games ${isApproved ? 'approved' : 'rejected'} successfully`, 
                    backgroundColor: isApproved ? 
                        "linear-gradient(to right, #00b09b, #96c93d)" : 
                        "linear-gradient(to right, #ff5f6d, #ffc371)",
                    duration: 3000
                }).showToast();
                
                // Reset batch mode and refresh games
                toggleBatchMode();
                fetchGames();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            Toastify({ 
                text: `Error: ${error.message}`, 
                style: { background: "var(--toastify-color-error)" },
                duration: 4000
            }).showToast();
        }
    }

    // Event Listeners for batch actions
    document.getElementById('batch-mode-btn')?.addEventListener('click', toggleBatchMode);
    document.getElementById('batch-approve-btn')?.addEventListener('click', () => showBatchConfirmation(true));
    document.getElementById('batch-reject-btn')?.addEventListener('click', () => showBatchConfirmation(false));
    document.getElementById('select-all-checkbox')?.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        document.querySelectorAll('.select-game-checkbox').forEach(checkbox => {
            checkbox.checked = isChecked;
            const gameId = checkbox.dataset.id;
            if (isChecked) {
                selectedGames.add(gameId);
            } else {
                selectedGames.delete(gameId);
            }
        });
        updateBatchActions();
    });
    
    // Batch confirmation modal functions
    function showBatchConfirmation(isApprove) {
        if (selectedGames.size === 0) return;
        
        batchActionType = isApprove ? 'approve' : 'reject';
        
        batchModal.title.textContent = isApprove ? 'Confirm Approval' : 'Confirm Rejection';
        batchModal.message.textContent = `Are you sure you want to ${batchActionType} the selected games?`;
        batchModal.count.textContent = selectedGames.size;
        
        const feedback = document.getElementById('batch-feedback')?.value;
        if (feedback && feedback.trim()) {
            batchModal.feedbackPreview.classList.remove('hidden');
            batchModal.feedbackText.textContent = feedback;
        } else {
            batchModal.feedbackPreview.classList.add('hidden');
        }
        
        batchModal.confirmBtn.className = `px-4 py-2 text-white rounded-md transition-colors ${isApprove ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`;
        
        batchModal.el.classList.remove('opacity-0', 'pointer-events-none');
        document.body.classList.add('modal-active');
    }
    
    function closeBatchModal() {
        batchModal.el.classList.add('opacity-0', 'pointer-events-none');
        document.body.classList.remove('modal-active');
    }

    // Initial Load
    fetchGames();
}); 