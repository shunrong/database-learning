const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validate, userSchemas, paramSchemas, querySchemas } = require('../middleware/validation');
const { rateLimitConfigs } = require('../middleware/rateLimit');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/users/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register',
  rateLimitConfigs.auth, // 认证限流
  validate(userSchemas.create), // 验证请求数据
  asyncHandler(userController.createUser)
);

/**
 * @route   POST /api/users/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login',
  rateLimitConfigs.auth, // 认证限流
  validate(userSchemas.login), // 验证登录数据
  asyncHandler(userController.loginUser)
);

/**
 * @route   POST /api/users/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout',
  authenticateToken, // 需要认证
  asyncHandler(userController.logoutUser)
);

/**
 * @route   GET /api/users
 * @desc    获取用户列表
 * @access  Public (考虑实际应用可能需要认证)
 */
router.get('/',
  rateLimitConfigs.general, // 一般限流
  validate(querySchemas.pagination, 'query'), // 验证分页参数
  asyncHandler(userController.getUsers)
);

/**
 * @route   GET /api/users/stats
 * @desc    获取用户统计信息
 * @access  Public (考虑实际应用可能需要管理员权限)
 */
router.get('/stats',
  rateLimitConfigs.general,
  asyncHandler(userController.getUserStats)
);

/**
 * @route   GET /api/users/:id
 * @desc    根据ID获取用户信息
 * @access  Public
 */
router.get('/:id',
  rateLimitConfigs.general,
  validate(paramSchemas.id, 'params'), // 验证ID参数
  asyncHandler(userController.getUserById)
);

/**
 * @route   PUT /api/users/:id
 * @desc    更新用户信息
 * @access  Private (用户只能更新自己的信息)
 */
router.put('/:id',
  authenticateToken, // 需要认证
  validate(paramSchemas.id, 'params'), // 验证ID参数
  validate(userSchemas.update), // 验证更新数据
  // 这里可以添加权限检查中间件，确保用户只能更新自己的信息
  asyncHandler(userController.updateUser)
);

/**
 * @route   DELETE /api/users/:id
 * @desc    删除用户
 * @access  Private (管理员权限或用户删除自己的账户)
 */
router.delete('/:id',
  authenticateToken, // 需要认证
  validate(paramSchemas.id, 'params'), // 验证ID参数
  // 这里可以添加权限检查中间件
  asyncHandler(userController.deleteUser)
);

module.exports = router;
