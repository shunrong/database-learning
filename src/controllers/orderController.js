const Order = require('../models/Order');
const Product = require('../models/Product');
const { prisma } = require('../config/database');
const cacheService = require('../services/cacheService');

// 订单控制器 (MySQL 原生查询)
class OrderController {
  // 创建订单
  async createOrder(req, res) {
    try {
      const { userId, productId, quantity, shippingAddress, notes } = req.body;

      // 验证用户是否存在 (Prisma)
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 验证产品是否存在并获取价格 (MongoDB)
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: '产品不存在'
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: '库存不足'
        });
      }

      // 计算总价
      const unitPrice = product.price;
      const totalPrice = unitPrice * quantity;

      // 创建订单 (MySQL)
      const order = await Order.create({
        userId: parseInt(userId),
        productId,
        quantity,
        unitPrice,
        totalPrice,
        shippingAddress,
        notes
      });

      // 更新产品库存 (MongoDB)
      await product.updateStock(-quantity);

      // 清除相关缓存
      await cacheService.delPattern('orders:*');
      await cacheService.del(`product:${productId}`);

      // 增加订单计数器 (Redis)
      await cacheService.incr('orders:total:count');

      res.status(201).json({
        success: true,
        message: '订单创建成功',
        data: order
      });
    } catch (error) {
      console.error('创建订单失败:', error);
      res.status(500).json({
        success: false,
        message: '创建订单失败',
        error: error.message
      });
    }
  }

  // 获取订单列表
  async getOrders(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const cacheKey = `orders:list:page:${page}:limit:${limit}`;
      
      // 尝试从缓存获取
      let result = await cacheService.get(cacheKey);
      
      if (!result) {
        // 从数据库获取
        const orders = await Order.findAll(limit, offset);
        
        // 获取总数 (这里简化处理，实际项目中应该有单独的计数方法)
        const totalOrders = await cacheService.get('orders:total:count') || 0;

        result = {
          orders,
          pagination: {
            current: page,
            pages: Math.ceil(totalOrders / limit),
            total: totalOrders,
            limit
          }
        };

        // 缓存3分钟
        await cacheService.set(cacheKey, result, 180);
      }

      res.json({
        success: true,
        message: '获取订单列表成功',
        data: result
      });
    } catch (error) {
      console.error('获取订单列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取订单列表失败',
        error: error.message
      });
    }
  }

  // 根据ID获取订单
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const orderId = parseInt(id);

      const cacheKey = `order:${orderId}`;
      
      // 尝试从缓存获取
      let orderData = await cacheService.get(cacheKey);
      
      if (!orderData) {
        // 从数据库获取订单
        const order = await Order.findById(orderId);
        
        if (!order) {
          return res.status(404).json({
            success: false,
            message: '订单不存在'
          });
        }

        // 获取用户信息 (Prisma)
        const user = await prisma.user.findUnique({
          where: { id: order.userId },
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true
          }
        });

        // 获取产品信息 (MongoDB)
        const product = await Product.findById(order.productId);

        orderData = {
          ...order,
          user,
          product: product ? {
            id: product._id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            price: product.price
          } : null
        };

        // 缓存10分钟
        await cacheService.set(cacheKey, orderData, 600);
      }

      res.json({
        success: true,
        message: '获取订单信息成功',
        data: orderData
      });
    } catch (error) {
      console.error('获取订单信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取订单信息失败',
        error: error.message
      });
    }
  }

  // 根据用户ID获取订单
  async getOrdersByUserId(req, res) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const cacheKey = `orders:user:${userId}:page:${page}:limit:${limit}`;
      
      // 尝试从缓存获取
      let result = await cacheService.get(cacheKey);
      
      if (!result) {
        // 验证用户是否存在
        const user = await prisma.user.findUnique({
          where: { id: parseInt(userId) }
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: '用户不存在'
          });
        }

        // 获取用户订单
        const orders = await Order.findByUserId(parseInt(userId), limit, offset);

        result = {
          orders,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          },
          pagination: {
            current: page,
            limit
          }
        };

        // 缓存5分钟
        await cacheService.set(cacheKey, result, 300);
      }

      res.json({
        success: true,
        message: '获取用户订单成功',
        data: result
      });
    } catch (error) {
      console.error('获取用户订单失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户订单失败',
        error: error.message
      });
    }
  }

  // 根据状态获取订单
  async getOrdersByStatus(req, res) {
    try {
      const { status } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // 验证状态值
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的订单状态'
        });
      }

      const cacheKey = `orders:status:${status}:page:${page}:limit:${limit}`;
      
      // 尝试从缓存获取
      let result = await cacheService.get(cacheKey);
      
      if (!result) {
        const orders = await Order.findByStatus(status, limit, offset);

        result = {
          orders,
          status,
          pagination: {
            current: page,
            limit
          }
        };

        // 缓存3分钟
        await cacheService.set(cacheKey, result, 180);
      }

      res.json({
        success: true,
        message: `获取${status}状态订单成功`,
        data: result
      });
    } catch (error) {
      console.error('获取状态订单失败:', error);
      res.status(500).json({
        success: false,
        message: '获取状态订单失败',
        error: error.message
      });
    }
  }

  // 更新订单状态
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const orderId = parseInt(id);

      // 验证状态值
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的订单状态'
        });
      }

      // 更新订单状态
      const success = await Order.updateStatus(orderId, status, notes);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: '订单不存在或更新失败'
        });
      }

      // 清除相关缓存
      await cacheService.del(`order:${orderId}`);
      await cacheService.delPattern('orders:*');

      // 如果订单被取消，恢复库存
      if (status === 'cancelled') {
        const order = await Order.findById(orderId);
        if (order) {
          const product = await Product.findById(order.productId);
          if (product) {
            await product.updateStock(order.quantity);
            await cacheService.del(`product:${order.productId}`);
          }
        }
      }

      res.json({
        success: true,
        message: '订单状态更新成功'
      });
    } catch (error) {
      console.error('更新订单状态失败:', error);
      res.status(500).json({
        success: false,
        message: '更新订单状态失败',
        error: error.message
      });
    }
  }

  // 删除订单
  async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      const orderId = parseInt(id);

      // 获取订单信息用于恢复库存
      const order = await Order.findById(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      // 删除订单
      const success = await Order.deleteById(orderId);

      if (!success) {
        return res.status(500).json({
          success: false,
          message: '删除订单失败'
        });
      }

      // 恢复产品库存
      const product = await Product.findById(order.productId);
      if (product) {
        await product.updateStock(order.quantity);
        await cacheService.del(`product:${order.productId}`);
      }

      // 清除相关缓存
      await cacheService.del(`order:${orderId}`);
      await cacheService.delPattern('orders:*');

      // 减少订单计数器
      await cacheService.decr('orders:total:count');

      res.json({
        success: true,
        message: '订单删除成功'
      });
    } catch (error) {
      console.error('删除订单失败:', error);
      res.status(500).json({
        success: false,
        message: '删除订单失败',
        error: error.message
      });
    }
  }

  // 获取订单统计
  async getOrderStats(req, res) {
    try {
      const cacheKey = 'orders:stats';
      
      // 尝试从缓存获取
      let stats = await cacheService.get(cacheKey);
      
      if (!stats) {
        // 从数据库获取统计信息
        stats = await Order.getStats();

        // 缓存15分钟
        await cacheService.set(cacheKey, stats, 900);
      }

      res.json({
        success: true,
        message: '获取订单统计成功',
        data: stats
      });
    } catch (error) {
      console.error('获取订单统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取订单统计失败',
        error: error.message
      });
    }
  }

  // 批量更新订单状态
  async bulkUpdateOrderStatus(req, res) {
    try {
      const { orderIds, status, notes } = req.body;

      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的订单ID数组'
        });
      }

      // 验证状态值
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的订单状态'
        });
      }

      const results = [];
      for (const orderId of orderIds) {
        try {
          const success = await Order.updateStatus(parseInt(orderId), status, notes);
          results.push({ orderId, success });
          
          // 清除单个订单缓存
          await cacheService.del(`order:${orderId}`);
        } catch (error) {
          results.push({ orderId, success: false, error: error.message });
        }
      }

      // 清除列表缓存
      await cacheService.delPattern('orders:*');

      const successCount = results.filter(r => r.success).length;

      res.json({
        success: true,
        message: `批量更新完成，成功更新${successCount}个订单`,
        data: {
          total: orderIds.length,
          success: successCount,
          failed: orderIds.length - successCount,
          results
        }
      });
    } catch (error) {
      console.error('批量更新订单状态失败:', error);
      res.status(500).json({
        success: false,
        message: '批量更新订单状态失败',
        error: error.message
      });
    }
  }
}

module.exports = new OrderController();
