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

    // DOM Elements
    const gameTitle = document.getElementById('game-title');
    const gameStatusBadge = document.getElementById('game-status-badge');
    const gameImage = document.getElementById('game-image');
    const gameName = document.getElementById('game-name');
    const gameCategory = document.getElementById('game-category');
    const gameDateAdded = document.getElementById('game-date-added');
    const developerName = document.getElementById('developer-name');
    const developerEmail = document.getElementById('developer-email');
    const developerWebsite = document.getElementById('developer-website');
    const gamePreview = document.getElementById('game-preview');
    const gameDescription = document.getElementById('game-description');
    const gameHowToPlay = document.getElementById('game-how-to-play');
    const gameIframeCode = document.getElementById('game-iframe-code');
    const reviewSection = document.getElementById('review-section');
    const feedbackDisplay = document.getElementById('feedback-display');
    const feedbackContent = document.getElementById('feedback-content');
    const feedbackText = document.getElementById('feedback-text');
    const approveBtn = document.getElementById('approve-btn');
    const rejectBtn = document.getElementById('reject-btn');

    // Get game ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');

    if (!gameId) {
        showError('No game ID provided. Please go back to the game list and select a game.');
        return;
    }

    // Constants
    // Use a local API URL for development, or the production URL in production
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = isLocalDev ? `/api/admin/games/${gameId}` : `https://relaxplayland.online/api/admin/games/${gameId}`;
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
    
    // Status badge classes
    const statusClasses = {
        pending: 'badge-pending',
        approved: 'badge-approved',
        rejected: 'badge-rejected'
    };
    
    // Load game data
    async function loadGameData() {
        try {
            console.log(`正在请求游戏数据: ${API_URL}`);
            
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
            
            console.log(`API响应状态: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                // 如果是401或403，可能是认证问题
                if (response.status === 401 || response.status === 403) {
                    throw new Error('认证失败，请重新登录');
                }
                throw new Error(`Failed to load game data: ${response.status} ${response.statusText}`);
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
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load game data');
            }
            
            const game = data.game;
            if (!game) {
                throw new Error('Game data not found in API response');
            }
            
            console.log('游戏数据:', game);
            renderGameData(game);
        } catch (error) {
            console.error('Error loading game data:', error);
            showError(`Error loading game data: ${error.message}`);
        }
    }

    // Render game data
    function renderGameData(game) {
        // Set page title
        document.title = `${game.name} | RelaxPlayLand Admin`;
        
        // Update game details
        gameTitle.textContent = game.name;
        gameName.textContent = game.name;
        
        // Set status badge
        gameStatusBadge.className = `ml-4 badge ${statusClasses[game.status] || 'badge-pending'}`;
        gameStatusBadge.textContent = game.status.charAt(0).toUpperCase() + game.status.slice(1);
        
        // Set image
        if (game.image) {
            gameImage.src = game.image;
            gameImage.alt = game.name;
        }
        
        // Set category
        gameCategory.textContent = game.category || 'Uncategorized';
        
        // Set date
        const date = new Date(game.dateAdded);
        gameDateAdded.textContent = date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Set developer info
        if (game.developer) {
            developerName.textContent = game.developer.name || 'Unknown';
            developerEmail.textContent = game.developer.email || '';
            
            if (game.developer.website) {
                developerWebsite.href = game.developer.website;
                developerWebsite.textContent = game.developer.website;
                developerWebsite.classList.remove('hidden');
            } else {
                developerWebsite.classList.add('hidden');
            }
        }
        
        // Set game description and how to play
        gameDescription.innerHTML = game.description || 'No description provided.';
        gameHowToPlay.innerHTML = game.howToPlay || 'No instructions provided.';
        
        // Set iframe code
        gameIframeCode.textContent = game.iframe || '';
        
        // Set game preview
        if (game.iframe) {
            gamePreview.innerHTML = game.iframe;
        } else {
            gamePreview.innerHTML = '<div class="flex items-center justify-center h-full bg-gray-100"><p class="text-gray-500">No preview available</p></div>';
        }
        
        // Show/hide review section based on game status
        if (game.status === 'pending') {
            reviewSection.classList.remove('hidden');
            feedbackDisplay.classList.add('hidden');
        } else {
            reviewSection.classList.add('hidden');
            feedbackDisplay.classList.remove('hidden');
            feedbackContent.textContent = game.feedback || 'No feedback provided.';
        }
    }

    // Handle game approval or rejection
    async function handleApproval(isApproved) {
        const action = isApproved ? 'approve' : 'reject';
        const feedback = feedbackText.value.trim();
        
        console.log(`正在${isApproved ? '批准' : '拒绝'}游戏 ${gameId}, 反馈: ${feedback}`);
        
        try {
            const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiUrl = isLocalDev ? 
                `/api/admin/${action}-game/${gameId}` : 
                `https://relaxplayland.online/api/admin/${action}-game/${gameId}`;
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
                body: JSON.stringify({ feedback })
            });
            
            console.log(`API响应状态: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                // 如果是401或403，可能是认证问题
                if (response.status === 401 || response.status === 403) {
                    throw new Error('认证失败，请重新登录');
                }
                throw new Error(`Failed to ${action} game: ${response.status} ${response.statusText}`);
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
                console.log(`游戏${isApproved ? '批准' : '拒绝'}成功`);
                showSuccess(`Game ${isApproved ? 'approved' : 'rejected'} successfully`);
                
                // Reload game data after a short delay
                setTimeout(() => {
                    loadGameData();
                }, 1500);
            } else {
                throw new Error(result.message || `Failed to ${action} game`);
            }
        } catch (error) {
            console.error(`Error ${action} game:`, error);
            showError(`Error: ${error.message}`);
        }
    }

    // Show success notification
    function showSuccess(message) {
        console.log(message);
        try {
            if (typeof Toastify === 'function') {
                Toastify({
                    text: message,
                    backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
                    duration: 3000
                }).showToast();
            } else {
                alert(message);
            }
        } catch (err) {
            console.error('Toastify error:', err);
            alert(message);
        }
    }

    // Show error notification
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

    // Event listeners
    approveBtn?.addEventListener('click', () => handleApproval(true));
    rejectBtn?.addEventListener('click', () => handleApproval(false));
    
    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('api_key');
            window.location.href = 'login.html';
        });
    }

    // Load game data on page load
    checkApiConnection().then(isConnected => {
        if (isConnected) {
            loadGameData();
        }
    });
}); 