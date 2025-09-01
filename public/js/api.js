// API 工具类
class API {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('token');
    }

    // 设置认证令牌
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    // 获取请求头
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(options.requireAuth !== false),
            ...options
        };

        try {
            console.log('API请求:', url, config);
            const response = await fetch(url, config);
            
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('JSON解析失败:', parseError);
                throw new Error('服务器响应格式错误');
            }

            // 处理认证错误
            if (response.status === 401 && !endpoint.includes('/login')) {
                this.setToken(null);
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = '/pages/login.html';
                }
                throw new Error('认证失败，请重新登录');
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP错误: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    // GET 请求
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    // POST 请求
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT 请求
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // PATCH 请求
    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // DELETE 请求
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // 用户相关API
    async registerUser(userData) {
        return this.post('/users/register', userData);
    }

    async loginUser(credentials) {
        return this.post('/users/login', credentials);
    }

    async logoutUser() {
        return this.post('/users/logout');
    }

    async getUsers(params = {}) {
        return this.get('/users', params);
    }

    async getUserById(id) {
        return this.get(`/users/${id}`);
    }

    async createUser(userData) {
        return this.post('/users/register', userData);
    }

    async updateUser(id, userData) {
        return this.put(`/users/${id}`, userData);
    }

    async deleteUser(id) {
        return this.delete(`/users/${id}`);
    }

    async getUserStats() {
        return this.get('/users/stats');
    }

    // 产品相关API
    async getProducts(params = {}) {
        return this.get('/products', params);
    }

    async getProductById(id) {
        return this.get(`/products/${id}`);
    }

    async createProduct(productData) {
        return this.post('/products', productData);
    }

    async updateProduct(id, productData) {
        return this.put(`/products/${id}`, productData);
    }

    async deleteProduct(id) {
        return this.delete(`/products/${id}`);
    }

    async getProductStats() {
        return this.get('/products/stats');
    }

    async getCategories() {
        return this.get('/products/categories');
    }

    // 订单相关API
    async getOrders(params = {}) {
        return this.get('/orders', params);
    }

    async getOrderById(id) {
        return this.get(`/orders/${id}`);
    }

    async createOrder(orderData) {
        return this.post('/orders', orderData);
    }

    async updateOrderStatus(id, statusData) {
        return this.patch(`/orders/${id}/status`, statusData);
    }

    async deleteOrder(id) {
        return this.delete(`/orders/${id}`);
    }

    async getOrderStats() {
        return this.get('/orders/stats');
    }

    async getOrdersByUserId(userId, params = {}) {
        return this.get(`/orders/user/${userId}`, params);
    }

    async getOrdersByStatus(status, params = {}) {
        return this.get(`/orders/status/${status}`, params);
    }
}

// 创建全局API实例
const api = new API();

// 工具函数
const utils = {
    // 格式化日期
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // 格式化货币
    formatCurrency(amount) {
        if (amount === null || amount === undefined) return '-';
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY'
        }).format(amount);
    },

    // 格式化数字
    formatNumber(number) {
        if (number === null || number === undefined) return '-';
        return new Intl.NumberFormat('zh-CN').format(number);
    },

    // 获取状态徽章HTML
    getStatusBadge(status, type = 'default') {
        const statusConfig = {
            // 用户状态
            true: { class: 'badge-success', text: '活跃' },
            false: { class: 'badge-error', text: '禁用' },
            
            // 订单状态
            pending: { class: 'badge-warning', text: '待处理' },
            processing: { class: 'badge-info', text: '处理中' },
            shipped: { class: 'badge-info', text: '已发货' },
            delivered: { class: 'badge-success', text: '已送达' },
            cancelled: { class: 'badge-error', text: '已取消' },
            
            // 产品状态
            published: { class: 'badge-success', text: '已发布' },
            draft: { class: 'badge-secondary', text: '草稿' }
        };

        const config = statusConfig[status] || { class: 'badge-secondary', text: status };
        return `<span class="badge ${config.class}">${config.text}</span>`;
    },

    // 显示加载状态
    showLoading(element) {
        if (element) {
            element.style.display = 'flex';
        }
    },

    // 隐藏加载状态
    hideLoading(element) {
        if (element) {
            element.style.display = 'none';
        }
    },

    // 显示错误消息
    showError(message, container = document.body) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        container.insertBefore(errorDiv, container.firstChild);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
    },

    // 显示成功消息
    showSuccess(message, container = document.body) {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        container.insertBefore(successDiv, container.firstChild);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    },

    // 生成分页HTML
    generatePagination(current, total, onPageChange) {
        if (total <= 1) return '';

        let html = '<div class="pagination">';
        
        // 上一页
        if (current > 1) {
            html += `<button class="pagination-btn" onclick="${onPageChange}(${current - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>`;
        }

        // 页码
        const startPage = Math.max(1, current - 2);
        const endPage = Math.min(total, current + 2);

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === current ? 'active' : '';
            html += `<button class="pagination-btn ${activeClass}" onclick="${onPageChange}(${i})">${i}</button>`;
        }

        // 下一页
        if (current < total) {
            html += `<button class="pagination-btn" onclick="${onPageChange}(${current + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>`;
        }

        html += '</div>';
        return html;
    },

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 截断文本
    truncateText(text, maxLength = 50) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};

// CSS样式补充
const additionalCSS = `
.alert {
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    animation: slideIn 0.3s ease-out;
}

.alert-success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
}

.alert-error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
}

.pagination {
    display: flex;
    justify-content: center;
    gap: var(--spacing-xs);
    margin: var(--spacing-xl) 0;
}

.pagination-btn {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--gray-300);
    background: white;
    color: var(--gray-700);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
}

.pagination-btn:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
}

.pagination-btn.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.page-header {
    margin-bottom: var(--spacing-2xl);
}

.page-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--gray-800);
    margin-bottom: var(--spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
}

.page-header p {
    color: var(--gray-600);
    font-size: 1.125rem;
}

.filters-section {
    background: white;
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    margin-bottom: var(--spacing-xl);
}

.search-container {
    position: relative;
}

.filter-controls {
    display: flex;
    gap: var(--spacing-md);
    align-items: center;
}

.table-header {
    background: white;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--gray-200);
}

.table-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--gray-800);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}
`;

// 添加样式到文档
if (!document.getElementById('additional-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'additional-styles';
    styleElement.textContent = additionalCSS;
    document.head.appendChild(styleElement);
}
