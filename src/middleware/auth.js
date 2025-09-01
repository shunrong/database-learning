const jwt = require('jsonwebtoken');
const cacheService = require('../services/cacheService');
const { prisma } = require('../config/database');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，需要提供访问令牌'
      });
    }

    // 验证JWT令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 检查用户会话是否存在于Redis中
    const session = await cacheService.getUserSession(decoded.userId);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: '会话已过期，请重新登录'
      });
    }

    // 验证用户是否仍然存在且处于活跃状态
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true
      }
    });

    if (!user) {
      // 清除无效会话
      await cacheService.deleteUserSession(decoded.userId);
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    console.error('身份验证失败:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期'
      });
    }

    res.status(500).json({
      success: false,
      message: '身份验证过程中发生错误'
    });
  }
};

// 可选认证中间件（不要求必须登录）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { 
          id: decoded.userId,
          isActive: true
        },
        select: {
          id: true,
          email: true,
          username: true,
          isActive: true
        }
      });

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // 可选认证失败时继续执行，不返回错误
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
