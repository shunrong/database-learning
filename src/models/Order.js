const { mysqlPool } = require('../config/database');

// 订单模型 (MySQL 原生查询)
class Order {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.productId = data.product_id;
    this.quantity = data.quantity;
    this.unitPrice = data.unit_price;
    this.totalPrice = data.total_price;
    this.status = data.status;
    this.orderDate = data.order_date;
    this.shippingAddress = data.shipping_address;
    this.notes = data.notes;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // 创建订单表
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id VARCHAR(100) NOT NULL COMMENT 'MongoDB Product ID',
        quantity INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        shipping_address TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_order_date (order_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    try {
      await mysqlPool.execute(query);
      console.log('✅ Orders表创建成功');
    } catch (error) {
      console.error('❌ 创建Orders表失败:', error);
      throw error;
    }
  }

  // 创建新订单
  static async create(orderData) {
    const query = `
      INSERT INTO orders (user_id, product_id, quantity, unit_price, total_price, status, shipping_address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      orderData.userId,
      orderData.productId,
      orderData.quantity,
      orderData.unitPrice,
      orderData.totalPrice,
      orderData.status || 'pending',
      orderData.shippingAddress,
      orderData.notes
    ];

    try {
      const [result] = await mysqlPool.execute(query, values);
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('❌ 创建订单失败:', error);
      throw error;
    }
  }

  // 根据ID查找订单
  static async findById(id) {
    const query = 'SELECT * FROM orders WHERE id = ?';
    
    try {
      const [rows] = await mysqlPool.execute(query, [id]);
      return rows.length > 0 ? new Order(rows[0]) : null;
    } catch (error) {
      console.error('❌ 查找订单失败:', error);
      throw error;
    }
  }

  // 获取所有订单
  static async findAll(limit = 50, offset = 0) {
    const query = `
      SELECT * FROM orders 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    try {
      const [rows] = await mysqlPool.execute(query, [limit, offset]);
      return rows.map(row => new Order(row));
    } catch (error) {
      console.error('❌ 获取订单列表失败:', error);
      throw error;
    }
  }

  // 根据用户ID查找订单
  static async findByUserId(userId, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM orders 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    try {
      const [rows] = await mysqlPool.execute(query, [userId, limit, offset]);
      return rows.map(row => new Order(row));
    } catch (error) {
      console.error('❌ 查找用户订单失败:', error);
      throw error;
    }
  }

  // 根据状态查找订单
  static async findByStatus(status, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM orders 
      WHERE status = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    try {
      const [rows] = await mysqlPool.execute(query, [status, limit, offset]);
      return rows.map(row => new Order(row));
    } catch (error) {
      console.error('❌ 按状态查找订单失败:', error);
      throw error;
    }
  }

  // 更新订单状态
  static async updateStatus(id, status, notes = null) {
    const query = `
      UPDATE orders 
      SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    try {
      const [result] = await mysqlPool.execute(query, [status, notes, id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ 更新订单状态失败:', error);
      throw error;
    }
  }

  // 删除订单
  static async deleteById(id) {
    const query = 'DELETE FROM orders WHERE id = ?';
    
    try {
      const [result] = await mysqlPool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ 删除订单失败:', error);
      throw error;
    }
  }

  // 获取订单统计信息
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        SUM(total_price) as total_revenue,
        AVG(total_price) as avg_order_value
      FROM orders
    `;
    
    try {
      const [rows] = await mysqlPool.execute(query);
      return rows[0];
    } catch (error) {
      console.error('❌ 获取订单统计失败:', error);
      throw error;
    }
  }

  // 实例方法：更新当前订单
  async update(updateData) {
    const fields = [];
    const values = [];
    
    // 动态构建更新字段
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) {
      throw new Error('没有提供更新数据');
    }
    
    values.push(this.id);
    const query = `UPDATE orders SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    try {
      const [result] = await mysqlPool.execute(query, values);
      if (result.affectedRows > 0) {
        // 重新加载数据
        const updatedOrder = await Order.findById(this.id);
        Object.assign(this, updatedOrder);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ 更新订单失败:', error);
      throw error;
    }
  }
}

module.exports = Order;
