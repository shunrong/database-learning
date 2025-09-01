const express = require('express');
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const cacheService = require('../services/cacheService');
const { rateLimitConfigs } = require('../middleware/rateLimit');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// API 根路径信息
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '数据库学习 Express API',
    version: '1.0.0',
    description: '集成MySQL、MongoDB、Prisma、Redis的学习项目',
    endpoints: {
      users: '/api/users',
      products: '/api/products', 
      orders: '/api/orders',
      health: '/api/health',
      cache: '/api/cache'
    },
    documentation: 'https://github.com/your-repo/database-learning',
    timestamp: new Date().toISOString()
  });
});

// 健康检查端点
router.get('/health', rateLimitConfigs.general, asyncHandler(async (req, res) => {
  try {
    // 检查各个数据库连接状态
    const { prisma, mysqlPool, mongoose, redisClient } = require('../config/database');
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        prisma: 'unknown',
        mysql: 'unknown', 
        mongodb: 'unknown',
        redis: 'unknown'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    };

    // 检查 Prisma 连接
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.prisma = 'healthy';
    } catch (error) {
      health.services.prisma = 'unhealthy';
      health.status = 'degraded';
    }

    // 检查 MySQL 连接
    try {
      const connection = await mysqlPool.getConnection();
      connection.release();
      health.services.mysql = 'healthy';
    } catch (error) {
      health.services.mysql = 'unhealthy';
      health.status = 'degraded';
    }

    // 检查 MongoDB 连接
    try {
      if (mongoose.connection.readyState === 1) {
        health.services.mongodb = 'healthy';
      } else {
        health.services.mongodb = 'unhealthy';
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.mongodb = 'unhealthy';
      health.status = 'degraded';
    }

    // 检查 Redis 连接
    try {
      await redisClient.ping();
      health.services.redis = 'healthy';
    } catch (error) {
      health.services.redis = 'unhealthy';
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: '健康检查失败',
      error: error.message
    });
  }
}));

// 缓存管理端点
router.get('/cache/info', rateLimitConfigs.general, asyncHandler(async (req, res) => {
  try {
    const info = await cacheService.getInfo();
    res.json({
      success: true,
      message: '获取缓存信息成功',
      data: {
        redis_info: info,
        cache_service: 'active'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取缓存信息失败',
      error: error.message
    });
  }
}));

// 清空缓存端点 (谨慎使用)
router.delete('/cache/flush', rateLimitConfigs.strict, asyncHandler(async (req, res) => {
  try {
    await cacheService.flushAll();
    res.json({
      success: true,
      message: '缓存清空成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '清空缓存失败',
      error: error.message
    });
  }
}));

// API 统计端点
router.get('/stats', rateLimitConfigs.general, asyncHandler(async (req, res) => {
  try {
    // 从缓存获取各种统计信息
    const [userStats, productStats, orderStats] = await Promise.all([
      cacheService.get('users:stats'),
      cacheService.get('products:stats'),
      cacheService.get('orders:stats')
    ]);

    res.json({
      success: true,
      message: '获取API统计成功',
      data: {
        users: userStats || { message: '用户统计未缓存' },
        products: productStats || { message: '产品统计未缓存' },
        orders: orderStats || { message: '订单统计未缓存' },
        cache_status: 'active',
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取API统计失败',
      error: error.message
    });
  }
}));

// 数据库信息端点
router.get('/database-info', rateLimitConfigs.general, (req, res) => {
  res.json({
    success: true,
    message: '数据库集成信息',
    data: {
      databases: {
        mysql: {
          description: 'MySQL 关系型数据库',
          usage: 'Orders 订单数据 (原生SQL查询)',
          features: ['事务支持', '关系约束', '索引优化', '连接池']
        },
        mongodb: {
          description: 'MongoDB 文档型数据库', 
          usage: 'Products 产品数据 (Mongoose ORM)',
          features: ['文档存储', '灵活Schema', '聚合管道', '全文搜索']
        },
        prisma: {
          description: 'Prisma ORM + MySQL',
          usage: 'Users, Articles, Categories, Tags (类型安全ORM)',
          features: ['类型安全', '关系映射', '迁移管理', '查询优化']
        },
        redis: {
          description: 'Redis 内存数据库',
          usage: '缓存、会话、限流 (键值存储)',
          features: ['高性能缓存', '数据结构', '持久化', '发布订阅']
        }
      },
      integrations: {
        'Cross-database queries': '跨数据库关联查询示例',
        'Caching strategy': 'Redis缓存策略优化',
        'Transaction management': '事务管理最佳实践',
        'Performance monitoring': '性能监控和优化'
      }
    }
  });
});

// 挂载子路由
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
