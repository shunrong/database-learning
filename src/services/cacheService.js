const { redisClient } = require('../config/database');

// Redis 缓存服务
class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 默认过期时间：1小时
  }

  // 设置缓存
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await redisClient.setEx(key, ttl, serializedValue);
      } else {
        await redisClient.set(key, serializedValue);
      }
      console.log(`✅ 缓存设置成功: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ 设置缓存失败 ${key}:`, error);
      return false;
    }
  }

  // 获取缓存
  async get(key) {
    try {
      const value = await redisClient.get(key);
      if (value === null) {
        console.log(`ℹ️ 缓存未命中: ${key}`);
        return null;
      }
      console.log(`✅ 缓存命中: ${key}`);
      return JSON.parse(value);
    } catch (error) {
      console.error(`❌ 获取缓存失败 ${key}:`, error);
      return null;
    }
  }

  // 删除缓存
  async del(key) {
    try {
      const result = await redisClient.del(key);
      console.log(`✅ 缓存删除${result > 0 ? '成功' : '失败'}: ${key}`);
      return result > 0;
    } catch (error) {
      console.error(`❌ 删除缓存失败 ${key}:`, error);
      return false;
    }
  }

  // 批量删除缓存（按模式）
  async delPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        const result = await redisClient.del(keys);
        console.log(`✅ 批量删除缓存成功: ${result} 个键`);
        return result;
      }
      return 0;
    } catch (error) {
      console.error(`❌ 批量删除缓存失败 ${pattern}:`, error);
      return 0;
    }
  }

  // 检查键是否存在
  async exists(key) {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`❌ 检查缓存存在性失败 ${key}:`, error);
      return false;
    }
  }

  // 设置过期时间
  async expire(key, ttl) {
    try {
      const result = await redisClient.expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error(`❌ 设置过期时间失败 ${key}:`, error);
      return false;
    }
  }

  // 获取剩余过期时间
  async ttl(key) {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      console.error(`❌ 获取过期时间失败 ${key}:`, error);
      return -1;
    }
  }

  // Hash 操作 - 设置哈希字段
  async hset(key, field, value, ttl = this.defaultTTL) {
    try {
      const serializedValue = JSON.stringify(value);
      await redisClient.hSet(key, field, serializedValue);
      if (ttl) {
        await redisClient.expire(key, ttl);
      }
      console.log(`✅ Hash设置成功: ${key}.${field}`);
      return true;
    } catch (error) {
      console.error(`❌ Hash设置失败 ${key}.${field}:`, error);
      return false;
    }
  }

  // Hash 操作 - 获取哈希字段
  async hget(key, field) {
    try {
      const value = await redisClient.hGet(key, field);
      if (value === null) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error(`❌ Hash获取失败 ${key}.${field}:`, error);
      return null;
    }
  }

  // Hash 操作 - 获取所有哈希字段
  async hgetall(key) {
    try {
      const hash = await redisClient.hGetAll(key);
      const result = {};
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      return result;
    } catch (error) {
      console.error(`❌ Hash获取所有字段失败 ${key}:`, error);
      return {};
    }
  }

  // Hash 操作 - 删除哈希字段
  async hdel(key, field) {
    try {
      const result = await redisClient.hDel(key, field);
      return result > 0;
    } catch (error) {
      console.error(`❌ Hash删除字段失败 ${key}.${field}:`, error);
      return false;
    }
  }

  // List 操作 - 左侧推入
  async lpush(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      const result = await redisClient.lPush(key, serializedValue);
      console.log(`✅ List左推入成功: ${key}`);
      return result;
    } catch (error) {
      console.error(`❌ List左推入失败 ${key}:`, error);
      return 0;
    }
  }

  // List 操作 - 右侧推入
  async rpush(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      const result = await redisClient.rPush(key, serializedValue);
      console.log(`✅ List右推入成功: ${key}`);
      return result;
    } catch (error) {
      console.error(`❌ List右推入失败 ${key}:`, error);
      return 0;
    }
  }

  // List 操作 - 左侧弹出
  async lpop(key) {
    try {
      const value = await redisClient.lPop(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error(`❌ List左弹出失败 ${key}:`, error);
      return null;
    }
  }

  // List 操作 - 获取范围
  async lrange(key, start = 0, stop = -1) {
    try {
      const values = await redisClient.lRange(key, start, stop);
      return values.map(value => {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      });
    } catch (error) {
      console.error(`❌ List范围获取失败 ${key}:`, error);
      return [];
    }
  }

  // Set 操作 - 添加成员
  async sadd(key, member) {
    try {
      const serializedMember = JSON.stringify(member);
      const result = await redisClient.sAdd(key, serializedMember);
      return result > 0;
    } catch (error) {
      console.error(`❌ Set添加成员失败 ${key}:`, error);
      return false;
    }
  }

  // Set 操作 - 获取所有成员
  async smembers(key) {
    try {
      const members = await redisClient.sMembers(key);
      return members.map(member => {
        try {
          return JSON.parse(member);
        } catch {
          return member;
        }
      });
    } catch (error) {
      console.error(`❌ Set获取成员失败 ${key}:`, error);
      return [];
    }
  }

  // 计数器操作 - 递增
  async incr(key, value = 1) {
    try {
      const result = await redisClient.incrBy(key, value);
      console.log(`✅ 计数器递增成功: ${key} = ${result}`);
      return result;
    } catch (error) {
      console.error(`❌ 计数器递增失败 ${key}:`, error);
      return 0;
    }
  }

  // 计数器操作 - 递减
  async decr(key, value = 1) {
    try {
      const result = await redisClient.decrBy(key, value);
      console.log(`✅ 计数器递减成功: ${key} = ${result}`);
      return result;
    } catch (error) {
      console.error(`❌ 计数器递减失败 ${key}:`, error);
      return 0;
    }
  }

  // 会话管理 - 设置用户会话
  async setUserSession(userId, sessionData, ttl = 86400) { // 24小时
    const key = `session:user:${userId}`;
    return await this.set(key, sessionData, ttl);
  }

  // 会话管理 - 获取用户会话
  async getUserSession(userId) {
    const key = `session:user:${userId}`;
    return await this.get(key);
  }

  // 会话管理 - 删除用户会话
  async deleteUserSession(userId) {
    const key = `session:user:${userId}`;
    return await this.del(key);
  }

  // 限流 - 检查并更新限制
  async checkRateLimit(identifier, limit = 100, window = 3600) {
    // 清理 identifier，移除无效字符
    const cleanIdentifier = String(identifier).replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `rate_limit:${cleanIdentifier}`;
    
    try {
      console.log(`🔍 限流检查: key=${key}, limit=${limit}, window=${window}`);
      
      const current = await redisClient.get(key);
      if (current === null) {
        // 第一次访问，设置初始值
        await redisClient.setEx(key, window, '1');
        console.log(`✅ 限流初始化: ${key} = 1`);
        return { allowed: true, remaining: limit - 1, resetTime: Date.now() + window * 1000 };
      }
      
      const count = parseInt(current, 10);
      if (isNaN(count)) {
        console.warn(`⚠️ 限流计数器值无效: ${current}, 重置为1`);
        await redisClient.setEx(key, window, '1');
        return { allowed: true, remaining: limit - 1, resetTime: Date.now() + window * 1000 };
      }
      
      if (count >= limit) {
        const ttl = await redisClient.ttl(key);
        console.log(`🚫 限流触发: ${key}, count=${count}, limit=${limit}`);
        return { 
          allowed: false, 
          remaining: 0, 
          resetTime: Date.now() + ttl * 1000 
        };
      }
      
      // 增加计数器
      const newCount = await redisClient.incr(key);
      const ttl = await redisClient.ttl(key);
      console.log(`✅ 限流通过: ${key}, count=${newCount}, remaining=${limit - newCount}`);
      
      return { 
        allowed: true, 
        remaining: Math.max(0, limit - newCount), 
        resetTime: Date.now() + ttl * 1000 
      };
    } catch (error) {
      console.error(`❌ 限流检查失败 ${cleanIdentifier}:`, error);
      // 发生错误时允许请求通过
      return { allowed: true, remaining: limit, resetTime: Date.now() + window * 1000 };
    }
  }

  // 获取 Redis 信息
  async getInfo() {
    try {
      const info = await redisClient.info();
      return info;
    } catch (error) {
      console.error('❌ 获取Redis信息失败:', error);
      return null;
    }
  }

  // 清空所有缓存
  async flushAll() {
    try {
      await redisClient.flushAll();
      console.log('✅ 清空所有缓存成功');
      return true;
    } catch (error) {
      console.error('❌ 清空缓存失败:', error);
      return false;
    }
  }
}

module.exports = new CacheService();
