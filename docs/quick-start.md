# 🚀 快速启动指南

这个指南帮你用Docker一键启动所有数据库服务，无需手动安装MySQL、MongoDB、Redis。

## 📋 前置要求

只需要安装：
- **Docker Desktop** (包含 docker-compose)
- **Node.js** (≥ 16.0.0)

## 🔧 启动步骤

### 1. 复制环境配置文件

```bash
cp dev.env .env
```

### 2. 启动数据库服务 (Docker)

```bash
# 启动所有数据库服务 (后台运行)
docker-compose -f docker-compose.dev.yml up -d

# 查看服务状态
docker-compose -f docker-compose.dev.yml ps
```

等待所有服务启动完成（约1-2分钟）。

### 3. 安装项目依赖

```bash
npm install
```

### 4. 初始化Prisma和数据库

```bash
# 生成Prisma客户端
npm run prisma:generate

# 创建数据库表结构
npm run prisma:push

# 初始化示例数据
npm run seed
```

### 5. 启动Express应用

```bash
# 开发模式启动
npm run dev
```

## 🌐 访问地址

### 应用接口
- **API服务**: http://localhost:3000
- **API文档**: http://localhost:3000/api
- **健康检查**: http://localhost:3000/api/health

### 数据库管理界面
- **MySQL管理**: http://localhost:8080 (phpMyAdmin)
- **MongoDB管理**: http://localhost:8081 (mongo-express，账号: admin/admin123)
- **Redis管理**: http://localhost:8082 (redis-commander)

## 🧪 测试API

### 用户注册
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "firstName": "测试",
    "lastName": "用户"
  }'
```

### 用户登录
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### 获取产品列表
```bash
curl http://localhost:3000/api/products
```

### 获取用户列表
```bash
curl http://localhost:3000/api/users
```

## 🔍 数据库学习指南

### 1. Prisma (用户管理)
- 文件位置: `src/controllers/userController.js`
- 特点: 类型安全的ORM，自动生成客户端
- 查看数据: http://localhost:8080 (数据库: database_learning, 表: users)

### 2. MongoDB (产品管理)
- 文件位置: `src/controllers/productController.js`, `src/models/Product.js`
- 特点: 文档型数据库，灵活的数据结构
- 查看数据: http://localhost:8081 (数据库: database_learning, 集合: products)

### 3. MySQL原生查询 (订单管理)
- 文件位置: `src/controllers/orderController.js`, `src/models/Order.js`
- 特点: 原生SQL查询，高性能事务处理
- 查看数据: http://localhost:8080 (数据库: database_learning, 表: orders)

### 4. Redis (缓存服务)
- 文件位置: `src/services/cacheService.js`
- 特点: 内存数据库，高性能缓存
- 查看数据: http://localhost:8082

## 📚 学习重点

### 数据库连接 (`src/config/database.js`)
```javascript
// 查看如何同时连接4种数据库
const { prisma, mysqlPool, mongoose, redisClient } = require('./config/database');
```

### 不同的查询方式对比

1. **Prisma ORM查询**:
```javascript
// 类型安全，自动生成
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { articles: true }
});
```

2. **Mongoose查询**:
```javascript
// 文档型查询，灵活的条件
const products = await Product.find({ category: 'electronics' })
  .sort({ createdAt: -1 })
  .limit(10);
```

3. **MySQL原生查询**:
```javascript
// 精确的SQL控制
const [rows] = await mysqlPool.execute(
  'SELECT * FROM orders WHERE user_id = ? AND status = ?',
  [userId, 'pending']
);
```

4. **Redis缓存**:
```javascript
// 高性能键值存储
await cacheService.set('user:123', userData, 600); // 缓存10分钟
const user = await cacheService.get('user:123');
```

## 🛑 停止服务

```bash
# 停止应用
Ctrl + C

# 停止数据库服务
docker-compose -f docker-compose.dev.yml down

# 停止并删除数据 (谨慎使用)
docker-compose -f docker-compose.dev.yml down -v
```

## 🐛 常见问题

### Q: Docker启动失败
**A**: 确保Docker Desktop正在运行，端口3306、27017、6379没有被占用

### Q: 无法连接数据库
**A**: 等待Docker服务完全启动（1-2分钟），可以用 `docker-compose -f docker-compose.dev.yml ps` 查看状态

### Q: Prisma报错
**A**: 运行 `npm run prisma:generate` 重新生成客户端

## 💡 学习建议

1. **先看效果**: 启动服务后直接测试API，了解整体功能
2. **看数据流转**: 通过管理界面观察数据在不同数据库中的存储
3. **读代码逻辑**: 从控制器开始，理解每种数据库的使用方式
4. **对比差异**: 比较Prisma、Mongoose、原生SQL的写法差异
5. **观察缓存**: 看Redis如何提升API响应速度

现在你可以开始学习之旅了！🎉
