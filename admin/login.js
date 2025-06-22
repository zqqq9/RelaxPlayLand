document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    
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
    
    // 检查是否已登录
    function checkLoginStatus() {
        const apiKey = localStorage.getItem('api_key');
        if (apiKey) {
            // 已有API密钥，可以尝试验证
            validateApiKey(apiKey)
                .then(isValid => {
                    if (isValid) {
                        // 如果密钥有效，直接跳转到管理页面
                        window.location.href = 'game-management.html';
                    } else {
                        // 如果密钥无效，清除存储的密钥
                        localStorage.removeItem('api_key');
                    }
                })
                .catch(error => {
                    console.error('验证API密钥时出错:', error);
                    // 出错时也清除存储的密钥
                    localStorage.removeItem('api_key');
                });
        }
    }
    
    // 验证API密钥
    async function validateApiKey(apiKey) {
        try {
            const response = await fetch('https://relaxplayland.online/api/admin/validate', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'include'
            });
            
            return response.ok;
        } catch (error) {
            console.error('验证API密钥时出错:', error);
            return false;
        }
    }
    
    // 处理登录表单提交
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const apiKey = document.getElementById('api-key').value.trim();
            
            if (!apiKey) {
                showError('请输入API密钥');
                return;
            }
            
            try {
                const isValid = await validateApiKey(apiKey);
                
                if (isValid) {
                    // 存储API密钥到localStorage
                    localStorage.setItem('api_key', apiKey);
                    
                    showSuccess('登录成功！');
                    
                    // 延迟跳转到管理页面
                    setTimeout(() => {
                        window.location.href = 'game-management.html';
                    }, 1500);
                } else {
                    showError('API密钥无效，请重试');
                }
            } catch (error) {
                showError(`登录失败: ${error.message}`);
            }
        });
    }
    
    // 页面加载时检查登录状态
    checkLoginStatus();
}); 