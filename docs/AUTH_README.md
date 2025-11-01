# 认证与权限系统文档中心

## 📚 文档导航

本项目的认证与权限系统包含以下相关文档：

### 1. **AUTH_PERMISSION_ANALYSIS.md** - 完整系统分析报告
   - 当前系统架构详解
   - 认证流程（JWT + BCrypt）
   - 权限系统（4级RBAC）
   - 审核工作流（3态模型）
   - 与v3计划的差异对比
   - 安全性评估和建议
   - **推荐首先阅读**

### 2. **AUTH_SYSTEM_SUMMARY.md** - 快速参考摘要
   - 关键组件一览表
   - v3计划与现实的核心差异
   - 优先级建议
   - 文件导航
   - 快速测试清单
   - **适合快速查找**

### 3. **PERMISSION_IMPLEMENTATION_DETAILS.md** - 技术深潜
   - 权限检查流程图
   - 权限依赖详解
   - 代码实现细节
   - JWT令牌结构
   - 日志记录示例
   - 常见权限模式
   - **适合开发参考**

---

## 🏗️ 系统架构概览

### 认证层（Authentication）
```
用户输入 → 密码验证(BCrypt) → JWT令牌生成 → 客户端存储 → 后续请求验证
```

### 权限层（Authorization）
```
请求 → Token验证 → 用户查询 → 角色检查 → 所有权检查 → 资源访问
```

### 审核层（Review Workflow）
```
创建(pending) → 批准(approved) → 发布 | 拒绝(rejected)
```

---

## ⚡ 快速开始

### 查看当前系统
1. 打开 `AUTH_SYSTEM_SUMMARY.md` 查看状态表
2. 对比v3计划的差异
3. 了解关键安全问题

### 实现新功能
1. 参考 `PERMISSION_IMPLEMENTATION_DETAILS.md` 的"常见权限检查模式"
2. 查看文件导航中的相关代码位置
3. 按照检查清单实现权限检查

### 调试权限问题
1. 查看 `PERMISSION_IMPLEMENTATION_DETAILS.md` 的权限检查流程图
2. 参考"常见权限检查模式"
3. 使用日志记录示例排查问题

---

## 📊 关键数据结构

### 用户模型（User）
```
id              - 整数主键
username        - 昵称（支持中文，唯一）
email           - 邮箱（唯一）
hashed_password - BCrypt哈希密码
role            - guest/user/admin/super_admin
is_active       - 激活状态
status          - active/inactive/banned
avatar          - 头像URL
created_at      - 创建时间
last_login      - 最后登录时间
```

### JWT令牌内容
```json
{
  "sub": "username",      // Subject - 用户标识
  "exp": 1730578967       // Expiration - 过期时间戳
}
```

### 审核日志（AdminLog）
```
action          - APPROVE/REJECT/DELETE/BAN/ROLE_CHANGE等
resource_type   - ARTICLE/USER/SCHEDULE等
resource_id     - 被操作资源的ID
operator_id     - 操作者用户ID
operator_role   - 操作者角色
description     - 人类可读描述
details         - JSON详细信息
ip_address      - 操作者IP
created_at      - 操作时间
```

---

## 🔐 安全检查清单

### 部署前必检
- [ ] 超级管理员凭证已修改（非root/123456）
- [ ] JWT密钥已修改（非默认值）
- [ ] 启用HTTPS（防止token在传输中泄露）
- [ ] 配置速率限制（防暴力破解）
- [ ] 邮箱验证已启用（防虚假账户）
- [ ] 密码强度已设置

### 定期审查
- [ ] 查看管理员日志（异常操作检测）
- [ ] 审查用户账户（删除无效账户）
- [ ] 检查权限分配（最小权限原则）
- [ ] 更新依赖包（安全补丁）

---

## 🛠️ 常见任务

### 创建新管理员
1. 在数据库中插入user记录，role='admin'
2. 或调用 `POST /api/auth/register` 注册后，超管手动修改角色

### 重置超级管理员
1. 调用 `POST /api/auth/init-super-admin`（仅首次成功）
2. 或直接修改数据库中的user记录

### 调整权限规则
1. 编辑 `/backend/app/core/permissions.py`
2. 修改 `can_publish_category()` 等函数
3. 重启后端服务

### 查看操作日志
1. 访问 `GET /api/admin/logs`（需要ADMIN权限）
2. 支持筛选：按操作类型、资源类型、操作者、日期范围

### 审核待批准内容
1. 访问 `GET /api/admin/reviews/`
2. 列表展示所有待审核内容
3. 调用 `POST /api/admin/reviews/{type}/{id}/approve` 批准
4. 或调用 `POST /api/admin/reviews/{type}/{id}/reject` 拒绝

---

## 🚀 后续改进计划

### Phase 1: 安全加固（建议立即实施）
- [ ] 刷新令牌机制
- [ ] httpOnly cookie存储
- [ ] 密码强度验证
- [ ] API速率限制
- [ ] 邮箱验证强制

### Phase 2: 工作流完善（本月内）
- [ ] 添加draft状态
- [ ] 分离is_published和review_status
- [ ] 实现submit_for_review操作
- [ ] 审核中编辑能力

### Phase 3: v3迁移（Q2）
- [ ] Strapi框架迁移
- [ ] Mantine UI开发
- [ ] 数据迁移脚本
- [ ] 新工作流测试

更详细内容参见 `AUTH_PERMISSION_ANALYSIS.md` 第13-14章

---

## 📞 相关文件速查

### 后端认证核心
| 文件 | 功能 |
|------|------|
| `backend/app/core/security.py` | JWT和密码哈希逻辑 |
| `backend/app/core/permissions.py` | RBAC和权限检查函数 |
| `backend/app/core/dependencies.py` | 认证依赖注入 |
| `backend/app/models/roles.py` | 角色枚举定义 |
| `backend/app/models/user_db.py` | 用户数据模型 |

### 后端API路由
| 文件 | 功能 |
|------|------|
| `backend/app/routers/auth.py` | 登录/注册/认证端点 |
| `backend/app/routers/admin.py` | 管理员管理端点 |
| `backend/app/routers/reviews.py` | 内容审核端点 |

### 前端认证
| 文件 | 功能 |
|------|------|
| `frontend/src/contexts/AuthContext.tsx` | 认证状态管理 |
| `frontend/src/components/admin/AdminLogin.tsx` | 登录界面 |
| `frontend/src/components/admin/ProtectedRoute.tsx` | 路由保护 |
| `frontend/src/components/admin/NewAdminLayout.tsx` | 后台菜单导航 |

### 数据库表
| 表名 | 功能 |
|------|------|
| `users` | 用户信息 |
| `admin_logs` | 管理员操作日志 |
| `articles` | 含review_status等字段 |
| `videos` | 含review_status等字段 |
| `schedules` | 含review_status等字段 |
| `photo_groups` | 含review_status等字段 |

---

## 📖 API参考

### 认证端点
```
POST   /api/auth/register              - 用户注册
POST   /api/auth/login                 - 用户登录
GET    /api/auth/me                    - 获取当前用户
POST   /api/auth/init-super-admin      - 初始化超级管理员
```

### 管理员端点
```
GET    /api/admin/articles             - 获取所有文章
GET    /api/admin/users                - 获取所有用户
PUT    /api/admin/users/{id}/role      - 修改用户角色
PUT    /api/admin/users/{id}/ban       - 禁用用户
GET    /api/admin/logs                 - 获取操作日志
```

### 审核端点
```
GET    /api/admin/reviews/             - 获取待审核列表
POST   /api/admin/reviews/{type}/{id}/approve  - 批准内容
POST   /api/admin/reviews/{type}/{id}/reject   - 拒绝内容
```

详见 `AUTH_PERMISSION_ANALYSIS.md` 第10章

---

## 💡 开发建议

1. **理解权限层级**: 在修改权限规则前，必须理解4级角色层级
2. **检查依赖注入**: 使用 `Depends()` 声明权限要求，勿在函数内检查
3. **记录所有操作**: 所有admin操作都应记录到admin_logs
4. **单一职责**: 权限检查逻辑应独立于业务逻辑
5. **前后端一致**: 前端UI和后端权限规则必须保持同步

---

## ❓ 常见问题

**Q: 如何修改密码？**
A: 当前系统不支持，需要在Phase 3添加

**Q: token过期后怎么办？**
A: 用户被迫重新登录。建议实现刷新令牌机制

**Q: 如何重置超级管理员？**
A: 调用 `/api/auth/init-super-admin` 或直接修改数据库

**Q: 可以给用户多个角色吗？**
A: 不能，当前设计仅支持单一角色

**Q: localStorage中的token安全吗？**
A: 不安全，容易遭受XSS攻击。建议迁移到httpOnly cookie

---

**最后更新**: 2025-11-01
**文档版本**: 1.0
**维护者**: 开发团队
