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
    const API_URL = `https://relaxplayland.online/api/games/${gameId}`;
    
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
            const response = await fetch(API_URL, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to load game data');
            }
            
            const game = await response.json();
            renderGameData(game);
        } catch (error) {
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
        
        try {
            const response = await fetch(`https://relaxplayland.online/api/admin/${action}-game/${gameId}`, {
                method: 'POST',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ feedback })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to ${action} game`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                showSuccess(`Game ${isApproved ? 'approved' : 'rejected'} successfully`);
                
                // Reload game data after a short delay
                setTimeout(() => {
                    loadGameData();
                }, 1500);
            } else {
                throw new Error(result.message || `Failed to ${action} game`);
            }
        } catch (error) {
            showError(`Error: ${error.message}`);
        }
    }

    // Show success notification
    function showSuccess(message) {
        Toastify({
            text: message,
            backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
            duration: 3000
        }).showToast();
    }

    // Show error notification
    function showError(message) {
        Toastify({
            text: message,
            style: { background: "var(--toastify-color-error)" },
            duration: 4000
        }).showToast();
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