document.addEventListener('DOMContentLoaded', () => {
    const gamesListEl = document.getElementById('games-list');
    const noGamesMessageEl = document.getElementById('no-games-message');
    const paginationEl = document.getElementById('pagination');
    const statusFiltersEl = document.getElementById('status-filters');
    const searchInputEl = document.getElementById('search-input');
    const batchActionsEl = document.getElementById('batch-actions');
    
    // 检查必要的DOM元素是否存在
    if (!gamesListEl || !noGamesMessageEl || !paginationEl) {
        console.error('必要的DOM元素不存在，无法初始化游戏管理页面');
        return;
    }
    
    const stats = {
        total: document.getElementById('total-games'),
        pending: document.getElementById('pending-games'),
        approved: document.getElementById('approved-games'),
        rejected: document.getElementById('rejected-games'),
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

    const API_URL = 'https://relaxplayland.online/api/games';
    
    // 检查API连接状态
    async function checkApiConnection() {
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`API连接失败: ${response.status} ${response.statusText}`);
            }
            
            console.log('API连接成功');
            return true;
        } catch (error) {
            console.error('API连接错误:', error);
            showError(`无法连接到API: ${error.message}`);
            return false;
        }
    }
    
    // 显示错误消息
    function showError(message) {
        console.error(message);
        try {
            if (typeof Toastify === 'function') {
                Toastify({
                    text: message,
                    style: { background: "#ff5f6d" },
                    duration: 5000
                }).showToast();
            } else {
                alert(message);
            }
        } catch (err) {
            console.error('Toastify error:', err);
            alert(message);
        }
    }

    async function fetchGames() {
        try {
            // Build the URL with query parameters
            const url = new URL(API_URL, window.location.origin);
            if (currentStatus) url.searchParams.append('status', currentStatus);
            if (searchQuery) url.searchParams.append('search', searchQuery);
            if (currentPage) url.searchParams.append('page', currentPage);
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
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
                    <a href="game-details.html?id=${game.id}" class="view-details-btn px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                    </a>
                </div>
            </div>
        `;
    }

    function addEventListenersToButtons() {
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
            const response = await fetch(`https://relaxplayland.online/api/admin/batch-${action}`, {
                method: 'POST',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ gameIds, feedback })
            });
            
            const result = await response.json();
            if (result.success) {
                try {
                    if (typeof Toastify === 'function') {
                        Toastify({ 
                            text: `${gameIds.length} games ${isApproved ? 'approved' : 'rejected'} successfully`, 
                            backgroundColor: isApproved ? 
                                "linear-gradient(to right, #00b09b, #96c93d)" : 
                                "linear-gradient(to right, #ff5f6d, #ffc371)",
                            duration: 3000
                        }).showToast();
                    } else {
                        alert(`${gameIds.length} games ${isApproved ? 'approved' : 'rejected'} successfully`);
                    }
                } catch (toastError) {
                    console.error('Toastify error:', toastError);
                    alert(`${gameIds.length} games ${isApproved ? 'approved' : 'rejected'} successfully`);
                }
                
                // Reset batch mode and refresh games
                toggleBatchMode();
                fetchGames();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showError(`Error: ${error.message}`);
        }
    }
    
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

    // Event Listeners
    
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

    // Event Listeners for batch actions
    const batchModeBtn = document.getElementById('batch-mode-btn');
    const batchApproveBtn = document.getElementById('batch-approve-btn');
    const batchRejectBtn = document.getElementById('batch-reject-btn');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    
    if (batchModeBtn) batchModeBtn.addEventListener('click', toggleBatchMode);
    if (batchApproveBtn) batchApproveBtn.addEventListener('click', () => showBatchConfirmation(true));
    if (batchRejectBtn) batchRejectBtn.addEventListener('click', () => showBatchConfirmation(false));
    if (selectAllCheckbox) selectAllCheckbox.addEventListener('change', (e) => {
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

    // Initial Load
    checkApiConnection().then(isConnected => {
        if (isConnected) {
            fetchGames();
        }
    });
}); 