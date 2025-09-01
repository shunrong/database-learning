const Joi = require('joi');

// 验证中间件生成器
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false, // 返回所有错误
      stripUnknown: true // 移除未知字段
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors
      });
    }

    next();
  };
};

// 用户相关验证规则
const userSchemas = {
  // 创建用户
  create: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': '请提供有效的邮箱地址',
        'any.required': '邮箱是必需的'
      }),
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': '用户名只能包含字母和数字',
        'string.min': '用户名至少需要3个字符',
        'string.max': '用户名不能超过30个字符',
        'any.required': '用户名是必需的'
      }),
    password: Joi.string()
      .min(6)
      .max(100)
      .required()
      .messages({
        'string.min': '密码至少需要6个字符',
        'string.max': '密码不能超过100个字符',
        'any.required': '密码是必需的'
      }),
    firstName: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': '名字不能超过50个字符'
      }),
    lastName: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': '姓氏不能超过50个字符'
      }),
    bio: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': '个人简介不能超过500个字符'
      })
  }),

  // 用户登录
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': '请提供有效的邮箱地址',
        'any.required': '邮箱是必需的'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': '密码是必需的'
      })
  }),

  // 更新用户
  update: Joi.object({
    firstName: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': '名字不能超过50个字符'
      }),
    lastName: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': '姓氏不能超过50个字符'
      }),
    bio: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': '个人简介不能超过500个字符'
      }),
    avatar: Joi.string()
      .uri()
      .optional()
      .allow('')
      .messages({
        'string.uri': '请提供有效的头像URL'
      })
  })
};

// 产品相关验证规则
const productSchemas = {
  // 创建产品
  create: Joi.object({
    name: Joi.string()
      .max(100)
      .required()
      .messages({
        'string.max': '产品名称不能超过100个字符',
        'any.required': '产品名称是必需的'
      }),
    description: Joi.string()
      .max(500)
      .required()
      .messages({
        'string.max': '产品描述不能超过500个字符',
        'any.required': '产品描述是必需的'
      }),
    price: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.positive': '价格必须为正数',
        'any.required': '价格是必需的'
      }),
    category: Joi.string()
      .valid('electronics', 'clothing', 'books', 'home', 'sports', 'toys')
      .required()
      .messages({
        'any.only': '分类必须是: electronics, clothing, books, home, sports, toys 中的一个',
        'any.required': '分类是必需的'
      }),
    brand: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': '品牌名称不能超过50个字符'
      }),
    sku: Joi.string()
      .uppercase()
      .required()
      .messages({
        'any.required': 'SKU是必需的'
      }),
    stock: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .messages({
        'number.integer': '库存必须是整数',
        'number.min': '库存不能为负数'
      }),
    images: Joi.array()
      .items(Joi.string().uri())
      .optional()
      .messages({
        'string.uri': '图片必须是有效的URL'
      }),
    specifications: Joi.object({
      weight: Joi.number().positive().optional(),
      dimensions: Joi.object({
        length: Joi.number().positive().optional(),
        width: Joi.number().positive().optional(),
        height: Joi.number().positive().optional()
      }).optional(),
      color: Joi.string().max(30).optional(),
      material: Joi.string().max(50).optional()
    }).optional(),
    tags: Joi.array()
      .items(Joi.string().max(30))
      .optional()
  }),

  // 更新产品
  update: Joi.object({
    name: Joi.string()
      .max(100)
      .optional(),
    description: Joi.string()
      .max(500)
      .optional(),
    price: Joi.number()
      .positive()
      .precision(2)
      .optional(),
    category: Joi.string()
      .valid('electronics', 'clothing', 'books', 'home', 'sports', 'toys')
      .optional(),
    brand: Joi.string()
      .max(50)
      .optional(),
    stock: Joi.number()
      .integer()
      .min(0)
      .optional(),
    images: Joi.array()
      .items(Joi.string().uri())
      .optional(),
    specifications: Joi.object({
      weight: Joi.number().positive().optional(),
      dimensions: Joi.object({
        length: Joi.number().positive().optional(),
        width: Joi.number().positive().optional(),
        height: Joi.number().positive().optional()
      }).optional(),
      color: Joi.string().max(30).optional(),
      material: Joi.string().max(50).optional()
    }).optional(),
    tags: Joi.array()
      .items(Joi.string().max(30))
      .optional(),
    isActive: Joi.boolean().optional()
  }),

  // 更新库存
  updateStock: Joi.object({
    quantity: Joi.number()
      .integer()
      .required()
      .messages({
        'number.integer': '数量必须是整数',
        'any.required': '数量是必需的'
      })
  }),

  // 添加评分
  addRating: Joi.object({
    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .required()
      .messages({
        'number.integer': '评分必须是整数',
        'number.min': '评分不能低于1',
        'number.max': '评分不能高于5',
        'any.required': '评分是必需的'
      })
  })
};

// 订单相关验证规则
const orderSchemas = {
  // 创建订单
  create: Joi.object({
    userId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.integer': '用户ID必须是整数',
        'number.positive': '用户ID必须为正数',
        'any.required': '用户ID是必需的'
      }),
    productId: Joi.string()
      .required()
      .messages({
        'any.required': '产品ID是必需的'
      }),
    quantity: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.integer': '数量必须是整数',
        'number.positive': '数量必须为正数',
        'any.required': '数量是必需的'
      }),
    shippingAddress: Joi.string()
      .max(500)
      .required()
      .messages({
        'string.max': '收货地址不能超过500个字符',
        'any.required': '收货地址是必需的'
      }),
    notes: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': '备注不能超过500个字符'
      })
  }),

  // 更新订单状态
  updateStatus: Joi.object({
    status: Joi.string()
      .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled')
      .required()
      .messages({
        'any.only': '状态必须是: pending, processing, shipped, delivered, cancelled 中的一个',
        'any.required': '状态是必需的'
      }),
    notes: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': '备注不能超过500个字符'
      })
  }),

  // 批量更新订单状态
  bulkUpdateStatus: Joi.object({
    orderIds: Joi.array()
      .items(Joi.number().integer().positive())
      .min(1)
      .required()
      .messages({
        'array.min': '至少需要提供一个订单ID',
        'any.required': '订单ID数组是必需的'
      }),
    status: Joi.string()
      .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled')
      .required()
      .messages({
        'any.only': '状态必须是: pending, processing, shipped, delivered, cancelled 中的一个',
        'any.required': '状态是必需的'
      }),
    notes: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': '备注不能超过500个字符'
      })
  })
};

// 查询参数验证规则
const querySchemas = {
  // 分页参数
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.integer': '页码必须是整数',
        'number.min': '页码不能小于1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.integer': '每页数量必须是整数',
        'number.min': '每页数量不能小于1',
        'number.max': '每页数量不能超过100'
      })
  }),

  // 产品搜索参数
  productSearch: Joi.object({
    q: Joi.string().max(100).optional(),
    category: Joi.string()
      .valid('electronics', 'clothing', 'books', 'home', 'sports', 'toys')
      .optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    sortBy: Joi.string()
      .valid('createdAt', 'price', 'name', 'rating.average')
      .default('createdAt')
      .optional(),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .optional(),
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional()
  })
};

// ID参数验证
const paramSchemas = {
  id: Joi.object({
    id: Joi.alternatives()
      .try(
        Joi.number().integer().positive(),
        Joi.string().pattern(/^[0-9a-fA-F]{24}$/) // MongoDB ObjectId
      )
      .required()
      .messages({
        'alternatives.match': 'ID必须是有效的数字或MongoDB ObjectId',
        'any.required': 'ID是必需的'
      })
  }),
  
  userId: Joi.object({
    userId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.integer': '用户ID必须是整数',
        'number.positive': '用户ID必须为正数',
        'any.required': '用户ID是必需的'
      })
  }),

  status: Joi.object({
    status: Joi.string()
      .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled')
      .required()
      .messages({
        'any.only': '状态必须是: pending, processing, shipped, delivered, cancelled 中的一个',
        'any.required': '状态是必需的'
      })
  }),

  category: Joi.object({
    category: Joi.string()
      .valid('electronics', 'clothing', 'books', 'home', 'sports', 'toys')
      .required()
      .messages({
        'any.only': '分类必须是: electronics, clothing, books, home, sports, toys 中的一个',
        'any.required': '分类是必需的'
      })
  })
};

module.exports = {
  validate,
  userSchemas,
  productSchemas,
  orderSchemas,
  querySchemas,
  paramSchemas
};
