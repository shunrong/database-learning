// 用户管理页面
class UsersPage {
    constructor() {
        this.users = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 1;
        this.filters = {
            search: '',
            status: ''
        };
        this.selectedUserId = null;
        this.init();
    }

    async init() {
        console.log('初始化用户管理页面');
        this.setupEventListeners();
        await this.loadUsers();
        await this.loadStats();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 搜索
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const debouncedSearch = this.debounce((e) => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.loadUsers();
            }, 300);
            searchInput.addEventListener('input', debouncedSearch);
        }

        // 状态筛选
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.currentPage = 1;
                this.loadUsers();
            });
        }

        // 用户表单
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', this.handleUserSubmit.bind(this));
        }
    }

    // 加载统计数据
    async loadStats() {
        try {
            console.log('加载用户统计数据');
            const response = await api.getUserStats();
            if (response.success) {
                this.updateStatsUI(response.data);
            }
        } catch (error) {
            console.error('加载用户统计失败:', error);
            // 使用当前用户数据作为备选
            this.updateStatsUI({
                total: this.users.length,
                active: this.users.filter(u => u.isActive).length,
                newThisMonth: 0,
                recentActive: 0
            });
        }
    }

    // 更新统计UI
    updateStatsUI(stats) {
        const elements = {
            totalUsersCount: stats.total || this.users.length,
            activeUsersCount: stats.active || this.users.filter(u => u.isActive).length,
            newUsersCount: stats.newThisMonth || 0,
            recentUsersCount: stats.recentActive || 0
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // 加载用户列表
    async loadUsers() {
        console.log('开始加载用户列表');
        utils.showLoading(document.getElementById('loadingUsers'));
        
        try {
            const params = {
                page: this.currentPage,
                limit: this.pageSize,
                ...this.filters
            };

            console.log('请求参数:', params);
            const response = await api.getUsers(params);
            console.log('用户API响应:', response);
            
            if (response.success) {
                this.users = response.data.users || [];
                this.totalPages = response.data.pagination?.pages || 1;
                console.log('加载到用户数量:', this.users.length);
                this.renderUsersTable();
                this.renderPagination();
            } else {
                console.error('用户API返回失败:', response.message);
                utils.showError('加载用户失败: ' + response.message);
            }
        } catch (error) {
            console.error('加载用户失败:', error);
            utils.showError('加载用户失败: ' + error.message);
        } finally {
            utils.hideLoading(document.getElementById('loadingUsers'));
            document.getElementById('usersTable').style.display = 'table';
        }
    }

    // 渲染用户表格
    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) {
            console.error('找不到用户表格体元素');
            return;
        }

        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center p-4">
                        <i class="fas fa-users text-4xl text-gray-400 mb-2"></i>
                        <p class="text-gray-600">暂无用户数据</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>
                    <div class="user-avatar">
                        ${user.avatar ? 
                            `<img src="${user.avatar}" alt="${user.username}" class="avatar">` :
                            `<div class="avatar-placeholder">
                                <i class="fas fa-user"></i>
                            </div>`
                        }
                    </div>
                </td>
                <td>
                    <div class="user-info">
                        <div class="user-name">${user.username}</div>
                        <div class="user-fullname">${user.firstName || ''} ${user.lastName || ''}</div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${utils.getStatusBadge(user.isActive)}</td>
                <td>${utils.formatDate(user.createdAt)}</td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="btn-sm btn-secondary" onclick="window.usersPage.showUserDetail(${user.id})" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-sm btn-primary" onclick="window.usersPage.showEditUser(${user.id})" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-sm btn-error" onclick="window.usersPage.showDeleteConfirm(${user.id}, '${user.username}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // 渲染分页
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        pagination.innerHTML = utils.generatePagination(
            this.currentPage,
            this.totalPages,
            'window.usersPage.changePage'
        );
    }

    // 换页
    changePage(page) {
        this.currentPage = page;
        this.loadUsers();
    }

    // 显示添加用户模态框
    showAddUserModal() {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        
        if (modal && form) {
            form.reset();
            document.getElementById('userId').value = '';
            document.getElementById('modalTitle').textContent = '添加用户';
            document.getElementById('submitText').textContent = '添加用户';
            document.getElementById('passwordGroup').style.display = 'block';
            document.getElementById('password').required = true;
            modal.classList.add('active');
            document.getElementById('username').focus();
        }
    }

    // 关闭用户模态框
    closeUserModal() {
        const modal = document.getElementById('userModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // 显示编辑用户
    showEditUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const modal = document.getElementById('userModal');
        if (modal) {
            document.getElementById('userId').value = user.id;
            document.getElementById('username').value = user.username;
            document.getElementById('email').value = user.email;
            document.getElementById('firstName').value = user.firstName || '';
            document.getElementById('lastName').value = user.lastName || '';
            document.getElementById('bio').value = user.bio || '';
            document.getElementById('isActive').value = user.isActive.toString();
            
            document.getElementById('modalTitle').textContent = '编辑用户';
            document.getElementById('submitText').textContent = '更新用户';
            document.getElementById('passwordGroup').style.display = 'none';
            document.getElementById('password').required = false;
            
            modal.classList.add('active');
            document.getElementById('username').focus();
        }
    }

    // 处理用户表单提交
    async handleUserSubmit(e) {
        e.preventDefault();
        
        const formData = {
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            firstName: document.getElementById('firstName').value.trim() || null,
            lastName: document.getElementById('lastName').value.trim() || null,
            bio: document.getElementById('bio').value.trim() || null,
            isActive: document.getElementById('isActive').value === 'true'
        };

        const userId = document.getElementById('userId').value;
        const password = document.getElementById('password').value;

        // 验证必填字段
        if (!formData.username || !formData.email) {
            utils.showError('请填写用户名和邮箱');
            return;
        }

        // 如果是新用户，验证密码
        if (!userId && !password) {
            utils.showError('请填写密码');
            return;
        }

        if (password) {
            formData.password = password;
        }

        this.setSubmitLoading(true);

        try {
            let response;
            if (userId) {
                // 更新用户
                response = await api.updateUser(userId, formData);
            } else {
                // 创建用户
                response = await api.createUser(formData);
            }
            
            if (response.success) {
                utils.showSuccess(userId ? '用户更新成功' : '用户创建成功');
                this.closeUserModal();
                await this.loadUsers();
                await this.loadStats();
            }
        } catch (error) {
            console.error('用户操作失败:', error);
            utils.showError(error.message || '操作失败');
        } finally {
            this.setSubmitLoading(false);
        }
    }

    // 显示删除确认
    showDeleteConfirm(userId, username) {
        this.selectedUserId = userId;
        document.getElementById('deleteUserName').textContent = username;
        
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
        this.selectedUserId = null;
    }

    // 确认删除
    async confirmDelete() {
        if (!this.selectedUserId) return;

        try {
            const response = await api.deleteUser(this.selectedUserId);
            
            if (response.success) {
                utils.showSuccess('用户删除成功');
                this.closeDeleteModal();
                await this.loadUsers();
                await this.loadStats();
            }
        } catch (error) {
            console.error('删除用户失败:', error);
            utils.showError(error.message || '删除用户失败');
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
    }

    // 刷新数据
    async refreshUsers() {
        await this.loadUsers();
        await this.loadStats();
    }
}

// 全局函数
function showAddUserModal() {
    if (window.usersPage) {
        window.usersPage.showAddUserModal();
    }
}

function closeUserModal() {
    if (window.usersPage) {
        window.usersPage.closeUserModal();
    }
}

function closeDeleteModal() {
    if (window.usersPage) {
        window.usersPage.closeDeleteModal();
    }
}

function confirmDelete() {
    if (window.usersPage) {
        window.usersPage.confirmDelete();
    }
}

function refreshUsers() {
    if (window.usersPage) {
        window.usersPage.refreshUsers();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('用户页面DOM加载完成');
    window.usersPage = new UsersPage();
});

// 添加用户相关样式
const userCSS = `
.user-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}

.avatar-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--gray-200);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gray-500);
}

.user-info {
    min-width: 150px;
}

.user-name {
    font-weight: 600;
    color: var(--gray-800);
}

.user-fullname {
    font-size: 0.875rem;
    color: var(--gray-600);
}

.btn-sm {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.875rem;
    border-radius: var(--radius-sm);
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-error {
    background: var(--error-color);
    color: white;
}

.btn-error:hover {
    background: #dc2626;
}
`;

// 添加样式
if (!document.getElementById('user-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'user-styles';
    styleElement.textContent = userCSS;
    document.head.appendChild(styleElement);
}
