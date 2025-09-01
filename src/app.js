const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// 导入配置和中间件
const { connectDatabases, closeDatabases } = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFoundHandler, setupProcessHandlers } = require('./middleware/errorHandler');
const { rateLimitConfigs } = require('./middleware/rateLimit');

// 创建Express应用
const app = express();

// 设置进程异常处理
setupProcessHandlers();

// 基础中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
})); // 安全头部

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // 生产环境下指定允许的域名
    : true, // 开发环境允许所有来源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // 跨域配置

// 请求日志中间件
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// 解析请求体
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// 信任代理 (如果在代理后面运行)
app.set('trust proxy', 1);

// 全局限流中间件
app.use(rateLimitConfigs.general);

// API路由
app.use('/api', routes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎉 数据库学习 Express API 服务正在运行',
    version: '1.0.0',
    description: '集成 MySQL、MongoDB、Prisma、Redis 的后端学习项目',
    author: 'Database Learning Team',
    endpoints: {
      api_root: '/api',
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      health: '/api/health',
      documentation: '/api/database-info'
    },
    databases: ['MySQL', 'MongoDB', 'Prisma', 'Redis'],
    features: [
      '用户管理 (Prisma ORM)',
      '产品管理 (MongoDB + Mongoose)',
      '订单管理 (MySQL 原生查询)',
      'Redis 缓存服务',
      'JWT 认证',
      '请求限流',
      '数据验证',
      '错误处理',
      '健康检查'
    ],
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

let server;

const startServer = async () => {
  try {
    // 连接所有数据库
    console.log('🚀 正在启动服务器...');
    await connectDatabases();
    
    // 启动HTTP服务器
    server = app.listen(PORT, HOST, () => {
      console.log('');
      console.log('🎉 服务器启动成功！');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📍 服务地址: http://${HOST}:${PORT}`);
      console.log(`🌍 环境模式: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 API文档: http://${HOST}:${PORT}/api`);
      console.log(`💚 健康检查: http://${HOST}:${PORT}/api/health`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('📚 数据库集成:');
      console.log('  ✅ MySQL (原生查询) - 订单管理');
      console.log('  ✅ MongoDB (Mongoose) - 产品管理');
      console.log('  ✅ Prisma ORM - 用户管理');
      console.log('  ✅ Redis - 缓存服务');
      console.log('');
      console.log('🛠️  API端点:');
      console.log(`  👥 用户: http://${HOST}:${PORT}/api/users`);
      console.log(`  📦 产品: http://${HOST}:${PORT}/api/products`);
      console.log(`  📋 订单: http://${HOST}:${PORT}/api/orders`);
      console.log('');
      console.log('按 Ctrl+C 停止服务器');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    // 监听服务器错误
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${PORT} 已被占用，请尝试其他端口`);
      } else {
        console.error('❌ 服务器启动失败:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ 启动服务器失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 收到 ${signal} 信号，开始优雅关闭...`);
  
  if (server) {
    server.close(async () => {
      console.log('🔒 HTTP 服务器已关闭');
      
      try {
        await closeDatabases();
        console.log('🎯 优雅关闭完成');
        process.exit(0);
      } catch (error) {
        console.error('❌ 关闭数据库连接时出错:', error);
        process.exit(1);
      }
    });

    // 强制关闭超时
    setTimeout(() => {
      console.error('⚠️  强制关闭服务器（超时）');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// 监听关闭信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 监听未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

// 启动应用
if (require.main === module) {
  startServer();
}

module.exports = app;
