# 🗄️ 本地数据库安装指南

完整安装MySQL、MongoDB、Redis、PostgreSQL以及对应的GUI管理工具。

## 📋 安装清单

### 数据库
- ✅ MySQL 8.0+
- ✅ MongoDB 6.0+
- ✅ Redis 7.0+
- ✅ PostgreSQL 15+

### GUI管理工具
- ✅ Navicat (MySQL/PostgreSQL 管理)
- ✅ Robot 3T (MongoDB 管理)
- ✅ VSCode Redis 插件
- ✅ VSCode PostgreSQL 插件

## 🚀 安装步骤

### 第一步：清理现有MySQL安装

```bash
# 停止可能存在的MySQL进程
sudo pkill -f mysql

# 删除之前的安装
brew uninstall mysql
sudo rm -rf /opt/homebrew/var/mysql
```

### 第二步：安装数据库

```bash
# 1. 安装MySQL 8.0 (稳定版本)
brew install mysql@8.0

# 2. 安装MongoDB
brew tap mongodb/brew
brew install mongodb-community

# 3. 安装Redis
brew install redis

# 4. 安装PostgreSQL
brew install postgresql@15
```

### 第三步：启动数据库服务

```bash
# 启动MySQL
brew services start mysql@8.0

# 启动MongoDB
brew services start mongodb-community

# 启动Redis
brew services start redis

# 启动PostgreSQL
brew services start postgresql@15
```

### 第四步：配置数据库

#### MySQL配置
```bash
# 连接MySQL (初始无密码)
mysql -u root

# 设置root密码
ALTER USER 'root'@'localhost' IDENTIFIED BY 'database_learning_password';

# 创建项目数据库
CREATE DATABASE database_learning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 退出
EXIT;
```

#### PostgreSQL配置
```bash
# 创建数据库
createdb database_learning

# 连接测试
psql database_learning
```

#### MongoDB配置
```bash
# 连接MongoDB
mongosh

# 创建数据库和用户 (可选)
use database_learning
db.createUser({
  user: "dbuser",
  pwd: "database_learning_password",
  roles: ["readWrite"]
})
```

### 第五步：安装GUI工具

#### Navicat (MySQL/PostgreSQL)
1. 访问：https://navicat.com/en/download/navicat-premium
2. 下载试用版
3. 安装并配置连接

#### Robot 3T (MongoDB)
1. 访问：https://robomongo.org/download
2. 下载免费版
3. 安装并配置连接

#### VSCode插件
在VSCode中安装以下插件：
- Redis插件：`ms-redis.redis`
- PostgreSQL插件：`ms-ossdata.vscode-postgresql`

## 🔧 连接配置

### MySQL连接信息
- Host: localhost
- Port: 3306
- Username: root
- Password: database_learning_password
- Database: database_learning

### MongoDB连接信息
- Host: localhost
- Port: 27017
- Database: database_learning

### Redis连接信息
- Host: localhost
- Port: 6379
- Password: (空)

### PostgreSQL连接信息
- Host: localhost
- Port: 5432
- Username: (你的系统用户名)
- Database: database_learning

## ✅ 测试连接

运行以下命令测试各数据库连接：

```bash
# 测试MySQL
mysql -u root -p -e "SELECT 'MySQL OK' as status;"

# 测试PostgreSQL
psql database_learning -c "SELECT 'PostgreSQL OK' as status;"

# 测试MongoDB
mongosh --eval "db.runCommand('ping')"

# 测试Redis
redis-cli ping
```

## 🎯 下一步

数据库安装完成后：
1. 更新项目的 `.env` 文件
2. 运行 `npm install`
3. 初始化Prisma：`npm run prisma:generate && npm run prisma:push`
4. 运行种子脚本：`npm run seed`
5. 启动应用：`npm run dev`
