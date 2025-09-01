# 🚀 本地环境快速启动 (无需Docker)

如果Docker安装遇到问题，可以使用这个本地环境方案快速开始学习。

## 🎯 两种启动方案

### 方案一: Docker方案 (推荐)
1. 从 https://www.docker.com/products/docker-desktop/ 下载Docker Desktop
2. 安装后启动Docker Desktop应用
3. 按照 `quick-start.md` 的步骤操作

### 方案二: 本地数据库方案 (快速开始)
如果Docker安装有问题，可以使用本地简化版本：

## 🔧 本地启动步骤

### 1. 检查Node.js
```bash
node --version
npm --version
```

### 2. 创建本地环境配置
```bash
cp dev.env .env
```

然后编辑 `.env` 文件，使用SQLite代替MySQL：
```env
# 使用SQLite (无需安装数据库)
DATABASE_URL="file:./dev.db"

# 其他配置保持不变...
NODE_ENV=development
PORT=3000
JWT_SECRET=database_learning_jwt_secret_2024
```

### 3. 安装依赖
```bash
npm install
```

### 4. 使用SQLite版本
```bash
# 生成Prisma客户端 (SQLite版本)
npm run prisma:generate

# 创建SQLite数据库和表
npm run prisma:push

# 初始化示例数据
npm run seed
```

### 5. 启动应用
```bash
npm run dev
```

## 📊 学习重点 (本地版本)

即使是简化版本，你仍然可以学习到：

1. **Prisma ORM** - 用户和文章管理 (SQLite)
2. **API设计** - RESTful接口设计
3. **数据验证** - Joi中间件使用
4. **错误处理** - 统一错误处理机制
5. **认证授权** - JWT token管理

## 🌐 测试接口

### 健康检查
```bash
curl http://localhost:3000/api/health
```

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

## 💡 学习建议

虽然本地版本只有Prisma+SQLite，但你可以：

1. **理解ORM概念** - 看Prisma如何简化数据库操作
2. **学习API设计** - 研究控制器和路由结构  
3. **掌握中间件** - 认证、验证、错误处理
4. **了解项目架构** - MVC模式的实践

等你熟悉了基础概念，再安装Docker体验完整的多数据库版本！

## 🔄 升级到完整版本

当你准备好体验多数据库版本时：
1. 安装Docker Desktop
2. 运行 `docker-compose -f docker-compose.dev.yml up -d`
3. 更新 `.env` 文件使用完整配置
4. 重新运行初始化脚本
