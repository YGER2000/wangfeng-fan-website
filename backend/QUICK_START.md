# 管理后台系统 - 快速开始指南

## 1. 运行数据库迁移

```bash
cd /Users/yger/WithFaith/wangfeng-fan-website/backend
mysql -u root -p wangfeng_fan_website < migrations/001_add_admin_features.sql
```

## 2. 启动后端服务

```bash
cd /Users/yger/WithFaith/wangfeng-fan-website/backend
python3 run.py
```

服务将运行在: http://localhost:1994

## 3. 查看API文档

访问: http://localhost:1994/docs

## 4. 创建管理员账号

### 方法1: 通过数据库
```sql
-- 连接到MySQL
mysql -u root -p wangfeng_fan_website

-- 创建超级管理员账号
INSERT INTO users (id, username, email, hashed_password, full_name, role, is_active, status, created_at, updated_at)
VALUES (
    UUID(),
    'admin',
    'admin@wangfeng.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5oGqXuWZzC/qW',
    '超级管理员',
    'super_admin',
    1,
    'active',
    NOW(),
    NOW()
);
```
密码: `admin123`

### 方法2: 修改现有用户
```sql
-- 将现有用户提升为超级管理员
UPDATE users 
SET role = 'super_admin', status = 'active', is_active = 1 
WHERE username = '你的用户名';
```

## 5. 获取访问令牌

### 使用 API 文档测试
1. 访问 http://localhost:1994/docs
2. 找到 `/api/auth/login` 端点
3. 点击 "Try it out"
4. 输入用户名和密码
5. 获取 access_token

### 使用 curl
```bash
curl -X POST "http://localhost:1994/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

## 6. 测试管理员接口

### 获取仪表盘统计
```bash
curl -X GET "http://localhost:1994/api/admin/dashboard/stats" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 获取用户列表
```bash
curl -X GET "http://localhost:1994/api/admin/users?skip=0&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 获取文章列表
```bash
curl -X GET "http://localhost:1994/api/admin/articles?skip=0&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 7. 常用管理操作

### 批准文章
```bash
curl -X PUT "http://localhost:1994/api/admin/articles/{article_id}/approve" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "review_notes": "审核通过"
  }'
```

### 拒绝文章
```bash
curl -X PUT "http://localhost:1994/api/admin/articles/{article_id}/reject" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "review_notes": "内容不符合规范，请修改"
  }'
```

### 封禁用户
```bash
curl -X PUT "http://localhost:1994/api/admin/users/{user_id}/ban" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "违反社区规定"
  }'
```

### 修改用户角色
```bash
curl -X PUT "http://localhost:1994/api/admin/users/{user_id}/role" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

## 8. 查看操作日志

```bash
curl -X GET "http://localhost:1994/api/admin/logs/recent?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 9. 常见问题

### Q: 如何重置管理员密码？
A: 直接在数据库中更新 hashed_password 字段，或者通过忘记密码流程（如果已实现）。

### Q: 为什么我没有权限访问某个接口？
A: 检查你的用户角色，某些操作需要 super_admin 权限。

### Q: 如何查看所有待审核的文章？
```bash
curl -X GET "http://localhost:1994/api/admin/articles?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Q: 如何查看某个管理员的所有操作记录？
```bash
curl -X GET "http://localhost:1994/api/admin/logs?operator_id={user_id}" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 10. API端点快速参考

### 仪表盘
- `GET /api/admin/dashboard/stats` - 统计数据
- `GET /api/admin/dashboard/charts` - 图表数据

### 文章管理
- `GET /api/admin/articles` - 文章列表
- `GET /api/admin/articles/{id}` - 文章详情
- `PUT /api/admin/articles/{id}/approve` - 批准
- `PUT /api/admin/articles/{id}/reject` - 拒绝
- `DELETE /api/admin/articles/{id}` - 删除

### 用户管理
- `GET /api/admin/users` - 用户列表
- `GET /api/admin/users/{id}` - 用户详情
- `PUT /api/admin/users/{id}/role` - 修改角色
- `PUT /api/admin/users/{id}/ban` - 封禁
- `PUT /api/admin/users/{id}/unban` - 解封

### 日志管理
- `GET /api/admin/logs` - 日志列表
- `GET /api/admin/logs/recent` - 最近日志
- `GET /api/admin/logs/count` - 日志总数

## 11. 更多文档

- 完整API文档: `/backend/ADMIN_SYSTEM.md`
- 实施总结: `/backend/IMPLEMENTATION_SUMMARY.md`
- 在线API文档: http://localhost:1994/docs

---

**祝使用愉快！**
