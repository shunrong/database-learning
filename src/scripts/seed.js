const { connectDatabases, closeDatabases, prisma } = require('../config/database');
const Product = require('../models/Product');
const Order = require('../models/Order');
const cacheService = require('../services/cacheService');
const bcrypt = require('bcryptjs');

// 示例数据
const sampleUsers = [
  {
    email: 'admin@example.com',
    username: 'admin',
    password: 'admin123',
    firstName: '管理员',
    lastName: '系统',
    bio: '系统管理员账户，负责平台的整体管理和维护。'
  },
  {
    email: 'john.doe@example.com',
    username: 'johndoe',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    bio: '热爱科技的软件开发者，专注于全栈开发和数据库设计。'
  },
  {
    email: 'jane.smith@example.com',
    username: 'janesmith',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Smith',
    bio: '产品经理，关注用户体验和产品创新。'
  },
  {
    email: 'mike.wilson@example.com',
    username: 'mikewilson',
    password: 'password123',
    firstName: 'Mike',
    lastName: 'Wilson',
    bio: '数据分析师，专长数据挖掘和机器学习。'
  },
  {
    email: 'sarah.brown@example.com',
    username: 'sarahbrown',
    password: 'password123',
    firstName: 'Sarah',
    lastName: 'Brown',
    bio: '设计师，专注于UI/UX设计和用户研究。'
  }
];

const sampleCategories = [
  {
    name: '电子产品',
    description: '各类电子设备和数码产品',
    slug: 'electronics',
    color: '#3B82F6'
  },
  {
    name: '服装鞋帽',
    description: '时尚服装和配饰',
    slug: 'clothing',
    color: '#EF4444'
  },
  {
    name: '图书文具',
    description: '书籍、文具和办公用品',
    slug: 'books',
    color: '#10B981'
  },
  {
    name: '家居用品',
    description: '家具和家居装饰',
    slug: 'home',
    color: '#F59E0B'
  },
  {
    name: '运动健身',
    description: '运动器材和健身用品',
    slug: 'sports',
    color: '#8B5CF6'
  },
  {
    name: '玩具游戏',
    description: '儿童玩具和游戏产品',
    slug: 'toys',
    color: '#EC4899'
  }
];

const sampleTags = [
  { name: '热销', slug: 'hot-sale', color: '#FF6B6B' },
  { name: '新品', slug: 'new-arrival', color: '#4ECDC4' },
  { name: '促销', slug: 'promotion', color: '#FFE66D' },
  { name: '推荐', slug: 'recommended', color: '#A8E6CF' },
  { name: '限量', slug: 'limited', color: '#FF8B94' },
  { name: '精选', slug: 'featured', color: '#B4A7D6' },
  { name: '环保', slug: 'eco-friendly', color: '#C7CEDB' },
  { name: '智能', slug: 'smart', color: '#FFEAA7' }
];

const sampleArticles = [
  {
    title: '数据库设计最佳实践',
    content: '本文介绍了数据库设计的最佳实践，包括规范化、索引优化、性能调优等关键概念...',
    excerpt: '深入探讨数据库设计的核心原则和实践方法',
    slug: 'database-design-best-practices',
    published: true
  },
  {
    title: 'MongoDB vs MySQL：如何选择',
    content: '比较MongoDB和MySQL的优缺点，帮助开发者选择最适合的数据库解决方案...',
    excerpt: '详细对比两种数据库的特点和适用场景',
    slug: 'mongodb-vs-mysql-comparison',
    published: true
  },
  {
    title: 'Redis缓存策略详解',
    content: '介绍Redis在实际项目中的缓存策略，包括缓存模式、过期策略、性能优化等...',
    excerpt: '全面解析Redis缓存的实现和优化技巧',
    slug: 'redis-caching-strategies',
    published: true
  }
];

const sampleProducts = [
  {
    name: 'iPhone 15 Pro',
    description: '苹果最新款智能手机，配备A17 Pro芯片，支持5G网络',
    price: 7999.00,
    category: 'electronics',
    brand: 'Apple',
    sku: 'IPHONE15PRO128',
    stock: 50,
    images: [
      'https://example.com/iphone15pro-1.jpg',
      'https://example.com/iphone15pro-2.jpg'
    ],
    specifications: {
      weight: 187,
      dimensions: { length: 146.6, width: 70.6, height: 8.25 },
      color: '天然钛金属',
      material: '钛金属边框'
    },
    tags: ['热销', '新品', '智能']
  },
  {
    name: 'MacBook Pro 14英寸',
    description: '专业笔记本电脑，搭载M3 Pro芯片，适合开发和创意工作',
    price: 14999.00,
    category: 'electronics',
    brand: 'Apple',
    sku: 'MBP14M3PRO512',
    stock: 25,
    images: [
      'https://example.com/macbookpro14-1.jpg',
      'https://example.com/macbookpro14-2.jpg'
    ],
    specifications: {
      weight: 1600,
      dimensions: { length: 312.6, width: 221.2, height: 15.5 },
      color: '深空灰色',
      material: '铝合金'
    },
    tags: ['推荐', '专业']
  },
  {
    name: '小米13 Ultra',
    description: '旗舰级摄影手机，徕卡光学系统，1英寸大底传感器',
    price: 5999.00,
    category: 'electronics',
    brand: '小米',
    sku: 'MI13ULTRA256',
    stock: 80,
    images: [
      'https://example.com/mi13ultra-1.jpg',
      'https://example.com/mi13ultra-2.jpg'
    ],
    specifications: {
      weight: 227,
      dimensions: { length: 163.18, width: 74.64, height: 9.06 },
      color: '黑色',
      material: '陶瓷背板'
    },
    tags: ['热销', '摄影']
  },
  {
    name: 'Nike Air Max 270',
    description: '时尚运动鞋，Max Air缓震技术，舒适透气',
    price: 899.00,
    category: 'clothing',
    brand: 'Nike',
    sku: 'NIKE270BLK42',
    stock: 120,
    specifications: {
      color: '黑白配色',
      material: '网眼布料+橡胶大底'
    },
    tags: ['运动', '舒适']
  },
  {
    name: '《深入理解计算机系统》',
    description: '计算机科学经典教材，深入讲解系统底层原理',
    price: 139.00,
    category: 'books',
    brand: '机械工业出版社',
    sku: 'CSAPP3RDCN',
    stock: 200,
    specifications: {
      weight: 800,
      material: '纸质'
    },
    tags: ['经典', '学习']
  },
  {
    name: '宜家北欧风餐桌',
    description: '简约现代设计，实木材质，适合4-6人使用',
    price: 1299.00,
    category: 'home',
    brand: '宜家',
    sku: 'IKEA6PSEAT',
    stock: 15,
    specifications: {
      weight: 25000,
      dimensions: { length: 150, width: 75, height: 74 },
      color: '原木色',
      material: '实木'
    },
    tags: ['家具', '环保']
  }
];

// 数据库初始化函数
const initializeDatabase = async () => {
  try {
    console.log('🚀 开始数据库初始化...');
    
    // 连接数据库
    await connectDatabases();
    
    // 1. 创建MySQL订单表
    console.log('📋 创建MySQL订单表...');
    await Order.createTable();
    
    // 2. 清理现有数据
    console.log('🧹 清理现有数据...');
    await prisma.articleTag.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await Product.deleteMany({});
    
    // 清理Redis缓存
    await cacheService.flushAll();
    
    // 3. 创建用户数据 (Prisma)
    console.log('👥 创建用户数据...');
    const users = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        }
      });
      users.push(user);
    }
    console.log(`✅ 已创建 ${users.length} 个用户`);
    
    // 4. 创建分类数据 (Prisma)
    console.log('📂 创建分类数据...');
    const categories = [];
    for (const categoryData of sampleCategories) {
      const category = await prisma.category.create({
        data: categoryData
      });
      categories.push(category);
    }
    console.log(`✅ 已创建 ${categories.length} 个分类`);
    
    // 5. 创建标签数据 (Prisma)
    console.log('🏷️  创建标签数据...');
    const tags = [];
    for (const tagData of sampleTags) {
      const tag = await prisma.tag.create({
        data: tagData
      });
      tags.push(tag);
    }
    console.log(`✅ 已创建 ${tags.length} 个标签`);
    
    // 6. 创建文章数据 (Prisma)
    console.log('📝 创建文章数据...');
    const articles = [];
    for (let i = 0; i < sampleArticles.length; i++) {
      const articleData = sampleArticles[i];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      const article = await prisma.article.create({
        data: {
          ...articleData,
          authorId: randomUser.id,
          categoryId: randomCategory.id,
          publishedAt: articleData.published ? new Date() : null,
          views: Math.floor(Math.random() * 1000),
          likes: Math.floor(Math.random() * 100)
        }
      });
      
      // 随机关联标签
      const randomTags = tags.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
      for (const tag of randomTags) {
        await prisma.articleTag.create({
          data: {
            articleId: article.id,
            tagId: tag.id
          }
        });
      }
      
      articles.push(article);
    }
    console.log(`✅ 已创建 ${articles.length} 篇文章`);
    
    // 7. 创建产品数据 (MongoDB)
    console.log('📦 创建产品数据...');
    const products = [];
    for (const productData of sampleProducts) {
      const product = new Product(productData);
      await product.save();
      products.push(product);
    }
    console.log(`✅ 已创建 ${products.length} 个产品`);
    
    // 8. 创建订单数据 (MySQL)
    console.log('📋 创建订单数据...');
    const orders = [];
    for (let i = 0; i < 20; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const statuses = ['pending', 'processing', 'shipped', 'delivered'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      const orderData = {
        userId: randomUser.id,
        productId: randomProduct._id.toString(),
        quantity,
        unitPrice: randomProduct.price,
        totalPrice: randomProduct.price * quantity,
        status: randomStatus,
        shippingAddress: `示例地址 ${i + 1}号，某某城市，某某区`,
        notes: Math.random() > 0.5 ? `订单备注 ${i + 1}` : null
      };
      
      const order = await Order.create(orderData);
      orders.push(order);
    }
    console.log(`✅ 已创建 ${orders.length} 个订单`);
    
    // 9. 初始化Redis缓存
    console.log('💾 初始化Redis缓存...');
    
    // 设置一些基础计数器
    await cacheService.set('users:total:count', users.length);
    await cacheService.set('products:total:count', products.length);
    await cacheService.set('orders:total:count', orders.length);
    
    // 缓存一些热门数据
    await cacheService.set('featured:products', products.slice(0, 3), 3600);
    await cacheService.set('recent:articles', articles, 1800);
    
    console.log('✅ Redis缓存初始化完成');
    
    // 10. 显示初始化结果
    console.log('');
    console.log('🎉 数据库初始化完成！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 数据统计:');
    console.log(`  👥 用户: ${users.length} 个`);
    console.log(`  📂 分类: ${categories.length} 个`);
    console.log(`  🏷️  标签: ${tags.length} 个`);
    console.log(`  📝 文章: ${articles.length} 篇`);
    console.log(`  📦 产品: ${products.length} 个`);
    console.log(`  📋 订单: ${orders.length} 个`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🔑 默认账户:');
    console.log('  📧 邮箱: admin@example.com');
    console.log('  🔒 密码: admin123');
    console.log('');
    console.log('🌐 可以开始测试API了:');
    console.log('  curl http://localhost:3000/api/health');
    console.log('  curl http://localhost:3000/api/users');
    console.log('  curl http://localhost:3000/api/products');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
};

// 清理数据库函数
const cleanDatabase = async () => {
  try {
    console.log('🧹 开始清理数据库...');
    
    await connectDatabases();
    
    // 清理 Prisma 数据
    await prisma.articleTag.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    
    // 清理 MongoDB 数据
    await Product.deleteMany({});
    
    // 清理 MySQL 数据 (删除表)
    const { mysqlPool } = require('../config/database');
    await mysqlPool.execute('DROP TABLE IF EXISTS orders');
    
    // 清理 Redis 缓存
    await cacheService.flushAll();
    
    console.log('✅ 数据库清理完成');
    
  } catch (error) {
    console.error('❌ 数据库清理失败:', error);
    throw error;
  }
};

// 主函数
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'clean':
        await cleanDatabase();
        break;
      case 'seed':
      default:
        await initializeDatabase();
        break;
    }
  } catch (error) {
    console.error('❌ 操作失败:', error);
    process.exit(1);
  } finally {
    await closeDatabases();
    process.exit(0);
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  initializeDatabase,
  cleanDatabase
};
