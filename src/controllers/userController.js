const { prisma } = require('../config/database');
const cacheService = require('../services/cacheService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 用户控制器 (Prisma ORM)
class UserController {
  // 创建用户
  async createUser(req, res) {
    try {
      const { email, username, password, firstName, lastName, bio } = req.body;

      // 检查用户是否已存在
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '邮箱或用户名已存在'
        });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建用户
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          firstName,
          lastName,
          bio
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          bio: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // 清除用户列表缓存
      await cacheService.delPattern('users:*');

      res.status(201).json({
        success: true,
        message: '用户创建成功',
        data: user
      });
    } catch (error) {
      console.error('创建用户失败:', error);
      res.status(500).json({
        success: false,
        message: '创建用户失败',
        error: error.message
      });
    }
  }

  // 用户登录
  async loginUser(req, res) {
    try {
      const { email, password } = req.body;

      // 查找用户
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '邮箱或密码错误'
        });
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '邮箱或密码错误'
        });
      }

      // 生成JWT令牌
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // 存储用户会话到Redis
      await cacheService.setUserSession(user.id, {
        id: user.id,
        email: user.email,
        username: user.username,
        loginTime: new Date().toISOString()
      });

      // 移除密码后返回用户信息
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error) {
      console.error('用户登录失败:', error);
      res.status(500).json({
        success: false,
        message: '登录失败',
        error: error.message
      });
    }
  }

  // 获取用户列表
  async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const cacheKey = `users:list:page:${page}:limit:${limit}`;
      
      // 尝试从缓存获取
      let result = await cacheService.get(cacheKey);
      
      if (!result) {
        // 从数据库获取
        const [users, total] = await Promise.all([
          prisma.user.findMany({
            skip,
            take: limit,
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              bio: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
              _count: {
                select: {
                  articles: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }),
          prisma.user.count()
        ]);

        result = {
          users,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total,
            limit
          }
        };

        // 缓存5分钟
        await cacheService.set(cacheKey, result, 300);
      }

      res.json({
        success: true,
        message: '获取用户列表成功',
        data: result
      });
    } catch (error) {
      console.error('获取用户列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户列表失败',
        error: error.message
      });
    }
  }

  // 根据ID获取用户
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      const cacheKey = `user:${userId}`;
      
      // 尝试从缓存获取
      let user = await cacheService.get(cacheKey);
      
      if (!user) {
        // 从数据库获取
        user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            bio: true,
            avatar: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            articles: {
              select: {
                id: true,
                title: true,
                excerpt: true,
                slug: true,
                published: true,
                publishedAt: true,
                views: true,
                likes: true,
                createdAt: true
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 10
            },
            _count: {
              select: {
                articles: true
              }
            }
          }
        });

        if (user) {
          // 缓存10分钟
          await cacheService.set(cacheKey, user, 600);
        }
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        message: '获取用户信息成功',
        data: user
      });
    } catch (error) {
      console.error('获取用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败',
        error: error.message
      });
    }
  }

  // 更新用户
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);
      const { firstName, lastName, bio, avatar } = req.body;

      // 检查用户是否存在
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 更新用户
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          bio,
          avatar
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          bio: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // 清除相关缓存
      await cacheService.del(`user:${userId}`);
      await cacheService.delPattern('users:*');

      res.json({
        success: true,
        message: '用户更新成功',
        data: user
      });
    } catch (error) {
      console.error('更新用户失败:', error);
      res.status(500).json({
        success: false,
        message: '更新用户失败',
        error: error.message
      });
    }
  }

  // 删除用户
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      // 检查用户是否存在
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 删除用户（级联删除文章）
      await prisma.user.delete({
        where: { id: userId }
      });

      // 清除相关缓存
      await cacheService.del(`user:${userId}`);
      await cacheService.delPattern('users:*');
      await cacheService.deleteUserSession(userId);

      res.json({
        success: true,
        message: '用户删除成功'
      });
    } catch (error) {
      console.error('删除用户失败:', error);
      res.status(500).json({
        success: false,
        message: '删除用户失败',
        error: error.message
      });
    }
  }

  // 用户统计
  async getUserStats(req, res) {
    try {
      const cacheKey = 'users:stats';
      
      // 尝试从缓存获取
      let stats = await cacheService.get(cacheKey);
      
      if (!stats) {
        // 从数据库获取统计信息
        const [totalUsers, activeUsers, totalArticles] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { isActive: true } }),
          prisma.article.count()
        ]);

        // 最近注册的用户
        const recentUsers = await prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            username: true,
            email: true,
            createdAt: true
          }
        });

        stats = {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          totalArticles,
          recentUsers
        };

        // 缓存15分钟
        await cacheService.set(cacheKey, stats, 900);
      }

      res.json({
        success: true,
        message: '获取用户统计成功',
        data: stats
      });
    } catch (error) {
      console.error('获取用户统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户统计失败',
        error: error.message
      });
    }
  }

  // 用户登出
  async logoutUser(req, res) {
    try {
      const { userId } = req.user; // 从中间件获取

      // 删除Redis中的会话
      await cacheService.deleteUserSession(userId);

      res.json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      console.error('用户登出失败:', error);
      res.status(500).json({
        success: false,
        message: '登出失败',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();
