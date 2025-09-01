
// 登录页面功能
class LoginPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkRedirect();
    }

    // 检查重定向
    checkRedirect() {
        if (auth.isLoggedIn()) {
            window.location.href = '../index.html';
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 登录表单
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // 注册表单
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }

        // 显示注册模态框按钮
        const showRegisterBtn = document.getElementById('showRegisterBtn');
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', () => {
                console.log('注册按钮被点击');
                showRegisterForm();
            });
        }

        // 关闭注册模态框按钮
        const closeRegisterBtn = document.getElementById('closeRegisterBtn');
        const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');
        
        if (closeRegisterBtn) {
            closeRegisterBtn.addEventListener('click', () => {
                console.log('关闭注册模态框');
                closeRegisterModal();
            });
        }
        
        if (cancelRegisterBtn) {
            cancelRegisterBtn.addEventListener('click', () => {
                console.log('取消注册');
                closeRegisterModal();
            });
        }

        // 快速登录按钮
        const adminQuickLogin = document.getElementById('adminQuickLogin');
        const userQuickLogin = document.getElementById('userQuickLogin');
        
        if (adminQuickLogin) {
            adminQuickLogin.addEventListener('click', (e) => {
                console.log('管理员快速登录被点击');
                const email = e.currentTarget.getAttribute('data-email');
                const password = e.currentTarget.getAttribute('data-password');
                quickLogin(email, password);
            });
        }
        
        if (userQuickLogin) {
            userQuickLogin.addEventListener('click', (e) => {
                console.log('普通用户快速登录被点击');
                const email = e.currentTarget.getAttribute('data-email');
                const password = e.currentTarget.getAttribute('data-password');
                quickLogin(email, password);
            });
        }

        // 回车键登录
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeModal = document.querySelector('.modal.active');
                if (!activeModal && loginForm) {
                    e.preventDefault();
                    loginForm.dispatchEvent(new Event('submit'));
                }
            }
        });
    }

    // 处理登录
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        await this.performLogin(email, password);
    }

    // 处理注册
    async handleRegister(e) {
        e.preventDefault();
        
        const formData = {
            username: document.getElementById('regUsername').value.trim(),
            email: document.getElementById('regEmail').value.trim(),
            password: document.getElementById('regPassword').value,
            firstName: document.getElementById('regFirstName').value.trim(),
            lastName: document.getElementById('regLastName').value.trim()
        };

        // 验证必填字段
        if (!formData.username || !formData.email || !formData.password) {
            this.showMessage('请填写必填字段', 'error');
            return;
        }

        // 验证邮箱格式
        if (!this.isValidEmail(formData.email)) {
            this.showMessage('请输入有效的邮箱地址', 'error');
            return;
        }

        // 验证密码长度
        if (formData.password.length < 6) {
            this.showMessage('密码长度至少6位', 'error');
            return;
        }

        this.setRegisterLoading(true);

        try {
            const response = await auth.register(formData);
            
            this.showMessage('注册成功！请登录', 'success');
            this.closeRegisterModal();
            
            // 自动填充登录表单
            document.getElementById('email').value = formData.email;
            document.getElementById('password').focus();
            
        } catch (error) {
            console.error('注册失败:', error);
            this.showMessage(error.message || '注册失败，请重试', 'error');
        } finally {
            this.setRegisterLoading(false);
        }
    }

    // 快速登录
    async quickLogin(email, password) {
        console.log('快速登录:', email);
        
        // 填充表单
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput && passwordInput) {
            emailInput.value = email;
            passwordInput.value = password;
            
            // 直接调用登录方法
            await this.performLogin(email, password);
        } else {
            console.error('找不到登录表单元素');
        }
    }

    // 执行登录的核心方法
    async performLogin(email, password) {
        if (!email || !password) {
            this.showMessage('请填写邮箱和密码', 'error');
            return;
        }

        this.setLoginLoading(true);

        try {
            const response = await auth.login(email, password);
            
            this.showMessage('登录成功！正在跳转...', 'success');
            
            // 延迟跳转，让用户看到成功消息
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);
            
        } catch (error) {
            console.error('登录失败:', error);
            this.showMessage(error.message || '登录失败，请检查邮箱和密码', 'error');
        } finally {
            this.setLoginLoading(false);
        }
    }

    // 设置登录按钮加载状态
    setLoginLoading(loading) {
        const loginBtn = document.getElementById('loginBtn');
        const loginText = document.getElementById('loginText');
        const loginSpinner = document.getElementById('loginSpinner');

        if (loginBtn) {
            loginBtn.disabled = loading;
        }

        if (loginText) {
            loginText.style.display = loading ? 'none' : 'inline';
        }

        if (loginSpinner) {
            loginSpinner.style.display = loading ? 'inline-block' : 'none';
        }
    }

    // 设置注册按钮加载状态
    setRegisterLoading(loading) {
        const registerBtn = document.getElementById('registerBtn');
        const registerText = document.getElementById('registerText');
        const registerSpinner = document.getElementById('registerSpinner');

        if (registerBtn) {
            registerBtn.disabled = loading;
        }

        if (registerText) {
            registerText.style.display = loading ? 'none' : 'inline';
        }

        if (registerSpinner) {
            registerSpinner.style.display = loading ? 'inline-block' : 'none';
        }
    }

    // 显示消息
    showMessage(text, type = 'info') {
        const message = document.getElementById('message');
        const messageIcon = document.getElementById('messageIcon');
        const messageText = document.getElementById('messageText');

        if (!message || !messageIcon || !messageText) return;

        // 设置图标
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };

        messageIcon.className = icons[type] || icons.info;
        messageText.textContent = text;

        // 设置样式
        message.className = `message ${type}`;
        message.style.display = 'block';
        
        // 显示动画
        setTimeout(() => {
            message.classList.add('show');
        }, 10);

        // 自动隐藏
        setTimeout(() => {
            this.hideMessage();
        }, 4000);
    }

    // 隐藏消息
    hideMessage() {
        const message = document.getElementById('message');
        if (message) {
            message.classList.remove('show');
            setTimeout(() => {
                message.style.display = 'none';
            }, 300);
        }
    }

    // 验证邮箱格式
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// 模态框管理
function showRegisterForm() {
    console.log('showRegisterForm被调用');
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.add('active');
        const usernameInput = document.getElementById('regUsername');
        if (usernameInput) {
            usernameInput.focus();
        }
    } else {
        console.error('找不到注册模态框');
    }
}

function closeRegisterModal() {
    console.log('closeRegisterModal被调用');
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.remove('active');
        // 清空表单
        const form = document.getElementById('registerForm');
        if (form) {
            form.reset();
        }
    }
}

// 确保函数在全局作用域
window.showRegisterForm = showRegisterForm;
window.closeRegisterModal = closeRegisterModal;

// 快速登录函数
function quickLogin(email, password) {
    console.log('全局quickLogin被调用:', email);
    
    // 如果loginPage实例存在，使用实例方法
    if (window.loginPage) {
        window.loginPage.quickLogin(email, password);
    } else {
        // 如果实例不存在，直接执行快速登录逻辑
        console.log('loginPage实例不存在，直接执行快速登录');
        
        // 填充表单
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput && passwordInput) {
            emailInput.value = email;
            passwordInput.value = password;
            
            // 触发登录表单提交
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.dispatchEvent(new Event('submit'));
            } else {
                console.error('找不到登录表单');
            }
        } else {
            console.error('找不到登录表单元素');
        }
    }
}

// 确保函数在全局作用域
window.quickLogin = quickLogin;

// 点击模态框外部关闭
document.addEventListener('click', (e) => {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// ESC键关闭模态框
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModals = document.querySelectorAll('.modal.active');
        activeModals.forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('登录页面DOM加载完成');
    
    try {
        window.loginPage = new LoginPage();
        console.log('LoginPage实例创建成功');
    } catch (error) {
        console.error('创建LoginPage实例失败:', error);
    }
    
    // 自动聚焦到邮箱输入框
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.focus();
    }
    
    // 确保全局函数可用
    console.log('showRegisterForm函数是否可用:', typeof window.showRegisterForm);
    console.log('quickLogin函数是否可用:', typeof window.quickLogin);
    
    // 测试DOM元素是否存在
    console.log('注册模态框是否存在:', !!document.getElementById('registerModal'));
    console.log('登录表单是否存在:', !!document.getElementById('loginForm'));
});
