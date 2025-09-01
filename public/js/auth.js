// 认证管理
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = null;
        this.init();
    }

    // 初始化认证状态
    init() {
        this.updateUI();
        this.checkAuthRequired();
    }

    // 检查是否需要认证
    checkAuthRequired() {
        const currentPath = window.location.pathname;
        const protectedPaths = ['/pages/users.html', '/pages/products.html', '/pages/orders.html'];
        
        const isProtectedPage = protectedPaths.some(path => currentPath.includes(path));
        
        if (isProtectedPage && !this.isLoggedIn()) {
            console.log('需要认证，重定向到登录页面');
            window.location.href = './login.html';
        }
    }

    // 检查是否已登录
    isLoggedIn() {
        return !!this.token;
    }

    // 登录
    async login(email, password) {
        try {
            const response = await api.loginUser({ email, password });
            
            if (response.success) {
                this.token = response.data.token;
                this.user = response.data.user;
                
                // 保存到localStorage
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                // 更新API实例的token
                api.setToken(this.token);
                
                this.updateUI();
                return response;
            } else {
                throw new Error(response.message || '登录失败');
            }
        } catch (error) {
            console.error('登录失败:', error);
            throw error;
        }
    }

    // 注册
    async register(userData) {
        try {
            const response = await api.registerUser(userData);
            return response;
        } catch (error) {
            console.error('注册失败:', error);
            throw error;
        }
    }

    // 登出
    async logout() {
        try {
            // 调用后端登出API
            if (this.token) {
                await api.logoutUser();
            }
        } catch (error) {
            console.error('登出API调用失败:', error);
        } finally {
            // 清除本地存储
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // 清除API实例的token
            api.setToken(null);
            
            // 重定向到登录页
            window.location.href = './pages/login.html';
        }
    }

    // 获取用户信息
    getUser() {
        if (!this.user && localStorage.getItem('user')) {
            this.user = JSON.parse(localStorage.getItem('user'));
        }
        return this.user;
    }

    // 更新UI
    updateUI() {
        const authLink = document.getElementById('authLink');
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');

        if (this.isLoggedIn()) {
            const user = this.getUser();
            
            if (authLink) {
                authLink.style.display = 'none';
            }
            
            if (userInfo) {
                userInfo.style.display = 'flex';
            }
            
            if (userName && user) {
                userName.textContent = user.username || user.email;
            }
        } else {
            if (authLink) {
                authLink.style.display = 'flex';
                authLink.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登录';
                authLink.href = './pages/login.html';
            }
            
            if (userInfo) {
                userInfo.style.display = 'none';
            }
        }
    }

    // 检查权限
    hasPermission(permission) {
        const user = this.getUser();
        if (!user) return false;
        
        // 这里可以根据实际需求实现权限检查逻辑
        // 例如检查用户角色、权限列表等
        return true;
    }
}

// 创建全局认证管理器实例
const auth = new AuthManager();

// 全局登出函数
function logout() {
    if (confirm('确定要登出吗？')) {
        auth.logout();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 如果在登录页面且已登录，重定向到首页
    if (window.location.pathname.includes('login.html') && auth.isLoggedIn()) {
        window.location.href = '../index.html';
    }
});

// 监听存储变化（多标签页同步）
window.addEventListener('storage', (e) => {
    if (e.key === 'token') {
        auth.token = e.newValue;
        auth.updateUI();
        auth.checkAuthRequired();
    }
    
    if (e.key === 'user') {
        auth.user = e.newValue ? JSON.parse(e.newValue) : null;
        auth.updateUI();
    }
});
