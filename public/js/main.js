// 主页功能
class Dashboard {
    constructor() {
        this.stats = {
            users: 0,
            products: 0,
            orders: 0,
            revenue: 0
        };
        this.init();
    }

    async init() {
        await this.loadStats();
        this.setupEventListeners();
    }

    // 加载统计数据
    async loadStats() {
        try {
            // 并行加载所有统计数据
            const [userStats, productStats, orderStats] = await Promise.allSettled([
                this.loadUserStats(),
                this.loadProductStats(),
                this.loadOrderStats()
            ]);

            this.updateStatsUI();
        } catch (error) {
            console.error('加载统计数据失败:', error);
            this.showStatsError();
        }
    }

    // 加载用户统计
    async loadUserStats() {
        try {
            const response = await api.getUserStats();
            if (response.success) {
                this.stats.users = response.data.total || 0;
                return response.data;
            }
        } catch (error) {
            // 如果需要认证，尝试获取基础用户列表
            try {
                const response = await api.get('/users', { requireAuth: false });
                if (response.success && response.data.users) {
                    this.stats.users = response.data.users.length;
                }
            } catch (fallbackError) {
                console.error('获取用户统计失败:', fallbackError);
                this.stats.users = 0;
            }
        }
    }

    // 加载产品统计
    async loadProductStats() {
        try {
            const response = await api.getProductStats();
            if (response.success) {
                this.stats.products = response.data.total || 0;
                return response.data;
            }
        } catch (error) {
            try {
                const response = await api.get('/products', { requireAuth: false });
                if (response.success && response.data.products) {
                    this.stats.products = response.data.products.length;
                }
            } catch (fallbackError) {
                console.error('获取产品统计失败:', fallbackError);
                this.stats.products = 0;
            }
        }
    }

    // 加载订单统计
    async loadOrderStats() {
        try {
            // 订单需要认证，如果未登录则跳过
            if (!auth.isLoggedIn()) {
                this.stats.orders = 0;
                this.stats.revenue = 0;
                return;
            }

            const response = await api.getOrderStats();
            if (response.success) {
                this.stats.orders = response.data.totalOrders || 0;
                this.stats.revenue = response.data.totalRevenue || 0;
                return response.data;
            }
        } catch (error) {
            console.error('获取订单统计失败:', error);
            this.stats.orders = 0;
            this.stats.revenue = 0;
        }
    }

    // 更新统计UI
    updateStatsUI() {
        // 更新用户数
        const totalUsersElement = document.getElementById('totalUsers');
        if (totalUsersElement) {
            this.animateNumber(totalUsersElement, this.stats.users);
        }

        // 更新产品数
        const totalProductsElement = document.getElementById('totalProducts');
        if (totalProductsElement) {
            this.animateNumber(totalProductsElement, this.stats.products);
        }

        // 更新订单数
        const totalOrdersElement = document.getElementById('totalOrders');
        if (totalOrdersElement) {
            this.animateNumber(totalOrdersElement, this.stats.orders);
        }

        // 更新收入（如果有订单数据）
        const revenueElements = document.querySelectorAll('[data-revenue]');
        revenueElements.forEach(element => {
            element.textContent = utils.formatCurrency(this.stats.revenue);
        });
    }

    // 显示统计错误
    showStatsError() {
        const statsElements = ['totalUsers', 'totalProducts', 'totalOrders'];
        statsElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '?';
                element.title = '数据加载失败';
            }
        });
    }

    // 数字动画效果
    animateNumber(element, targetNumber, duration = 1000) {
        const startNumber = 0;
        const increment = targetNumber / (duration / 16); // 60fps
        let currentNumber = startNumber;

        const timer = setInterval(() => {
            currentNumber += increment;
            if (currentNumber >= targetNumber) {
                currentNumber = targetNumber;
                clearInterval(timer);
            }
            element.textContent = Math.floor(currentNumber);
        }, 16);
    }

    // 设置事件监听器
    setupEventListeners() {
        // 页面可见性变化时刷新数据
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadStats();
            }
        });

        // 定期刷新数据（每5分钟）
        setInterval(() => {
            this.loadStats();
        }, 5 * 60 * 1000);
    }

    // 刷新统计数据
    async refresh() {
        await this.loadStats();
    }
}

// 页面特效
class PageEffects {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollEffects();
        this.setupHoverEffects();
        this.setupLoadAnimations();
    }

    // 滚动特效
    setupScrollEffects() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // 观察所有需要动画的元素
        document.querySelectorAll('.feature-card, .tech-card, .stat-card').forEach(el => {
            observer.observe(el);
        });
    }

    // 悬停特效
    setupHoverEffects() {
        // 统计卡片悬停效果
        document.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        // 功能卡片悬停效果
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                const icon = card.querySelector('i');
                if (icon) {
                    icon.style.transform = 'scale(1.2) rotate(5deg)';
                }
            });

            card.addEventListener('mouseleave', () => {
                const icon = card.querySelector('i');
                if (icon) {
                    icon.style.transform = 'scale(1) rotate(0deg)';
                }
            });
        });
    }

    // 加载动画
    setupLoadAnimations() {
        // 为页面元素添加加载动画
        const elements = document.querySelectorAll('.hero-content, .features, .tech-stack');
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }
}

// 工具提示
class Tooltip {
    constructor() {
        this.tooltip = null;
        this.init();
    }

    init() {
        this.createTooltip();
        this.bindEvents();
    }

    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip';
        this.tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 0.875rem;
            z-index: 1000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
            white-space: nowrap;
        `;
        document.body.appendChild(this.tooltip);
    }

    bindEvents() {
        document.addEventListener('mouseover', (e) => {
            const element = e.target.closest('[title], [data-tooltip]');
            if (element) {
                const text = element.getAttribute('data-tooltip') || element.getAttribute('title');
                if (text) {
                    this.show(text, e);
                    // 移除title属性防止浏览器默认提示
                    if (element.hasAttribute('title')) {
                        element.setAttribute('data-original-title', element.getAttribute('title'));
                        element.removeAttribute('title');
                    }
                }
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.tooltip.style.opacity === '1') {
                this.updatePosition(e);
            }
        });

        document.addEventListener('mouseout', (e) => {
            const element = e.target.closest('[data-tooltip], [data-original-title]');
            if (element) {
                this.hide();
                // 恢复title属性
                if (element.hasAttribute('data-original-title')) {
                    element.setAttribute('title', element.getAttribute('data-original-title'));
                    element.removeAttribute('data-original-title');
                }
            }
        });
    }

    show(text, event) {
        this.tooltip.textContent = text;
        this.updatePosition(event);
        this.tooltip.style.opacity = '1';
    }

    hide() {
        this.tooltip.style.opacity = '0';
    }

    updatePosition(event) {
        const x = event.pageX + 10;
        const y = event.pageY - 30;
        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = y + 'px';
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 只在主页初始化仪表板
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        const dashboard = new Dashboard();
        const effects = new PageEffects();
        const tooltip = new Tooltip();

        // 将实例挂载到全局，方便调试
        window.dashboard = dashboard;
        window.effects = effects;
        window.tooltip = tooltip;
    }
});

// 全局刷新函数
function refreshDashboard() {
    if (window.dashboard) {
        window.dashboard.refresh();
    }
}

// 平滑滚动到指定元素
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 复制文本到剪贴板
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        utils.showSuccess('已复制到剪贴板');
    } catch (error) {
        console.error('复制失败:', error);
        utils.showError('复制失败');
    }
}
