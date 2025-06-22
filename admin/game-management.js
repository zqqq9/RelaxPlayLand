document.addEventListener('DOMContentLoaded', () => {
    // 检查是否已登录
    function checkLoginStatus() {
        const apiKey = localStorage.getItem('api_key');
        if (!apiKey) {
            // 没有API密钥，重定向到登录页面
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
    
    // 检查登录状态
    if (!checkLoginStatus()) {
        return; // 如果未登录，停止执行后续代码
    }
    
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

    // 检查batchModal对象的所有属性是否存在
    const isBatchModalComplete = batchModal.el && batchModal.title && batchModal.message && 
                               batchModal.count && batchModal.feedbackPreview && 
                               batchModal.feedbackText && batchModal.confirmBtn && 
                               batchModal.cancelBtn && batchModal.closeBtn;
    
    if (!isBatchModalComplete) {
        console.warn('批量操作模态框的某些元素不存在，批量操作功能可能不可用');
    }

    let currentPage = 1;
    let currentStatus = '';
    let searchQuery = '';
    let allGames = [];
    let selectedGames = new Set();
    let isBatchMode = false;
    let batchActionType = null; // 'approve' or 'reject'

    // Use a local API URL for development, or the production URL in production
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = isLocalDev ? '/api/admin/games' : 'https://relaxplayland.online/api/admin/games';
    const API_KEY = localStorage.getItem('api_key') || '';
    
    // 检查API连接状态
    async function checkApiConnection() {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            
            // 添加认证头（如果有）
            if (API_KEY) {
                headers['Authorization'] = `Bearer ${API_KEY}`;
            }
            
            const response = await fetch(API_URL, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: headers
            });
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('认证失败，请重新登录');
                }
                throw new Error(`API连接失败: ${response.status} ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('API返回了非JSON格式的数据:', contentType);
                throw new Error(`API返回了非JSON格式的数据: ${contentType}`);
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
            
            console.log(`正在请求API: ${url.toString()}`);
            
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            
            // 添加认证头（如果有）
            if (API_KEY) {
                headers['Authorization'] = `Bearer ${API_KEY}`;
            }
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: headers
            });
            
            console.log(`API响应状态: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                // 如果是401或403，可能是认证问题
                if (response.status === 401 || response.status === 403) {
                    throw new Error('认证失败，请重新登录');
                }
                throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('API返回了非JSON格式的数据:', contentType);
                throw new Error(`API返回了非JSON格式的数据: ${contentType}`);
            }
            
            const responseText = await response.text();
            console.log(`API响应内容: ${responseText.substring(0, 200)}...`);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON解析错误:', parseError);
                console.error('原始响应:', responseText.substring(0, 500));
                throw new Error('无法解析API响应为JSON格式');
            }
            
            // The API now returns a paginated list of games and the full list for stats
            const gamesForStats = data.allGames || [];
            const gamesForDisplay = data.games || [];

            console.log(`获取到${gamesForDisplay.length}个游戏, 总计${data.total || 0}个游戏`);

            updateStats(gamesForStats);
            renderPage(gamesForDisplay, data.total, data.page, data.totalPages);

        } catch (error) {
            console.error('Error fetching games:', error);
            gamesListEl.innerHTML = '<p class="text-red-500">Error loading games. Please try again later.</p>';
            showError(`加载游戏列表失败: ${error.message}`);
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
            gameEl.innerHTML = getGameHtml(game);
            gamesListEl.appendChild(gameEl.firstElementChild);
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
            <div class="absolute top-2 left-2 z-10 ${isBatchMode ? '' : 'hidden'}" id="checkbox-container-${game.id}">
                <input type="checkbox" id="select-game-${game.id}" data-id="${game.id}" class="select-game-checkbox w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500">
            </div>
        ` : '';
        
        return `
            <div class="game-card game-item">
                ${checkboxHtml}
                <div class="game-card-image">
                    <img src="${game.image || '/images/placeholder-game.jpg'}" alt="${game.name}" class="w-full h-full object-cover">
                    ${game.status === 'pending' ? '<div class="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>' : ''}
                </div>
                <div class="game-card-content">
                    <h4 class="font-bold text-lg text-gray-800 mb-2">${game.name}</h4>
                    <div class="flex flex-wrap gap-1 mb-2">
                        <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">${game.category}</span>
                    </div>
                    <div class="text-sm text-gray-500 flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        ${formattedDate} at ${formattedTime}
                    </div>
                    ${game.developer ? `
                    <div class="text-xs text-gray-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        ${game.developer.name}
                    </div>
                    ` : ''}
                </div>
                <div class="game-card-footer">
                    <span class="badge flex items-center ${badgeClasses[game.status]}">
                        ${statusIcons[game.status]}
                        ${game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                    </span>
                    <a href="game-details.html?id=${game.id}" class="btn btn-primary px-3 py-1 text-sm flex items-center">
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
            const baseClasses = "btn px-3 py-1 text-sm font-medium";
            const activeClasses = isActive 
                ? "btn-primary" 
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
            <button data-page="${page - 1}" class="btn px-3 py-1 text-sm font-medium ${page === 1 ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'}" ${page === 1 ? 'disabled' : ''}>
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
            <button data-page="${page + 1}" class="btn px-3 py-1 text-sm font-medium ${page === totalPages ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'}" ${page === totalPages ? 'disabled' : ''}>
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
        if (batchModeBtn) {
            if (isBatchMode) {
                batchModeBtn.textContent = 'Cancel Selection';
                batchModeBtn.classList.remove('btn-primary');
                batchModeBtn.classList.add('bg-gray-500', 'hover:bg-gray-600', 'text-white');
            } else {
                batchModeBtn.textContent = 'Select Games';
                batchModeBtn.classList.add('btn-primary');
                batchModeBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600', 'text-white');
                selectedGames.clear();
            }
        }
        
        updateBatchActions();
    }
    
    function updateBatchActions() {
        const selectedCount = document.getElementById('selected-count');
        const rejectAllBtn = document.getElementById('reject-all-btn');
        const approveAllBtn = document.getElementById('approve-all-btn');
        const selectAllCheckbox = document.getElementById('select-all');
        
        if (selectedCount) {
            selectedCount.textContent = `${selectedGames.size} games selected`;
        }
        
        if (rejectAllBtn && approveAllBtn) {
            if (selectedGames.size > 0) {
                rejectAllBtn.disabled = false;
                approveAllBtn.disabled = false;
                rejectAllBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                approveAllBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                rejectAllBtn.disabled = true;
                approveAllBtn.disabled = true;
                rejectAllBtn.classList.add('opacity-50', 'cursor-not-allowed');
                approveAllBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }
        
        if (selectAllCheckbox) {
            const allCheckboxes = document.querySelectorAll('.select-game-checkbox');
            const allChecked = allCheckboxes.length > 0 && Array.from(allCheckboxes).every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
        }
    }
    
    async function handleBatchApproval(isApproved) {
        if (selectedGames.size === 0) return;
        
        const action = isApproved ? 'approve' : 'reject';
        const gameIds = Array.from(selectedGames);
        const feedbackElement = document.getElementById('batch-feedback');
        const feedback = feedbackElement ? feedbackElement.value || '' : '';
        
        console.log(`正在批量${isApproved ? '批准' : '拒绝'}游戏, 数量: ${gameIds.length}, 反馈: ${feedback}`);
        console.log('游戏ID列表:', gameIds);
        
        try {
            const apiUrl = `https://relaxplayland.online/api/admin/games/batch-${action}`;
            console.log(`请求API: ${apiUrl}`);
            
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            
            // 添加认证头（如果有）
            if (API_KEY) {
                headers['Authorization'] = `Bearer ${API_KEY}`;
            }
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                mode: 'cors',
                credentials: 'include',
                headers: headers,
                body: JSON.stringify({ gameIds, feedback })
            });
            
            console.log(`API响应状态: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                // 如果是401或403，可能是认证问题
                if (response.status === 401 || response.status === 403) {
                    throw new Error('认证失败，请重新登录');
                }
                throw new Error(`批量${isApproved ? '批准' : '拒绝'}失败: ${response.status} ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('API返回了非JSON格式的数据:', contentType);
                throw new Error(`API返回了非JSON格式的数据: ${contentType}`);
            }
            
            const responseText = await response.text();
            console.log(`API响应内容: ${responseText}`);
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON解析错误:', parseError);
                console.error('原始响应:', responseText.substring(0, 500));
                throw new Error('无法解析API响应为JSON格式');
            }
            
            if (result.success) {
                console.log(`批量${isApproved ? '批准' : '拒绝'}成功, 处理了${gameIds.length}个游戏`);
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
                throw new Error(result.message || `批量${isApproved ? '批准' : '拒绝'}失败`);
            }
        } catch (error) {
            console.error(`批量${isApproved ? '批准' : '拒绝'}错误:`, error);
            showError(`Error: ${error.message}`);
        }
    }
    
    // Batch confirmation modal functions
    function showBatchConfirmation(isApprove) {
        if (!isBatchModalComplete) {
            console.error('批量操作模态框的某些元素不存在，无法显示确认对话框');
            return;
        }
        
        batchActionType = isApprove ? 'approve' : 'reject';
        
        batchModal.title.textContent = isApprove ? 'Confirm Approval' : 'Confirm Rejection';
        batchModal.message.textContent = isApprove 
            ? 'Are you sure you want to approve all selected games?' 
            : 'Are you sure you want to reject all selected games?';
        batchModal.count.textContent = `${selectedGames.size}`;
        
        const feedbackText = document.getElementById('batch-feedback').value.trim();
        if (feedbackText) {
            batchModal.feedbackText.textContent = feedbackText;
            batchModal.feedbackPreview.classList.remove('hidden');
        } else {
            batchModal.feedbackPreview.classList.add('hidden');
        }
        
        batchModal.confirmBtn.classList.remove('bg-indigo-600', 'bg-red-500', 'bg-green-500');
        if (isApprove) {
            batchModal.confirmBtn.classList.add('btn-success');
        } else {
            batchModal.confirmBtn.classList.add('btn-danger');
        }
        
        batchModal.el.classList.remove('opacity-0', 'pointer-events-none');
        document.body.classList.add('modal-active');
    }
    
    function closeBatchModal() {
        if (!batchModal.el) {
            console.error('批量操作模态框元素不存在，无法关闭');
            return;
        }
        batchModal.el.classList.add('opacity-0', 'pointer-events-none');
        document.body.classList.remove('modal-active');
    }

    // Event Listeners
    
    // Batch modal event listeners
    if (batchModal.confirmBtn) {
        batchModal.confirmBtn.addEventListener('click', () => {
            handleBatchApproval(batchActionType === 'approve');
            closeBatchModal();
        });
    }
    
    if (batchModal.cancelBtn) {
        batchModal.cancelBtn.addEventListener('click', closeBatchModal);
    }
    
    if (batchModal.closeBtn) {
        batchModal.closeBtn.addEventListener('click', closeBatchModal);
    }
    
    // Global event listeners
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeBatchModal();
        }
    });
    
    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('api_key');
            window.location.href = 'login.html';
        });
    }
    
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
    const approveAllBtn = document.getElementById('approve-all-btn');
    const rejectAllBtn = document.getElementById('reject-all-btn');
    const selectAllCheckbox = document.getElementById('select-all');
    
    if (batchModeBtn) batchModeBtn.addEventListener('click', toggleBatchMode);
    if (approveAllBtn) approveAllBtn.addEventListener('click', () => showBatchConfirmation(true));
    if (rejectAllBtn) rejectAllBtn.addEventListener('click', () => showBatchConfirmation(false));
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