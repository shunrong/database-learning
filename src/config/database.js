const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const redis = require('redis');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// 检查是否为本地开发模式 (使用SQLite)
const isLocalMode = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('file:');

if (isLocalMode) {
  console.log('🏠 检测到本地开发模式，使用 SQLite 数据库');
  module.exports = require('./database-local');
  return;
}

// Prisma 客户端
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// MySQL 连接池配置
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'database_learning',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
};

// 创建 MySQL 连接池
const mysqlPool = mysql.createPool(mysqlConfig);

// MongoDB 连接配置
const mongoConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Redis 客户端配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

// 创建 Redis 客户端
const redisClient = redis.createClient(redisConfig);

// 数据库连接函数
const connectDatabases = async () => {
  try {
    // 测试 MySQL 连接
    console.log('🔄 正在连接 MySQL...');
    await mysqlPool.getConnection();
    console.log('✅ MySQL 连接成功');

    // 连接 MongoDB
    console.log('🔄 正在连接 MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, mongoConfig);
    console.log('✅ MongoDB 连接成功');

    // 连接 Redis
    console.log('🔄 正在连接 Redis...');
    await redisClient.connect();
    console.log('✅ Redis 连接成功');

    // 测试 Prisma 连接
    console.log('🔄 正在测试 Prisma 连接...');
    await prisma.$connect();
    console.log('✅ Prisma 连接成功');

    console.log('🎉 所有数据库连接成功！');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
};

// 优雅关闭连接
const closeDatabases = async () => {
  try {
    await mysqlPool.end();
    await mongoose.connection.close();
    await redisClient.quit();
    await prisma.$disconnect();
    console.log('🔒 所有数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接时出错:', error);
  }
};

module.exports = {
  prisma,
  mysqlPool,
  mongoose,
  redisClient,
  connectDatabases,
  closeDatabases,
};
