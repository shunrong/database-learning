# 数据库学习 Express 应用

🚀 一个集成多种数据库技术的 Express.js 后端学习项目，包含 MySQL、MongoDB、Prisma、Redis 的完整实践案例。

## 📋 项目概述

这是一个专为学习数据库集成而设计的 Express.js 应用，展示了如何在单个项目中有效使用多种数据库技术：

- **MySQL** - 使用原生 SQL 查询处理订单数据
- **MongoDB + Mongoose** - 文档型数据库处理产品信息
- **Prisma ORM** - 现代化 ORM 管理用户和文章数据
- **Redis** - 高性能缓存和会话管理

## 🎯 学习目标

通过这个项目，你将学会：

1. **多数据库架构设计** - 如何根据数据特性选择合适的数据库
2. **数据库连接管理** - 连接池、错误处理、优雅关闭
3. **ORM vs 原生查询** - 不同查询方式的优缺点对比
4. **缓存策略** - Redis 缓存模式和性能优化
5. **API 设计** - RESTful API 最佳实践
6. **数据验证和安全** - 输入验证、认证授权、限流防护

## 🛠️ 技术栈

### 核心框架
- **Node.js** - JavaScript 运行时
- **Express.js** - Web 应用框架
- **JWT** - 身份认证

### 数据库技术
- **MySQL** - 关系型数据库 (订单管理)
- **MongoDB** - 文档型数据库 (产品管理)
- **Prisma** - 现代化 ORM (用户管理)
- **Redis** - 内存数据库 (缓存/会话)

### 开发工具
- **Joi** - 数据验证
- **Helmet** - 安全中间件
- **Morgan** - 日志记录
- **CORS** - 跨域处理
- **bcryptjs** - 密码加密

## 📁 项目结构

```
database-learning/
├── README.md                 # 项目文档
├── package.json             # 项目依赖
├── env.example              # 环境变量示例
├── prisma/
│   └── schema.prisma        # Prisma 数据模型
└── src/
    ├── app.js              # 应用入口文件
    ├── config/
    │   └── database.js     # 数据库连接配置
    ├── controllers/        # 控制器层
    │   ├── userController.js    # 用户控制器 (Prisma)
    │   ├── productController.js # 产品控制器 (MongoDB)
    │   └── orderController.js   # 订单控制器 (MySQL)
    ├── middleware/         # 中间件
    │   ├── auth.js            # 身份认证
    │   ├── validation.js      # 数据验证
    │   ├── rateLimit.js       # 请求限流
    │   └── errorHandler.js    # 错误处理
    ├── models/             # 数据模型
    │   ├── Product.js         # MongoDB 产品模型
    │   └── Order.js           # MySQL 订单模型
    ├── routes/             # 路由配置
    │   ├── index.js           # 主路由
    │   ├── userRoutes.js      # 用户路由
    │   ├── productRoutes.js   # 产品路由
    │   └── orderRoutes.js     # 订单路由
    ├── services/           # 服务层
    │   └── cacheService.js    # Redis 缓存服务
    └── scripts/            # 工具脚本
        └── seed.js            # 数据库初始化
```

## 🚀 快速开始

### 前置要求

确保你的系统已安装：

- **Node.js** (≥ 16.0.0)
- **MySQL** (≥ 8.0)
- **MongoDB** (≥ 5.0)
- **Redis** (≥ 6.0)

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd database-learning
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境变量模板并配置：

```bash
cp env.example .env
```

编辑 `.env` 文件，配置数据库连接信息：

```env
# MySQL 配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=database_learning

# Prisma 数据库连接
DATABASE_URL="mysql://root:your_mysql_password@localhost:3306/database_learning"

# MongoDB 配置
MONGODB_URI=mongodb://localhost:27017/database_learning

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 应用配置
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
```

### 4. 数据库准备

#### MySQL
```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE database_learning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### MongoDB
```bash
# 启动 MongoDB 服务
mongod

# 或使用 MongoDB Compass 创建数据库
```

#### Redis
```bash
# 启动 Redis 服务
redis-server

# 或
brew services start redis  # macOS
```

### 5. 初始化 Prisma

```bash
# 生成 Prisma 客户端
npm run prisma:generate

# 推送数据库架构
npm run prisma:push
```

### 6. 初始化示例数据

```bash
# 运行数据库种子脚本
npm run seed
```

### 7. 启动应用

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

应用将在 `http://localhost:3000` 启动。

## 📊 数据库架构设计

### 用户管理 (Prisma + MySQL)

**为什么选择 Prisma？**
- 类型安全的查询
- 自动生成的客户端
- 优秀的关系处理
- 内置迁移管理

```javascript
// 用户模型示例
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  username  String   @unique
  password  String
  articles  Article[]
  createdAt DateTime @default(now())
}
```

### 产品管理 (MongoDB + Mongoose)

**为什么选择 MongoDB？**
- 灵活的文档结构
- 适合复杂的产品属性
- 强大的查询能力
- 易于扩展

```javascript
// 产品模型示例
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, enum: ['electronics', 'clothing', ...] },
  specifications: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  }
});
```

### 订单管理 (MySQL 原生查询)

**为什么选择原生 SQL？**
- 精确的查询控制
- 高性能事务处理
- 复杂的数据分析
- 传统企业环境兼容

```sql
-- 订单表结构
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 缓存层 (Redis)

**Redis 使用场景：**
- 用户会话存储
- API 响应缓存
- 请求限流计数
- 实时数据缓存

```javascript
// 缓存策略示例
const cacheKey = `user:${userId}`;
let user = await cacheService.get(cacheKey);

if (!user) {
  user = await prisma.user.findUnique({ where: { id: userId } });
  await cacheService.set(cacheKey, user, 600); // 缓存10分钟
}
```

## 🔧 API 接口文档

### 基础信息

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON

### 用户管理 API

#### 注册用户
```bash
POST /api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "firstName": "张",
  "lastName": "三"
}
```

#### 用户登录
```bash
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 获取用户列表
```bash
GET /api/users?page=1&limit=10
```

#### 获取用户详情
```bash
GET /api/users/:id
```

### 产品管理 API

#### 创建产品
```bash
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "description": "最新款苹果手机",
  "price": 7999.00,
  "category": "electronics",
  "brand": "Apple",
  "sku": "IPHONE15PRO128",
  "stock": 50
}
```

#### 获取产品列表
```bash
GET /api/products?page=1&limit=10&category=electronics&sortBy=price&sortOrder=desc
```

#### 搜索产品
```bash
GET /api/products/search?q=iPhone&minPrice=5000&maxPrice=10000
```

#### 根据分类获取产品
```bash
GET /api/products/category/electronics
```

### 订单管理 API

#### 创建订单
```bash
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 1,
  "productId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "quantity": 2,
  "shippingAddress": "北京市朝阳区某某街道123号"
}
```

#### 获取订单列表
```bash
GET /api/orders?page=1&limit=10
Authorization: Bearer <token>
```

#### 获取用户订单
```bash
GET /api/orders/user/:userId
Authorization: Bearer <token>
```

#### 更新订单状态
```bash
PATCH /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "shipped",
  "notes": "已发货，预计3天内到达"
}
```

### 健康检查和监控

#### 健康检查
```bash
GET /api/health
```

#### 获取统计信息
```bash
GET /api/stats
```

#### 缓存信息
```bash
GET /api/cache/info
```

## 🔒 安全特性

### 身份认证
- JWT Token 认证
- 密码 bcrypt 加密
- 会话 Redis 存储

### 数据验证
- Joi 中间件验证
- 类型检查和格式验证
- 恶意输入防护

### 请求限流
- 基于 Redis 的限流机制
- 不同端点不同限制
- IP 和用户双重限制

### 安全中间件
- Helmet 安全头部
- CORS 跨域配置
- 请求体大小限制

## 🚀 性能优化

### 缓存策略
1. **多层缓存**
   - Redis 应用缓存
   - 数据库查询缓存
   - 静态资源缓存

2. **缓存模式**
   - Cache-Aside (旁路缓存)
   - Write-Through (直写缓存)
   - 过期策略优化

### 数据库优化
1. **索引策略**
   - 主键索引
   - 复合索引
   - 全文搜索索引

2. **查询优化**
   - 分页查询
   - 字段选择
   - 关联查询优化

3. **连接池管理**
   - MySQL 连接池
   - MongoDB 连接池
   - 连接数监控

## 📚 学习路径

### 初级阶段
1. 了解各种数据库的特点
2. 学习基本的 CRUD 操作
3. 掌握数据模型设计

### 中级阶段
1. 学习复杂查询和关联
2. 理解缓存策略
3. 掌握性能优化技巧

### 高级阶段
1. 设计分布式数据架构
2. 实现读写分离
3. 学习数据一致性处理

## 🛠️ 开发工具

### 数据库管理
- **MySQL Workbench** - MySQL 图形化工具
- **MongoDB Compass** - MongoDB 图形化工具
- **Prisma Studio** - Prisma 数据浏览器
- **Redis Desktop Manager** - Redis 客户端

### API 测试
- **Postman** - API 测试工具
- **Insomnia** - REST 客户端
- **curl** - 命令行工具

### 监控工具
```bash
# 查看应用健康状态
curl http://localhost:3000/api/health

# 查看统计信息
curl http://localhost:3000/api/stats

# 查看 Prisma Studio
npm run prisma:studio
```

## 🐛 常见问题

### 数据库连接问题

**Q: MySQL 连接被拒绝**
```bash
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**A:** 
1. 确保 MySQL 服务正在运行
2. 检查端口号和密码配置
3. 验证数据库是否存在

**Q: MongoDB 连接超时**
```bash
Error: connect ETIMEDOUT
```
**A:**
1. 确保 MongoDB 服务正在运行
2. 检查防火墙设置
3. 验证连接字符串格式

**Q: Redis 连接失败**
```bash
Error: Redis connection failed
```
**A:**
1. 启动 Redis 服务
2. 检查 Redis 配置
3. 验证端口可访问性

### Prisma 相关问题

**Q: Prisma Client 生成失败**
```bash
npm run prisma:generate
```

**Q: 数据库架构不同步**
```bash
npm run prisma:push
```

### 环境配置问题

**Q: 环境变量未加载**
- 确保 `.env` 文件在项目根目录
- 检查变量名称拼写
- 重启应用程序

## 🚀 部署指南

### Docker 部署

创建 `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - mysql
      - mongodb
      - redis

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: database_learning
    
  mongodb:
    image: mongo:5.0
    
  redis:
    image: redis:6.0
```

### 生产环境配置

1. **环境变量**
   - 使用强密码
   - 配置 HTTPS
   - 设置正确的 CORS 源

2. **数据库安全**
   - 创建专用数据库用户
   - 限制网络访问
   - 定期备份数据

3. **监控和日志**
   - 配置日志聚合
   - 设置性能监控
   - 错误报告系统

## 🤝 贡献指南

欢迎提交问题和改进建议！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 许可证

本项目采用 MIT 许可证。详情请见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

感谢所有为这个学习项目做出贡献的开发者和学习者！

---

💡 **学习提示**: 这个项目展示了真实世界中数据库技术的集成应用。建议通过实际操作和修改代码来深入理解各种数据库的特点和使用场景。

📧 **联系方式**: 如有问题或建议，请提交 Issue 或联系维护者。
