const express = require('express');
const productController = require('../controllers/productController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validate, productSchemas, paramSchemas, querySchemas } = require('../middleware/validation');
const { rateLimitConfigs } = require('../middleware/rateLimit');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/products
 * @desc    创建产品
 * @access  Private (需要认证，实际应用可能需要管理员权限)
 */
router.post('/',
  authenticateToken, // 需要认证
  rateLimitConfigs.create, // 创建操作限流
  validate(productSchemas.create), // 验证产品数据
  asyncHandler(productController.createProduct)
);

/**
 * @route   GET /api/products
 * @desc    获取产品列表
 * @access  Public
 */
router.get('/',
  rateLimitConfigs.general, // 一般限流
  optionalAuth, // 可选认证
  validate(querySchemas.productSearch, 'query'), // 验证查询参数
  asyncHandler(productController.getProducts)
);

/**
 * @route   GET /api/products/search
 * @desc    搜索产品
 * @access  Public
 */
router.get('/search',
  rateLimitConfigs.search, // 搜索限流
  validate(querySchemas.productSearch, 'query'), // 验证搜索参数
  asyncHandler(productController.searchProducts)
);

/**
 * @route   GET /api/products/stats
 * @desc    获取产品统计信息
 * @access  Public (考虑实际应用可能需要管理员权限)
 */
router.get('/stats',
  rateLimitConfigs.general,
  asyncHandler(productController.getProductStats)
);

/**
 * @route   GET /api/products/categories
 * @desc    获取产品分类列表
 * @access  Public
 */
router.get('/categories',
  rateLimitConfigs.general,
  asyncHandler(productController.getCategories)
);

/**
 * @route   GET /api/products/category/:category
 * @desc    根据分类获取产品
 * @access  Public
 */
router.get('/category/:category',
  rateLimitConfigs.general,
  validate(paramSchemas.category, 'params'), // 验证分类参数
  validate(querySchemas.pagination, 'query'), // 验证分页参数
  asyncHandler(productController.getProductsByCategory)
);

/**
 * @route   GET /api/products/:id
 * @desc    根据ID获取产品详情
 * @access  Public
 */
router.get('/:id',
  rateLimitConfigs.general,
  validate(paramSchemas.id, 'params'), // 验证ID参数
  asyncHandler(productController.getProductById)
);

/**
 * @route   PUT /api/products/:id
 * @desc    更新产品信息
 * @access  Private (需要认证，实际应用可能需要管理员权限)
 */
router.put('/:id',
  authenticateToken, // 需要认证
  validate(paramSchemas.id, 'params'), // 验证ID参数
  validate(productSchemas.update), // 验证更新数据
  asyncHandler(productController.updateProduct)
);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    更新产品库存
 * @access  Private (需要认证，实际应用可能需要管理员权限)
 */
router.patch('/:id/stock',
  authenticateToken, // 需要认证
  validate(paramSchemas.id, 'params'), // 验证ID参数
  validate(productSchemas.updateStock), // 验证库存更新数据
  asyncHandler(productController.updateProductStock)
);

/**
 * @route   POST /api/products/:id/rating
 * @desc    为产品添加评分
 * @access  Private (需要认证的用户才能评分)
 */
router.post('/:id/rating',
  authenticateToken, // 需要认证
  rateLimitConfigs.create, // 创建操作限流
  validate(paramSchemas.id, 'params'), // 验证ID参数
  validate(productSchemas.addRating), // 验证评分数据
  asyncHandler(productController.addProductRating)
);

/**
 * @route   DELETE /api/products/:id
 * @desc    删除产品
 * @access  Private (需要认证，实际应用可能需要管理员权限)
 */
router.delete('/:id',
  authenticateToken, // 需要认证
  validate(paramSchemas.id, 'params'), // 验证ID参数
  asyncHandler(productController.deleteProduct)
);

module.exports = router;
