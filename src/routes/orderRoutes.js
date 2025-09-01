const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');
const { validate, orderSchemas, paramSchemas, querySchemas } = require('../middleware/validation');
const { rateLimitConfigs } = require('../middleware/rateLimit');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    创建订单
 * @access  Private (需要认证)
 */
router.post('/',
  authenticateToken, // 需要认证
  rateLimitConfigs.create, // 创建操作限流
  validate(orderSchemas.create), // 验证订单数据
  asyncHandler(orderController.createOrder)
);

/**
 * @route   GET /api/orders
 * @desc    获取订单列表
 * @access  Private (需要认证，实际应用可能需要管理员权限)
 */
router.get('/',
  authenticateToken, // 需要认证
  rateLimitConfigs.general, // 一般限流
  validate(querySchemas.pagination, 'query'), // 验证分页参数
  asyncHandler(orderController.getOrders)
);

/**
 * @route   GET /api/orders/stats
 * @desc    获取订单统计信息
 * @access  Private (需要认证，实际应用可能需要管理员权限)
 */
router.get('/stats',
  authenticateToken, // 需要认证
  rateLimitConfigs.general,
  asyncHandler(orderController.getOrderStats)
);

/**
 * @route   GET /api/orders/user/:userId
 * @desc    根据用户ID获取订单
 * @access  Private (用户只能查看自己的订单，管理员可以查看所有)
 */
router.get('/user/:userId',
  authenticateToken, // 需要认证
  rateLimitConfigs.general,
  validate(paramSchemas.userId, 'params'), // 验证用户ID参数
  validate(querySchemas.pagination, 'query'), // 验证分页参数
  // 这里可以添加权限检查中间件，确保用户只能查看自己的订单
  asyncHandler(orderController.getOrdersByUserId)
);

/**
 * @route   GET /api/orders/status/:status
 * @desc    根据状态获取订单
 * @access  Private (需要认证，实际应用可能需要管理员权限)
 */
router.get('/status/:status',
  authenticateToken, // 需要认证
  rateLimitConfigs.general,
  validate(paramSchemas.status, 'params'), // 验证状态参数
  validate(querySchemas.pagination, 'query'), // 验证分页参数
  asyncHandler(orderController.getOrdersByStatus)
);

/**
 * @route   GET /api/orders/:id
 * @desc    根据ID获取订单详情
 * @access  Private (用户只能查看自己的订单，管理员可以查看所有)
 */
router.get('/:id',
  authenticateToken, // 需要认证
  rateLimitConfigs.general,
  validate(paramSchemas.id, 'params'), // 验证ID参数
  // 这里可以添加权限检查中间件
  asyncHandler(orderController.getOrderById)
);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    更新订单状态
 * @access  Private (需要认证，实际应用可能需要管理员权限)
 */
router.patch('/:id/status',
  authenticateToken, // 需要认证
  validate(paramSchemas.id, 'params'), // 验证ID参数
  validate(orderSchemas.updateStatus), // 验证状态更新数据
  asyncHandler(orderController.updateOrderStatus)
);

/**
 * @route   PATCH /api/orders/bulk/status
 * @desc    批量更新订单状态
 * @access  Private (需要认证，实际应用可能需要管理员权限)
 */
router.patch('/bulk/status',
  authenticateToken, // 需要认证
  rateLimitConfigs.admin, // 管理员操作限流
  validate(orderSchemas.bulkUpdateStatus), // 验证批量更新数据
  asyncHandler(orderController.bulkUpdateOrderStatus)
);

/**
 * @route   DELETE /api/orders/:id
 * @desc    删除订单
 * @access  Private (需要认证，实际应用可能需要管理员权限)
 */
router.delete('/:id',
  authenticateToken, // 需要认证
  validate(paramSchemas.id, 'params'), // 验证ID参数
  asyncHandler(orderController.deleteOrder)
);

module.exports = router;
