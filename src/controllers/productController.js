const Product = require('../models/Product');
const cacheService = require('../services/cacheService');

// 产品控制器 (MongoDB + Mongoose ORM)
class ProductController {
  // 创建产品
  async createProduct(req, res) {
    try {
      const productData = req.body;

      // 创建产品
      const product = new Product(productData);
      await product.save();

      // 清除产品列表缓存
      await cacheService.delPattern('products:*');

      res.status(201).json({
        success: true,
        message: '产品创建成功',
        data: product
      });
    } catch (error) {
      console.error('创建产品失败:', error);
      
      // 处理验证错误
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors
        });
      }

      // 处理重复键错误
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'SKU已存在'
        });
      }

      res.status(500).json({
        success: false,
        message: '创建产品失败',
        error: error.message
      });
    }
  }

  // 获取产品列表
  async getProducts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const category = req.query.category;
      const search = req.query.search;
      const status = req.query.status;
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

      const skip = (page - 1) * limit;

      // 构建查询条件
      const query = {};
      
      // 状态过滤：如果没有指定状态，默认只显示活跃产品
      if (status && status.trim() !== '') {
        if (status === 'published') {
          query.isActive = true;
        } else if (status === 'draft') {
          query.isActive = false;
        }
        // 如果是其他状态值，不添加 isActive 过滤（显示所有）
      } else {
        query.isActive = true; // 默认只显示活跃产品
      }
      
      // 只有当 category 存在且不为空字符串时才添加分类过滤
      if (category && category.trim() !== '') {
        query.category = category;
      }

      if (search) {
        query.$text = { $search: search };
      }

      // 构建缓存键
      const cacheKey = `products:list:page:${page}:limit:${limit}:category:${category || 'all'}:search:${search || 'none'}:status:${status || 'default'}:sort:${sortBy}:${sortOrder}`;
      
      // 尝试从缓存获取
      let result = await cacheService.get(cacheKey);
      
      if (!result) {
        // 构建排序对象
        const sort = {};
        sort[sortBy] = sortOrder;

        // 从数据库获取
        const [products, total] = await Promise.all([
          Product.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(), // 提高性能
          Product.countDocuments(query)
        ]);

        result = {
          products,
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
        message: '获取产品列表成功',
        data: result
      });
    } catch (error) {
      console.error('获取产品列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取产品列表失败',
        error: error.message
      });
    }
  }

  // 根据ID获取产品
  async getProductById(req, res) {
    try {
      const { id } = req.params;

      const cacheKey = `product:${id}`;
      
      // 尝试从缓存获取
      let product = await cacheService.get(cacheKey);
      
      if (!product) {
        // 从数据库获取
        product = await Product.findById(id);

        if (product) {
          // 缓存10分钟
          await cacheService.set(cacheKey, product, 600);
        }
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: '产品不存在'
        });
      }

      res.json({
        success: true,
        message: '获取产品信息成功',
        data: product
      });
    } catch (error) {
      console.error('获取产品信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取产品信息失败',
        error: error.message
      });
    }
  }

  // 根据分类获取产品
  async getProductsByCategory(req, res) {
    try {
      const { category } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const cacheKey = `products:category:${category}:page:${page}:limit:${limit}`;
      
      // 尝试从缓存获取
      let result = await cacheService.get(cacheKey);
      
      if (!result) {
        // 使用静态方法
        const products = await Product.findByCategory(category);
        
        // 手动分页
        const total = products.length;
        const skip = (page - 1) * limit;
        const paginatedProducts = products.slice(skip, skip + limit);

        result = {
          products: paginatedProducts,
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
        message: `获取${category}分类产品成功`,
        data: result
      });
    } catch (error) {
      console.error('获取分类产品失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分类产品失败',
        error: error.message
      });
    }
  }

  // 更新产品
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 更新产品
      const product = await Product.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true, // 返回更新后的文档
          runValidators: true // 运行验证器
        }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: '产品不存在'
        });
      }

      // 清除相关缓存
      await cacheService.del(`product:${id}`);
      await cacheService.delPattern('products:*');

      res.json({
        success: true,
        message: '产品更新成功',
        data: product
      });
    } catch (error) {
      console.error('更新产品失败:', error);
      
      // 处理验证错误
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors
        });
      }

      res.status(500).json({
        success: false,
        message: '更新产品失败',
        error: error.message
      });
    }
  }

  // 更新产品库存
  async updateProductStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: '产品不存在'
        });
      }

      // 使用实例方法更新库存
      await product.updateStock(quantity);

      // 清除相关缓存
      await cacheService.del(`product:${id}`);
      await cacheService.delPattern('products:*');

      res.json({
        success: true,
        message: '库存更新成功',
        data: {
          id: product._id,
          sku: product.sku,
          name: product.name,
          stock: product.stock,
          inStock: product.inStock
        }
      });
    } catch (error) {
      console.error('更新产品库存失败:', error);
      res.status(500).json({
        success: false,
        message: '更新产品库存失败',
        error: error.message
      });
    }
  }

  // 添加产品评分
  async addProductRating(req, res) {
    try {
      const { id } = req.params;
      const { rating } = req.body;

      // 验证评分范围
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: '评分必须在1-5之间'
        });
      }

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: '产品不存在'
        });
      }

      // 使用实例方法添加评分
      await product.addRating(rating);

      // 清除相关缓存
      await cacheService.del(`product:${id}`);
      await cacheService.delPattern('products:*');

      res.json({
        success: true,
        message: '评分添加成功',
        data: {
          id: product._id,
          name: product.name,
          rating: product.rating
        }
      });
    } catch (error) {
      console.error('添加产品评分失败:', error);
      res.status(500).json({
        success: false,
        message: '添加产品评分失败',
        error: error.message
      });
    }
  }

  // 删除产品
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findByIdAndDelete(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: '产品不存在'
        });
      }

      // 清除相关缓存
      await cacheService.del(`product:${id}`);
      await cacheService.delPattern('products:*');

      res.json({
        success: true,
        message: '产品删除成功'
      });
    } catch (error) {
      console.error('删除产品失败:', error);
      res.status(500).json({
        success: false,
        message: '删除产品失败',
        error: error.message
      });
    }
  }

  // 获取产品统计
  async getProductStats(req, res) {
    try {
      const cacheKey = 'products:stats';
      
      // 尝试从缓存获取
      let stats = await cacheService.get(cacheKey);
      
      if (!stats) {
        // 使用聚合管道获取统计信息
        const [
          totalProducts,
          activeProducts,
          categoryStats,
          stockStats
        ] = await Promise.all([
          Product.countDocuments(),
          Product.countDocuments({ isActive: true }),
          Product.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ]),
          Product.aggregate([
            {
              $group: {
                _id: null,
                totalStock: { $sum: '$stock' },
                averagePrice: { $avg: '$price' },
                outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } }
              }
            }
          ])
        ]);

        stats = {
          totalProducts,
          activeProducts,
          inactiveProducts: totalProducts - activeProducts,
          categoryBreakdown: categoryStats,
          stockInfo: stockStats[0] || {
            totalStock: 0,
            averagePrice: 0,
            outOfStock: 0
          }
        };

        // 缓存15分钟
        await cacheService.set(cacheKey, stats, 900);
      }

      res.json({
        success: true,
        message: '获取产品统计成功',
        data: stats
      });
    } catch (error) {
      console.error('获取产品统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取产品统计失败',
        error: error.message
      });
    }
  }

  // 搜索产品
  async searchProducts(req, res) {
    try {
      const { q, category, minPrice, maxPrice } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // 构建搜索条件
      const searchConditions = { isActive: true };

      if (q) {
        searchConditions.$text = { $search: q };
      }

      // 只有当 category 存在且不为空字符串时才添加分类过滤
      if (category && category.trim() !== '') {
        searchConditions.category = category;
      }

      if (minPrice || maxPrice) {
        searchConditions.price = {};
        if (minPrice) searchConditions.price.$gte = parseFloat(minPrice);
        if (maxPrice) searchConditions.price.$lte = parseFloat(maxPrice);
      }

      const cacheKey = `products:search:${JSON.stringify(searchConditions)}:page:${page}:limit:${limit}`;
      
      // 尝试从缓存获取
      let result = await cacheService.get(cacheKey);
      
      if (!result) {
        const [products, total] = await Promise.all([
          Product.find(searchConditions)
            .sort({ score: { $meta: 'textScore' } }) // 文本搜索相关性排序
            .skip(skip)
            .limit(limit)
            .lean(),
          Product.countDocuments(searchConditions)
        ]);

        result = {
          products,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total,
            limit
          },
          searchQuery: { q, category, minPrice, maxPrice }
        };

        // 缓存3分钟
        await cacheService.set(cacheKey, result, 180);
      }

      res.json({
        success: true,
        message: '产品搜索成功',
        data: result
      });
    } catch (error) {
      console.error('产品搜索失败:', error);
      res.status(500).json({
        success: false,
        message: '产品搜索失败',
        error: error.message
      });
    }
  }

  // 获取产品分类列表
  async getCategories(req, res) {
    try {
      const cacheKey = 'products:categories';
      
      // 尝试从缓存获取
      let categories = await cacheService.get(cacheKey);
      
      if (!categories) {
        // 从数据库获取所有使用的分类
        const categoryData = await Product.aggregate([
          { $match: { isActive: true, category: { $ne: null } } },
          { 
            $group: { 
              _id: '$category', 
              count: { $sum: 1 },
              name: { $first: '$category' }
            } 
          },
          { $sort: { count: -1 } },
          {
            $project: {
              _id: 0,
              id: '$_id',
              name: '$name',
              count: 1
            }
          }
        ]);

        // 添加中文显示名称
        const categoryMap = {
          'electronics': '电子产品',
          'clothing': '服装',
          'books': '图书',
          'home': '家居',
          'sports': '运动',
          'toys': '玩具'
        };

        categories = categoryData.map(cat => ({
          ...cat,
          displayName: categoryMap[cat.id] || cat.name
        }));

        // 缓存30分钟
        await cacheService.set(cacheKey, categories, 1800);
      }

      res.json({
        success: true,
        message: '获取产品分类成功',
        data: categories
      });
    } catch (error) {
      console.error('获取产品分类失败:', error);
      res.status(500).json({
        success: false,
        message: '获取产品分类失败',
        error: error.message
      });
    }
  }
}

module.exports = new ProductController();
