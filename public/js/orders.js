// 订单管理页面
class OrdersPage {
    constructor() {
        this.orders = [];
        this.users = [];
        this.products = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 1;
        this.filters = {
            search: '',
            status: ''
        };
        this.selectedOrderId = null;
        this.init();
    }

    async init() {
        await this.loadInitialData();
        this.setupEventListeners();
        await this.loadOrders();
    }

    // 加载初始数据
    async loadInitialData() {
        try {
            // 并行加载用户和产品数据
            const [usersResponse, productsResponse] = await Promise.all([
                api.getUsers(),
                api.getProducts()
            ]);

            if (usersResponse.success) {
                this.users = usersResponse.data.users || [];
                this.populateUserSelect();
            }

            if (productsResponse.success) {
                this.products = productsResponse.data.products || [];
                this.populateProductSelect();
            }

            await this.loadStats();
        } catch (error) {
            console.error('加载初始数据失败:', error);
            utils.showError('加载数据失败');
        }
    }

    // 加载统计数据
    async loadStats() {
        try {
            const response = await api.getOrderStats();
            if (response.success) {
                this.updateStatsUI(response.data);
            }
        } catch (error) {
            console.error('加载订单统计失败:', error);
        }
    }

    // 更新统计UI
    updateStatsUI(stats) {
        const elements = {
            totalOrdersCount: stats.totalOrders || 0,
            pendingOrdersCount: stats.pendingOrders || 0,
            shippedOrdersCount: stats.shippedOrders || 0,
            totalRevenue: utils.formatCurrency(stats.totalRevenue || 0)
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // 设置事件监听器
    setupEventListeners() {
        // 搜索
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', utils.debounce((e) => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.loadOrders();
            }, 300));
        }

        // 状态筛选
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.currentPage = 1;
                this.loadOrders();
            });
        }

        // 订单表单
        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            orderForm.addEventListener('submit', this.handleCreateOrder.bind(this));
        }

        // 状态更新表单
        const statusForm = document.getElementById('statusForm');
        if (statusForm) {
            statusForm.addEventListener('submit', this.handleUpdateStatus.bind(this));
        }
    }

    // 加载订单列表
    async loadOrders() {
        utils.showLoading(document.getElementById('loadingOrders'));
        
        try {
            const params = {
                page: this.currentPage,
                limit: this.pageSize,
                ...this.filters
            };

            const response = await api.getOrders(params);
            
            if (response.success) {
                this.orders = response.data.orders || [];
                this.totalPages = response.data.pagination?.pages || 1;
                this.renderOrdersTable();
                this.renderPagination();
            }
        } catch (error) {
            console.error('加载订单失败:', error);
            utils.showError('加载订单失败');
        } finally {
            utils.hideLoading(document.getElementById('loadingOrders'));
            document.getElementById('ordersTable').style.display = 'table';
        }
    }

    // 渲染订单表格
    renderOrdersTable() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        if (this.orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center p-4">
                        <i class="fas fa-inbox text-4xl text-gray-400 mb-2"></i>
                        <p class="text-gray-600">暂无订单数据</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${this.getUserName(order.userId)}</td>
                <td>${this.getProductName(order.productId)}</td>
                <td>${order.quantity}</td>
                <td>${utils.formatCurrency(order.unitPrice)}</td>
                <td>${utils.formatCurrency(order.totalPrice)}</td>
                <td>${utils.getStatusBadge(order.status)}</td>
                <td>${utils.formatDate(order.orderDate)}</td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="btn-sm btn-secondary" onclick="window.ordersPage.showOrderDetail(${order.id})" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-sm btn-primary" onclick="window.ordersPage.showUpdateStatus(${order.id})" title="更新状态">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-sm btn-error" onclick="window.ordersPage.showDeleteConfirm(${order.id}, '${order.id}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // 获取用户名
    getUserName(userId) {
        const user = this.users.find(u => u.id === userId);
        return user ? user.username : `用户${userId}`;
    }

    // 获取产品名
    getProductName(productId) {
        const product = this.products.find(p => p._id === productId);
        return product ? utils.truncateText(product.name, 20) : `产品${productId}`;
    }

    // 填充用户选择框
    populateUserSelect() {
        const select = document.getElementById('userId');
        if (!select) return;

        select.innerHTML = '<option value="">选择用户</option>' +
            this.users.map(user => `
                <option value="${user.id}">${user.username} (${user.email})</option>
            `).join('');
    }

    // 填充产品选择框
    populateProductSelect() {
        const select = document.getElementById('productId');
        if (!select) return;

        select.innerHTML = '<option value="">选择产品</option>' +
            this.products.map(product => `
                <option value="${product._id}">${product.name} - ${utils.formatCurrency(product.price)}</option>
            `).join('');
    }

    // 渲染分页
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        pagination.innerHTML = utils.generatePagination(
            this.currentPage,
            this.totalPages,
            'window.ordersPage.changePage'
        );
    }

    // 换页
    changePage(page) {
        this.currentPage = page;
        this.loadOrders();
    }

    // 显示创建订单模态框
    showAddOrderModal() {
        const modal = document.getElementById('orderModal');
        const form = document.getElementById('orderForm');
        
        if (modal && form) {
            form.reset();
            document.getElementById('modalTitle').textContent = '创建订单';
            document.getElementById('submitText').textContent = '创建订单';
            modal.classList.add('active');
            document.getElementById('userId').focus();
        }
    }

    // 关闭订单模态框
    closeOrderModal() {
        const modal = document.getElementById('orderModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // 处理创建订单
    async handleCreateOrder(e) {
        e.preventDefault();
        
        const formData = {
            userId: parseInt(document.getElementById('userId').value),
            productId: document.getElementById('productId').value,
            quantity: parseInt(document.getElementById('quantity').value),
            shippingAddress: document.getElementById('shippingAddress').value.trim(),
            notes: document.getElementById('notes').value.trim() || null
        };

        // 验证
        if (!formData.userId || !formData.productId || !formData.quantity || !formData.shippingAddress) {
            utils.showError('请填写所有必填字段');
            return;
        }

        this.setSubmitLoading(true);

        try {
            const response = await api.createOrder(formData);
            
            if (response.success) {
                utils.showSuccess('订单创建成功');
                this.closeOrderModal();
                await this.loadOrders();
                await this.loadStats();
            }
        } catch (error) {
            console.error('创建订单失败:', error);
            utils.showError(error.message || '创建订单失败');
        } finally {
            this.setSubmitLoading(false);
        }
    }

    // 显示订单详情
    async showOrderDetail(orderId) {
        try {
            const response = await api.getOrderById(orderId);
            
            if (response.success) {
                const order = response.data;
                this.renderOrderDetail(order);
                
                const modal = document.getElementById('orderDetailModal');
                if (modal) {
                    modal.classList.add('active');
                }
            }
        } catch (error) {
            console.error('获取订单详情失败:', error);
            utils.showError('获取订单详情失败');
        }
    }

    // 渲染订单详情
    renderOrderDetail(order) {
        const content = document.getElementById('orderDetailContent');
        if (!content) return;

        const user = this.users.find(u => u.id === order.userId);
        const product = this.products.find(p => p._id === order.productId);

        content.innerHTML = `
            <div class="order-detail">
                <div class="detail-section">
                    <h4><i class="fas fa-info-circle"></i> 基本信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>订单编号:</label>
                            <span>#${order.id}</span>
                        </div>
                        <div class="detail-item">
                            <label>订单状态:</label>
                            <span>${utils.getStatusBadge(order.status)}</span>
                        </div>
                        <div class="detail-item">
                            <label>下单时间:</label>
                            <span>${utils.formatDate(order.orderDate)}</span>
                        </div>
                        <div class="detail-item">
                            <label>更新时间:</label>
                            <span>${utils.formatDate(order.updatedAt)}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-user"></i> 用户信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>用户名:</label>
                            <span>${user ? user.username : '未知用户'}</span>
                        </div>
                        <div class="detail-item">
                            <label>邮箱:</label>
                            <span>${user ? user.email : '-'}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-box"></i> 产品信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>产品名称:</label>
                            <span>${product ? product.name : '未知产品'}</span>
                        </div>
                        <div class="detail-item">
                            <label>数量:</label>
                            <span>${order.quantity}</span>
                        </div>
                        <div class="detail-item">
                            <label>单价:</label>
                            <span>${utils.formatCurrency(order.unitPrice)}</span>
                        </div>
                        <div class="detail-item">
                            <label>总价:</label>
                            <span>${utils.formatCurrency(order.totalPrice)}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-truck"></i> 配送信息</h4>
                    <div class="detail-item">
                        <label>配送地址:</label>
                        <span>${order.shippingAddress || '-'}</span>
                    </div>
                    ${order.notes ? `
                        <div class="detail-item">
                            <label>备注:</label>
                            <span>${order.notes}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // 关闭订单详情模态框
    closeOrderDetailModal() {
        const modal = document.getElementById('orderDetailModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // 显示更新状态模态框
    showUpdateStatus(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        this.selectedOrderId = orderId;
        document.getElementById('statusOrderId').value = orderId;
        document.getElementById('newStatus').value = order.status;
        document.getElementById('statusNotes').value = '';

        const modal = document.getElementById('statusModal');
        if (modal) {
            modal.classList.add('active');
            document.getElementById('newStatus').focus();
        }
    }

    // 关闭状态更新模态框
    closeStatusModal() {
        const modal = document.getElementById('statusModal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.selectedOrderId = null;
    }

    // 处理状态更新
    async handleUpdateStatus(e) {
        e.preventDefault();
        
        const orderId = this.selectedOrderId;
        const newStatus = document.getElementById('newStatus').value;
        const notes = document.getElementById('statusNotes').value.trim() || null;

        if (!orderId || !newStatus) {
            utils.showError('请选择状态');
            return;
        }

        try {
            const response = await api.updateOrderStatus(orderId, {
                status: newStatus,
                notes: notes
            });
            
            if (response.success) {
                utils.showSuccess('状态更新成功');
                this.closeStatusModal();
                await this.loadOrders();
                await this.loadStats();
            }
        } catch (error) {
            console.error('更新状态失败:', error);
            utils.showError(error.message || '更新状态失败');
        }
    }

    // 显示删除确认
    showDeleteConfirm(orderId, orderDisplayId) {
        this.selectedOrderId = orderId;
        document.getElementById('deleteOrderName').textContent = `#${orderDisplayId}`;
        
        const modal = document.getElementById('deleteModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    // 关闭删除确认
    closeDeleteModal() {
        const modal = document.getElementById('deleteModal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.selectedOrderId = null;
    }

    // 确认删除
    async confirmDelete() {
        if (!this.selectedOrderId) return;

        try {
            const response = await api.deleteOrder(this.selectedOrderId);
            
            if (response.success) {
                utils.showSuccess('订单删除成功');
                this.closeDeleteModal();
                await this.loadOrders();
                await this.loadStats();
            }
        } catch (error) {
            console.error('删除订单失败:', error);
            utils.showError(error.message || '删除订单失败');
        }
    }

    // 设置提交按钮加载状态
    setSubmitLoading(loading) {
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const submitSpinner = document.getElementById('submitSpinner');

        if (submitBtn) submitBtn.disabled = loading;
        if (submitText) submitText.style.display = loading ? 'none' : 'inline';
        if (submitSpinner) submitSpinner.style.display = loading ? 'inline-block' : 'none';
    }

    // 刷新数据
    async refreshOrders() {
        await this.loadOrders();
        await this.loadStats();
    }
}

// 全局函数
function showAddOrderModal() {
    if (window.ordersPage) {
        window.ordersPage.showAddOrderModal();
    }
}

function closeOrderModal() {
    if (window.ordersPage) {
        window.ordersPage.closeOrderModal();
    }
}

function closeOrderDetailModal() {
    if (window.ordersPage) {
        window.ordersPage.closeOrderDetailModal();
    }
}

function closeStatusModal() {
    if (window.ordersPage) {
        window.ordersPage.closeStatusModal();
    }
}

function closeDeleteModal() {
    if (window.ordersPage) {
        window.ordersPage.closeDeleteModal();
    }
}

function confirmDelete() {
    if (window.ordersPage) {
        window.ordersPage.confirmDelete();
    }
}

function refreshOrders() {
    if (window.ordersPage) {
        window.ordersPage.refreshOrders();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.ordersPage = new OrdersPage();
});

// 添加订单详情样式
const orderDetailCSS = `
.order-detail {
    max-height: 70vh;
    overflow-y: auto;
}

.detail-section {
    margin-bottom: var(--spacing-xl);
    border-bottom: 1px solid var(--gray-200);
    padding-bottom: var(--spacing-lg);
}

.detail-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.detail-section h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--gray-800);
    margin-bottom: var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.detail-item label {
    font-weight: 500;
    color: var(--gray-600);
    font-size: 0.875rem;
}

.detail-item span {
    color: var(--gray-800);
}
`;

// 添加样式
if (!document.getElementById('order-detail-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'order-detail-styles';
    styleElement.textContent = orderDetailCSS;
    document.head.appendChild(styleElement);
}
