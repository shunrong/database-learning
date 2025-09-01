const mongoose = require('mongoose');

// 产品Schema (MongoDB + Mongoose)
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '产品名称是必需的'],
    trim: true,
    maxlength: [100, '产品名称不能超过100个字符']
  },
  description: {
    type: String,
    required: [true, '产品描述是必需的'],
    maxlength: [500, '产品描述不能超过500个字符']
  },
  price: {
    type: Number,
    required: [true, '价格是必需的'],
    min: [0, '价格不能为负数']
  },
  category: {
    type: String,
    required: false,
    enum: ['electronics', 'clothing', 'books', 'home', 'sports', 'toys'],
    default: null
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [50, '品牌名称不能超过50个字符']
  },
  sku: {
    type: String,
    required: [true, 'SKU是必需的'],
    unique: true,
    trim: true,
    uppercase: true
  },
  stock: {
    type: Number,
    required: [true, '库存数量是必需的'],
    min: [0, '库存不能为负数'],
    default: 0
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(v);
      },
      message: '请提供有效的图片URL'
    }
  }],
  specifications: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    color: String,
    material: String
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // 自动管理 createdAt 和 updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：计算是否有库存
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// 虚拟字段：格式化价格
productSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toFixed(2)}`;
});

// 索引优化
productSchema.index({ name: 'text', description: 'text' }); // 全文搜索
productSchema.index({ category: 1, price: 1 }); // 分类和价格组合索引
productSchema.index({ sku: 1 }, { unique: true }); // SKU唯一索引
productSchema.index({ createdAt: -1 }); // 创建时间降序索引

// 中间件：更新时间戳
productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 静态方法：按分类查找产品
productSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ createdAt: -1 });
};

// 实例方法：更新库存
productSchema.methods.updateStock = function(quantity) {
  this.stock += quantity;
  if (this.stock < 0) {
    this.stock = 0;
  }
  return this.save();
};

// 实例方法：添加评分
productSchema.methods.addRating = function(newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
