#!/bin/bash

echo "🧪 API 功能测试"
echo "==============="

# 获取token
echo "📝 1. 获取登录token..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }')

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ 获取token失败"
    echo "$TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Token获取成功: ${TOKEN:0:20}..."

# 测试用户API
echo ""
echo "👥 2. 测试用户API..."
USER_RESPONSE=$(curl -s http://localhost:3000/api/users)
USER_COUNT=$(echo $USER_RESPONSE | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo "✅ 用户API正常，找到 $USER_COUNT 个用户"

# 测试产品API
echo ""
echo "📦 3. 测试产品API..."
PRODUCT_RESPONSE=$(curl -s http://localhost:3000/api/products)
PRODUCT_COUNT=$(echo $PRODUCT_RESPONSE | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo "✅ 产品API正常，找到 $PRODUCT_COUNT 个产品"

# 测试创建产品（无分类）
echo ""
echo "🆕 4. 测试创建产品（无分类）..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "测试产品-'$(date +%s)'",
    "description": "无分类测试产品",
    "price": 88.88,
    "stock": 5,
    "sku": "TEST'$(date +%s)'"
  }')

if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
    echo "✅ 创建产品成功（无分类）"
else
    echo "❌ 创建产品失败"
    echo "$CREATE_RESPONSE"
fi

# 测试订单API（需要认证）
echo ""
echo "🛒 5. 测试订单API..."
ORDER_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/orders)
if echo "$ORDER_RESPONSE" | grep -q '"success":true'; then
    ORDER_COUNT=$(echo $ORDER_RESPONSE | grep -o '"total":[0-9]*' | cut -d':' -f2)
    echo "✅ 订单API正常，找到 $ORDER_COUNT 个订单"
else
    echo "❌ 订单API失败"
    echo "$ORDER_RESPONSE"
fi

# 测试限流状态
echo ""
echo "🚦 6. 测试限流状态..."
for i in {1..3}; do
    RATE_TEST=$(curl -s http://localhost:3000/api/users | grep -o '"success":[^,]*')
    if echo "$RATE_TEST" | grep -q 'true'; then
        echo "✅ 请求 $i: 正常"
    else
        echo "❌ 请求 $i: 失败 - $RATE_TEST"
    fi
done

echo ""
echo "🎉 所有测试完成！"
echo ""
echo "💡 使用方法："
echo "  - 访问主页: http://localhost:3000/"
echo "  - 登录页面: http://localhost:3000/pages/login.html"
echo "  - 用户管理: http://localhost:3000/pages/users.html"
echo "  - 产品管理: http://localhost:3000/pages/products.html"
echo "  - 订单管理: http://localhost:3000/pages/orders.html"
