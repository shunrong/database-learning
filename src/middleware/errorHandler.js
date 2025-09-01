const { PrismaClientKnownRequestError, PrismaClientValidationError } = require('@prisma/client/runtime/library');

// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // 设置默认错误响应
  let error = {
    success: false,
    message: '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.message 
    })
  };

  let statusCode = 500;

  // 处理不同类型的错误
  if (err.name === 'ValidationError') {
    // Mongoose 验证错误
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    error = {
      success: false,
      message: '数据验证失败',
      errors
    };
  } else if (err.name === 'CastError') {
    // Mongoose 类型转换错误
    statusCode = 400;
    error = {
      success: false,
      message: '无效的数据格式'
    };
  } else if (err.code === 11000) {
    // MongoDB 重复键错误
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    error = {
      success: false,
      message: `${field} 已存在`
    };
  } else if (err instanceof PrismaClientKnownRequestError) {
    // Prisma 已知错误
    statusCode = 400;
    
    switch (err.code) {
      case 'P2002':
        // 唯一约束违反
        const field = err.meta?.target?.[0] || '字段';
        error = {
          success: false,
          message: `${field} 已存在`
        };
        break;
      case 'P2025':
        // 记录不存在
        statusCode = 404;
        error = {
          success: false,
          message: '记录不存在'
        };
        break;
      case 'P2003':
        // 外键约束失败
        error = {
          success: false,
          message: '关联数据不存在'
        };
        break;
      case 'P2014':
        // 关联记录不存在
        statusCode = 404;
        error = {
          success: false,
          message: '关联记录不存在'
        };
        break;
      default:
        error = {
          success: false,
          message: '数据库操作失败',
          ...(process.env.NODE_ENV === 'development' && { code: err.code })
        };
    }
  } else if (err instanceof PrismaClientValidationError) {
    // Prisma 验证错误
    statusCode = 400;
    error = {
      success: false,
      message: '数据验证失败'
    };
  } else if (err.name === 'JsonWebTokenError') {
    // JWT 错误
    statusCode = 401;
    error = {
      success: false,
      message: '无效的访问令牌'
    };
  } else if (err.name === 'TokenExpiredError') {
    // JWT 过期错误
    statusCode = 401;
    error = {
      success: false,
      message: '访问令牌已过期'
    };
  } else if (err.name === 'MulterError') {
    // 文件上传错误
    statusCode = 400;
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        error = {
          success: false,
          message: '文件大小超出限制'
        };
        break;
      case 'LIMIT_FILE_COUNT':
        error = {
          success: false,
          message: '文件数量超出限制'
        };
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        error = {
          success: false,
          message: '不支持的文件字段'
        };
        break;
      default:
        error = {
          success: false,
          message: '文件上传失败'
        };
    }
  } else if (err.type === 'entity.parse.failed') {
    // JSON 解析错误
    statusCode = 400;
    error = {
      success: false,
      message: '请求数据格式错误'
    };
  } else if (err.type === 'entity.too.large') {
    // 请求体过大
    statusCode = 413;
    error = {
      success: false,
      message: '请求数据过大'
    };
  } else if (err.code === 'ECONNREFUSED') {
    // 数据库连接被拒绝
    statusCode = 503;
    error = {
      success: false,
      message: '数据库连接失败，请稍后重试'
    };
  } else if (err.code === 'ETIMEDOUT') {
    // 数据库连接超时
    statusCode = 503;
    error = {
      success: false,
      message: '数据库连接超时，请稍后重试'
    };
  } else if (err.statusCode || err.status) {
    // 自定义状态码错误
    statusCode = err.statusCode || err.status;
    error = {
      success: false,
      message: err.message || '请求处理失败'
    };
  }

  // 发送错误响应
  res.status(statusCode).json(error);
};

// 404 错误处理中间件
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    path: req.originalUrl,
    method: req.method
  });
};

// 异步错误捕获包装器
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 常用错误创建函数
const createError = {
  badRequest: (message = '请求参数错误') => new AppError(message, 400),
  unauthorized: (message = '未授权访问') => new AppError(message, 401),
  forbidden: (message = '访问被禁止') => new AppError(message, 403),
  notFound: (message = '资源不存在') => new AppError(message, 404),
  conflict: (message = '资源冲突') => new AppError(message, 409),
  unprocessable: (message = '数据验证失败') => new AppError(message, 422),
  tooManyRequests: (message = '请求过于频繁') => new AppError(message, 429),
  internal: (message = '服务器内部错误') => new AppError(message, 500),
  serviceUnavailable: (message = '服务暂不可用') => new AppError(message, 503)
};

// 错误日志记录器
const logError = (err, req = null) => {
  const errorInfo = {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    ...(req && {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    })
  };

  // 根据错误严重程度选择日志级别
  if (err.statusCode && err.statusCode < 500) {
    console.warn('客户端错误:', errorInfo);
  } else {
    console.error('服务器错误:', errorInfo);
  }

  // 在生产环境中，这里可以集成外部日志服务
  // 如: Winston, Sentry, LogRocket 等
};

// 进程异常处理
const setupProcessHandlers = () => {
  // 捕获未处理的 Promise 拒绝
  process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的 Promise 拒绝:', reason);
    console.error('Promise:', promise);
    
    // 在生产环境中可能需要退出进程
    if (process.env.NODE_ENV === 'production') {
      console.error('应用将在清理后退出...');
      process.exit(1);
    }
  });

  // 捕获未捕获的异常
  process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
    
    // 记录错误后退出进程
    console.error('应用将立即退出...');
    process.exit(1);
  });

  // 监听进程信号以优雅关闭
  process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，开始优雅关闭...');
    // 这里可以添加清理逻辑
  });

  process.on('SIGINT', () => {
    console.log('收到 SIGINT 信号，开始优雅关闭...');
    // 这里可以添加清理逻辑
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  createError,
  logError,
  setupProcessHandlers
};
