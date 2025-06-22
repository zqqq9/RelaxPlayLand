document.addEventListener('DOMContentLoaded', () => {
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
    const API_URL = `https://relaxplayland.online/api/admin/games/${gameId}`;
    
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
            
            const response = await fetch(API_URL, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            console.log(`API响应状态: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load game data: ${response.status} ${response.statusText}`);
            }
            
            const responseText = await response.text();
            console.log(`API响应内容: ${responseText.substring(0, 200)}...`);
            
            let game;
            try {
                game = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON解析错误:', parseError);
                console.error('原始响应:', responseText);
                throw new Error('无法解析API响应为JSON格式');
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
            const apiUrl = `https://relaxplayland.online/api/admin/games/${gameId}/${action}`;
            console.log(`请求API: ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ feedback })
            });
            
            console.log(`API响应状态: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                throw new Error(`Failed to ${action} game: ${response.status} ${response.statusText}`);
            }
            
            const responseText = await response.text();
            console.log(`API响应内容: ${responseText}`);
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON解析错误:', parseError);
                console.error('原始响应:', responseText);
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

    // Load game data on page load
    checkApiConnection().then(isConnected => {
        if (isConnected) {
            loadGameData();
        }
    });
}); 