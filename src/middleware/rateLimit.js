const cacheService = require('../services/cacheService');

// 基于Redis的限流中间件
const createRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15分钟窗口
    max = 100, // 最大请求数
    message = '请求过于频繁，请稍后再试',
    standardHeaders = true, // 添加标准限流头部
    legacyHeaders = false, // 是否添加旧版头部
    skipSuccessfulRequests = false, // 是否跳过成功请求的计数
    skipFailedRequests = false, // 是否跳过失败请求的计数
    keyGenerator = null, // 自定义键生成器
    onLimitReached = null // 限流触发时的回调
  } = options;

  return async (req, res, next) => {
    try {
      // 检查全局限流开关
      if (process.env.DISABLE_RATE_LIMIT === 'true' || process.env.RATE_LIMIT_ENABLED === 'false') {
        console.log('🔓 限流已禁用，跳过限流检查');
        return next();
      }
      // 生成限流键
      let key;
      if (keyGenerator && typeof keyGenerator === 'function') {
        key = keyGenerator(req);
      } else {
        // 默认使用IP地址，提供更好的IP获取逻辑
        const ip = req.ip || 
                  req.connection?.remoteAddress || 
                  req.socket?.remoteAddress ||
                  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                  req.headers['x-real-ip'] ||
                  'unknown';
        key = ip;
      }

      // 检查限流
      const window = Math.floor(windowMs / 1000); // 转换为秒
      const result = await cacheService.checkRateLimit(key, max, window);

      // 设置响应头部
      if (standardHeaders) {
        res.set({
          'RateLimit-Limit': max,
          'RateLimit-Remaining': Math.max(0, result.remaining),
          'RateLimit-Reset': new Date(result.resetTime).toISOString()
        });
      }

      if (legacyHeaders) {
        res.set({
          'X-RateLimit-Limit': max,
          'X-RateLimit-Remaining': Math.max(0, result.remaining),
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000)
        });
      }

      if (!result.allowed) {
        // 触发限流回调
        if (onLimitReached && typeof onLimitReached === 'function') {
          onLimitReached(req, res);
        }

        return res.status(429).json({
          success: false,
          message: message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        });
      }

      // 请求结束后更新计数器（如果需要跳过某些请求）
      const originalSend = res.send;
      res.send = function(data) {
        const statusCode = res.statusCode;
        const shouldCount = !(
          (skipSuccessfulRequests && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400)
        );

        if (!shouldCount) {
          // 如果不应该计数，撤销之前的计数
          cacheService.decr(key).catch(console.error);
        }

        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('限流中间件错误:', error);
      // 发生错误时允许请求通过
      next();
    }
  };
};

// 预定义的限流配置
const rateLimitConfigs = {
  // 一般API限流：每15分钟100个请求
  general: createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: '请求过于频繁，请稍后再试'
  }),

  // 严格限流：每小时50个请求
  strict: createRateLimit({
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: '请求次数已达上限，请一小时后再试'
  }),

  // 认证API限流：每15分钟5次登录尝试
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: '登录尝试过于频繁，请15分钟后再试',
    keyGenerator: (req) => {
      const ip = req.ip || 
                req.connection?.remoteAddress || 
                req.socket?.remoteAddress ||
                req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers['x-real-ip'] ||
                'unknown';
      return `auth_limit:${ip}`;
    },
    onLimitReached: (req, res) => {
      console.warn(`认证限流触发 - IP: ${req.ip}, 时间: ${new Date().toISOString()}`);
    }
  }),

  // 创建操作限流：每分钟10个请求
  create: createRateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: '创建操作过于频繁，请稍后再试',
    skipFailedRequests: true // 跳过失败请求的计数
  }),

  // 搜索API限流：每分钟30个请求
  search: createRateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: '搜索请求过于频繁，请稍后再试'
  }),

  // 基于用户的限流
  userBased: createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: '用户请求过于频繁，请稍后再试',
    keyGenerator: (req) => {
      if (req.user && req.user.id) {
        return `user_limit:${req.user.id}`;
      }
      // 未认证用户使用IP限流
      const ip = req.ip || 
                req.connection?.remoteAddress || 
                req.socket?.remoteAddress ||
                req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers['x-real-ip'] ||
                'unknown';
      return `ip_limit:${ip}`;
    }
  }),

  // 管理员操作限流：每分钟50个请求
  admin: createRateLimit({
    windowMs: 60 * 1000,
    max: 50,
    message: '管理员操作过于频繁，请稍后再试',
    keyGenerator: (req) => {
      const userId = req.user?.id || 'anonymous';
      return `admin_limit:${userId}`;
    }
  })
};

// 自定义限流中间件工厂
const customRateLimit = (identifier, limit, windowMs, message) => {
  return createRateLimit({
    windowMs,
    max: limit,
    message: message || '请求过于频繁，请稍后再试',
    keyGenerator: (req) => {
      const ip = req.ip || 
                req.connection?.remoteAddress || 
                req.socket?.remoteAddress ||
                req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers['x-real-ip'] ||
                'unknown';
      return `custom_${identifier}:${ip}`;
    }
  });
};

// 基于路径的限流
const pathBasedRateLimit = (pathLimits) => {
  return (req, res, next) => {
    const path = req.path;
    const method = req.method.toLowerCase();
    const key = `${method}:${path}`;

    // 查找匹配的路径配置
    const config = pathLimits[key] || pathLimits[path] || pathLimits['*'];

    if (config) {
      const rateLimiter = createRateLimit(config);
      return rateLimiter(req, res, next);
    }

    next();
  };
};

// 动态限流：根据系统负载调整限制
const dynamicRateLimit = (baseConfig = {}) => {
  return async (req, res, next) => {
    try {
      // 获取Redis信息来判断系统负载（简化实现）
      const redisInfo = await cacheService.getInfo();
      let multiplier = 1;

      if (redisInfo) {
        // 根据已连接客户端数量调整限制
        const connectedClients = parseInt(redisInfo.match(/connected_clients:(\d+)/)?.[1] || '0');
        if (connectedClients > 100) {
          multiplier = 0.5; // 减少50%的限制
        } else if (connectedClients > 50) {
          multiplier = 0.75; // 减少25%的限制
        }
      }

      const adjustedConfig = {
        ...baseConfig,
        max: Math.floor((baseConfig.max || 100) * multiplier)
      };

      const rateLimiter = createRateLimit(adjustedConfig);
      return rateLimiter(req, res, next);
    } catch (error) {
      console.error('动态限流错误:', error);
      // 发生错误时使用基础配置
      const rateLimiter = createRateLimit(baseConfig);
      return rateLimiter(req, res, next);
    }
  };
};

module.exports = {
  createRateLimit,
  rateLimitConfigs,
  customRateLimit,
  pathBasedRateLimit,
  dynamicRateLimit
};
