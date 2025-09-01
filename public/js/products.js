// 产品管理页面
class ProductsPage {
    constructor() {
        this.products = [];
        this.categories = [];
        this.currentPage = 1;
        this.pageSize = 12;
        this.totalPages = 1;
        this.filters = {
            search: '',
            category: '',
            status: ''
        };
        this.selectedProductId = null;
        this.init();
    }

    async init() {
        console.log('初始化产品管理页面');
        this.setupEventListeners();
        await this.loadCategories();
        await this.loadProducts();
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
                this.loadProducts();
            }, 300);
            searchInput.addEventListener('input', debouncedSearch);
        }

        // 分类筛选
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.currentPage = 1;
                this.loadProducts();
            });
        }

        // 状态筛选
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.currentPage = 1;
                this.loadProducts();
            });
        }

        // 产品表单
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', this.handleProductSubmit.bind(this));
        }
    }

    // 加载分类
    async loadCategories() {
        try {
            console.log('加载产品分类');
            const response = await api.getCategories();
            if (response.success) {
                this.categories = response.data || [];
                this.populateCategorySelects();
            }
        } catch (error) {
            console.error('加载分类失败:', error);
            this.categories = [];
        }
    }

    // 填充分类选择框
    populateCategorySelects() {
        const selects = ['categoryFilter', 'category'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const isFilter = selectId === 'categoryFilter';
                select.innerHTML = (isFilter ? '<option value="">所有分类</option>' : '<option value="">选择分类</option>') +
                    this.categories.map(cat => `
                        <option value="${cat._id}">${cat.name}</option>
                    `).join('');
            }
        });
    }

    // 加载统计数据
    async loadStats() {
        try {
            console.log('加载产品统计数据');
            const response = await api.getProductStats();
            if (response.success) {
                this.updateStatsUI(response.data);
            }
        } catch (error) {
            console.error('加载产品统计失败:', error);
            // 使用当前产品数据作为备选
            this.updateStatsUI({
                total: this.products.length,
                published: this.products.filter(p => p.isPublished).length,
                categories: this.categories.length,
                totalStock: this.products.reduce((sum, p) => sum + (p.stock || 0), 0)
            });
        }
    }

    // 更新统计UI
    updateStatsUI(stats) {
        const elements = {
            totalProductsCount: stats.total || this.products.length,
            publishedProductsCount: stats.published || this.products.filter(p => p.isPublished).length,
            categoriesCount: stats.categories || this.categories.length,
            totalStock: stats.totalStock || this.products.reduce((sum, p) => sum + (p.stock || 0), 0)
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // 加载产品列表
    async loadProducts() {
        console.log('开始加载产品列表');
        utils.showLoading(document.getElementById('loadingProducts'));
        
        try {
            const params = {
                page: this.currentPage,
                limit: this.pageSize,
                ...this.filters
            };

            console.log('请求参数:', params);
            const response = await api.getProducts(params);
            console.log('产品API响应:', response);
            
            if (response.success) {
                this.products = response.data.products || [];
                this.totalPages = response.data.pagination?.pages || 1;
                console.log('加载到产品数量:', this.products.length);
                this.renderProductsGrid();
                this.renderPagination();
            } else {
                console.error('产品API返回失败:', response.message);
                utils.showError('加载产品失败: ' + response.message);
            }
        } catch (error) {
            console.error('加载产品失败:', error);
            utils.showError('加载产品失败: ' + error.message);
        } finally {
            utils.hideLoading(document.getElementById('loadingProducts'));
            document.getElementById('productsGrid').style.display = 'grid';
        }
    }

    // 渲染产品网格
    renderProductsGrid() {
        const grid = document.getElementById('productsGrid');
        if (!grid) {
            console.error('找不到产品网格元素');
            return;
        }

        if (this.products.length === 0) {
            grid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <h3>暂无产品数据</h3>
                    <p>点击"添加产品"按钮创建第一个产品</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    ${product.imageUrl ? 
                        `<img src="${product.imageUrl}" alt="${product.name}" onerror="this.style.display='none'">` :
                        `<i class="fas fa-image"></i>`
                    }
                </div>
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${utils.truncateText(product.description, 100)}</p>
                    <div class="product-price">${utils.formatCurrency(product.price)}</div>
                    <div class="product-meta">
                        <span><i class="fas fa-boxes"></i> 库存: ${product.stock}</span>
                        <span>${utils.getStatusBadge(product.isPublished ? 'published' : 'draft')}</span>
                    </div>
                    ${product.tags && product.tags.length > 0 ? `
                        <div class="product-tags">
                            ${product.tags.slice(0, 3).map(tag => `
                                <span class="product-tag">${tag}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                    <div class="product-actions">
                        <button class="btn-sm btn-secondary" onclick="window.productsPage.showProductDetail('${product._id}')" title="查看详情">
                            <i class="fas fa-eye"></i> 详情
                        </button>
                        <button class="btn-sm btn-primary" onclick="window.productsPage.showEditProduct('${product._id}')" title="编辑">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn-sm btn-error" onclick="window.productsPage.showDeleteConfirm('${product._id}', '${product.name}')" title="删除">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 渲染分页
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        pagination.innerHTML = utils.generatePagination(
            this.currentPage,
            this.totalPages,
            'window.productsPage.changePage'
        );
    }

    // 换页
    changePage(page) {
        this.currentPage = page;
        this.loadProducts();
    }

    // 显示添加产品模态框
    showAddProductModal() {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        
        if (modal && form) {
            form.reset();
            document.getElementById('productId').value = '';
            document.getElementById('modalTitle').textContent = '添加产品';
            document.getElementById('submitText').textContent = '添加产品';
            modal.classList.add('active');
            document.getElementById('name').focus();
        }
    }

    // 关闭产品模态框
    closeProductModal() {
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // 显示编辑产品
    async showEditProduct(productId) {
        try {
            const response = await api.getProductById(productId);
            if (response.success) {
                const product = response.data;
                this.populateProductForm(product);
                
                const modal = document.getElementById('productModal');
                if (modal) {
                    document.getElementById('modalTitle').textContent = '编辑产品';
                    document.getElementById('submitText').textContent = '更新产品';
                    modal.classList.add('active');
                    document.getElementById('name').focus();
                }
            }
        } catch (error) {
            console.error('获取产品详情失败:', error);
            utils.showError('获取产品详情失败');
        }
    }

    // 填充产品表单
    populateProductForm(product) {
        document.getElementById('productId').value = product._id;
        document.getElementById('name').value = product.name;
        document.getElementById('description').value = product.description;
        document.getElementById('price').value = product.price;
        document.getElementById('stock').value = product.stock;
        document.getElementById('category').value = product.category?._id || '';
        document.getElementById('tags').value = product.tags ? product.tags.join(', ') : '';
        document.getElementById('imageUrl').value = product.imageUrl || '';
        document.getElementById('sku').value = product.sku || '';
        document.getElementById('weight').value = product.weight || '';
        document.getElementById('dimensions').value = product.dimensions || '';
        document.getElementById('isPublished').checked = product.isPublished;
    }

    // 处理产品表单提交
    async handleProductSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            description: document.getElementById('description').value.trim(),
            price: parseFloat(document.getElementById('price').value),
            stock: parseInt(document.getElementById('stock').value),
            category: document.getElementById('category').value || null,
            tags: document.getElementById('tags').value.trim().split(',').map(tag => tag.trim()).filter(tag => tag),
            imageUrl: document.getElementById('imageUrl').value.trim() || null,
            sku: document.getElementById('sku').value.trim() || null,
            weight: parseFloat(document.getElementById('weight').value) || null,
            dimensions: document.getElementById('dimensions').value.trim() || null,
            isPublished: document.getElementById('isPublished').checked
        };

        const productId = document.getElementById('productId').value;

        // 验证必填字段
        if (!formData.name || !formData.description || !formData.price || formData.stock === undefined) {
            utils.showError('请填写所有必填字段');
            return;
        }

        this.setSubmitLoading(true);

        try {
            let response;
            if (productId) {
                // 更新产品
                response = await api.updateProduct(productId, formData);
            } else {
                // 创建产品
                response = await api.createProduct(formData);
            }
            
            if (response.success) {
                utils.showSuccess(productId ? '产品更新成功' : '产品创建成功');
                this.closeProductModal();
                await this.loadProducts();
                await this.loadStats();
            }
        } catch (error) {
            console.error('产品操作失败:', error);
            utils.showError(error.message || '操作失败');
        } finally {
            this.setSubmitLoading(false);
        }
    }

    // 显示产品详情
    async showProductDetail(productId) {
        try {
            const response = await api.getProductById(productId);
            if (response.success) {
                const product = response.data;
                this.renderProductDetail(product);
                
                const modal = document.getElementById('productDetailModal');
                if (modal) {
                    modal.classList.add('active');
                }
            }
        } catch (error) {
            console.error('获取产品详情失败:', error);
            utils.showError('获取产品详情失败');
        }
    }

    // 渲染产品详情
    renderProductDetail(product) {
        const content = document.getElementById('productDetailContent');
        if (!content) return;

        content.innerHTML = `
            <div class="product-detail">
                <div class="product-detail-header">
                    <div class="product-detail-image">
                        ${product.imageUrl ? 
                            `<img src="${product.imageUrl}" alt="${product.name}">` :
                            `<div class="placeholder-image"><i class="fas fa-image"></i></div>`
                        }
                    </div>
                    <div class="product-detail-info">
                        <h2>${product.name}</h2>
                        <p class="product-detail-price">${utils.formatCurrency(product.price)}</p>
                        <div class="product-detail-status">
                            ${utils.getStatusBadge(product.isPublished ? 'published' : 'draft')}
                        </div>
                    </div>
                </div>
                
                <div class="product-detail-body">
                    <div class="detail-section">
                        <h4>产品描述</h4>
                        <p>${product.description}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>基本信息</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>库存:</label>
                                <span>${product.stock}</span>
                            </div>
                            <div class="detail-item">
                                <label>SKU:</label>
                                <span>${product.sku || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>重量:</label>
                                <span>${product.weight ? product.weight + ' kg' : '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>尺寸:</label>
                                <span>${product.dimensions || '-'}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${product.tags && product.tags.length > 0 ? `
                        <div class="detail-section">
                            <h4>标签</h4>
                            <div class="product-tags">
                                ${product.tags.map(tag => `
                                    <span class="product-tag">${tag}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="detail-section">
                        <h4>时间信息</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>创建时间:</label>
                                <span>${utils.formatDate(product.createdAt)}</span>
                            </div>
                            <div class="detail-item">
                                <label>更新时间:</label>
                                <span>${utils.formatDate(product.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 关闭产品详情模态框
    closeProductDetailModal() {
        const modal = document.getElementById('productDetailModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // 显示删除确认
    showDeleteConfirm(productId, productName) {
        this.selectedProductId = productId;
        document.getElementById('deleteProductName').textContent = productName;
        
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
        this.selectedProductId = null;
    }

    // 确认删除
    async confirmDelete() {
        if (!this.selectedProductId) return;

        try {
            const response = await api.deleteProduct(this.selectedProductId);
            
            if (response.success) {
                utils.showSuccess('产品删除成功');
                this.closeDeleteModal();
                await this.loadProducts();
                await this.loadStats();
            }
        } catch (error) {
            console.error('删除产品失败:', error);
            utils.showError(error.message || '删除产品失败');
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
    async refreshProducts() {
        await this.loadProducts();
        await this.loadStats();
    }
}

// 全局函数
function showAddProductModal() {
    if (window.productsPage) {
        window.productsPage.showAddProductModal();
    }
}

function closeProductModal() {
    if (window.productsPage) {
        window.productsPage.closeProductModal();
    }
}

function closeProductDetailModal() {
    if (window.productsPage) {
        window.productsPage.closeProductDetailModal();
    }
}

function closeDeleteModal() {
    if (window.productsPage) {
        window.productsPage.closeDeleteModal();
    }
}

function confirmDelete() {
    if (window.productsPage) {
        window.productsPage.confirmDelete();
    }
}

function refreshProducts() {
    if (window.productsPage) {
        window.productsPage.refreshProducts();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('产品页面DOM加载完成');
    window.productsPage = new ProductsPage();
});

// 添加产品详情样式
const productDetailCSS = `
.no-products {
    grid-column: 1 / -1;
    text-align: center;
    padding: var(--spacing-2xl);
    color: var(--gray-600);
}

.no-products i {
    font-size: 4rem;
    margin-bottom: var(--spacing-lg);
    color: var(--gray-400);
}

.product-detail-header {
    display: flex;
    gap: var(--spacing-xl);
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--gray-200);
}

.product-detail-image {
    flex-shrink: 0;
    width: 200px;
    height: 200px;
}

.product-detail-image img,
.placeholder-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-lg);
}

.placeholder-image {
    background: var(--gray-100);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gray-400);
    font-size: 3rem;
}

.product-detail-info h2 {
    margin-bottom: var(--spacing-sm);
    color: var(--gray-800);
}

.product-detail-price {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: var(--spacing-md);
}

.product-detail-body {
    max-height: 60vh;
    overflow-y: auto;
}

@media (max-width: 768px) {
    .product-detail-header {
        flex-direction: column;
    }
    
    .product-detail-image {
        width: 100%;
        height: 200px;
    }
}
`;

// 添加样式
if (!document.getElementById('product-detail-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'product-detail-styles';
    styleElement.textContent = productDetailCSS;
    document.head.appendChild(styleElement);
}
