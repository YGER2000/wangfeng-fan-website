# 认证与权限系统 - 快速摘要

## 当前状态一览表

### 认证系统
| 方面 | 实现状态 | 备注 |
|------|---------|------|
| JWT令牌 | ✅ | BCrypt + Bearer Token |
| 令牌过期 | ⚠️ | 15分钟硬编码，无刷新机制 |
| 存储方式 | ⚠️ | localStorage（XSS风险） |
| 刷新令牌 | ❌ | 令牌过期无法续期 |
| 会话管理 | ❌ | 无服务器端追踪 |

### 权限系统
| 方面 | 实现状态 | 详情 |
|------|---------|------|
| 4级RBAC | ✅ | GUEST → USER → ADMIN → SUPER_ADMIN |
| 权限检查 | ✅ | 有依赖函数和装饰器 |
| 分类权限 | ✅ | 3个分类各自权限规则 |
| 所有权检查 | ✅ | 作者可编辑/删除自己的 |
| 多级权限 | ❌ | 仅二级（作者/管理员） |

### 审核系统
| 方面 | 实现状态 | 详情 |
|------|---------|------|
| 审核状态 | ✅ | 3态: pending/approved/rejected |
| 审核操作 | ✅ | 批准/拒绝端点完整 |
| 多内容类型 | ✅ | 文章/视频/行程/图片 |
| 草稿状态 | ❌ | 缺失 |
| 审核中编辑 | ❌ | 审核中无法编辑 |
| 发布分离 | ❌ | approved自动发布 |
| 多级审核 | ❌ | 仅单审核人员 |

### 用户管理
| 方面 | 实现状态 | 详情 |
|------|---------|------|
| 用户注册 | ✅ | 公开端点 |
| 用户登录 | ✅ | 用户名/密码 |
| 超管初始化 | ✅ | root/123456 |
| 角色管理 | ⚠️ | 仅超管可修改 |
| 用户禁用 | ✅ | BAN/UNBAN操作 |
| 密码重置 | ❌ | 无恢复机制 |
| 邮箱验证 | ⚠️ | 验证系统存在但未强制 |

### 审计日志
| 方面 | 实现状态 | 详情 |
|------|---------|------|
| 日志记录 | ✅ | 管理员操作完整记录 |
| 日志查询 | ✅ | 支持多维度筛选 |
| 操作类型 | ✅ | APPROVE/REJECT/DELETE/BAN等 |
| 用户操作 | ❌ | 创建/编辑操作未记录 |
| IP追踪 | ✅ | IP地址记录 |

---

## v3计划 vs 当前实现的核心差异

### 工作流状态对比

**当前实现**：
```
创建 → pending（待审核）
           ↓
       approved（通过）→ 自动发布
           ↓
       rejected（拒绝）
```

**v3计划**：
```
draft（草稿）→ pending（已提交）
    ↑               ↓
    ├← rejected（拒绝，含修改意见）
    └─ approved（通过）→ published（已发布）
```

### 权限矩阵对比

| 操作 | 当前:USER | 当前:ADMIN | v3:USER | v3:ADMIN |
|------|---------|---------|---------|---------|
| 创建 | ✅ | ✅ | ✅ | ✅ |
| 草稿编辑 | ❌ | ❌ | ✅ | ✅ |
| 提交审核 | ❌ | ❌ | ✅ | ✅ |
| 审核中编辑 | ❌ | ❌ | ❌ | ✅ |
| 批准内容 | ❌ | ✅ | ❌ | ✅ |
| 拒绝内容 | ❌ | ✅ | ❌ | ✅ |
| 发布内容 | ❌ | ❌ | ❌ | ✅ |
| 删除自己的 | ✅ | ✅ | ✅ | ✅ |
| 删除他人的 | ❌ | ❌ | ❌ | ❌ |
| 删除任意 | ❌ | ❌ | ❌ | ✅ |

---

## 关键安全问题

### 高优先级
1. **无刷新令牌** - 令牌过期后无法续期，用户被强制登出
2. **localStorage存储** - XSS攻击可获取所有令牌
3. **无密码强度要求** - 允许弱密码
4. **无速率限制** - 暴力破解风险

### 中优先级
5. **无邮箱验证** - 允许虚假邮箱注册
6. **无密码重置** - 用户无法恢复账户
7. **默认超管凭证** - root/123456容易被猜测
8. **无2FA** - 单因素认证不够安全

### 低优先级
9. **无会话追踪** - 无法查看用户活跃会话
10. **无登录锁定** - 多次失败登录无限制

---

## 实现优先级建议

### Phase 1: 安全加固（立即处理）
- [ ] 添加刷新令牌机制
- [ ] 移动token到httpOnly cookie
- [ ] 添加密码强度验证
- [ ] 实现API速率限制

### Phase 2: 工作流完善（本月内）
- [ ] 添加draft状态
- [ ] 分离is_published和review_status
- [ ] 实现submit_for_review操作
- [ ] 添加审核中编辑能力

### Phase 3: 用户体验改进（月内）
- [ ] 邮箱验证强制执行
- [ ] 密码重置功能
- [ ] 登录失败锁定
- [ ] 会话管理UI

### Phase 4: v3迁移（Q2）
- [ ] Strapi环境建立
- [ ] 内容类型建模
- [ ] 权限配置
- [ ] 数据迁移脚本
- [ ] Mantine UI开发

---

## 文件导航

### 后端认证核心
- `/backend/app/core/security.py` - JWT/密码逻辑
- `/backend/app/core/permissions.py` - 权限检查
- `/backend/app/core/dependencies.py` - 认证装饰器
- `/backend/app/routers/auth.py` - 登录/注册API

### 后端内容管理
- `/backend/app/routers/reviews.py` - 统一审核API
- `/backend/app/routers/admin.py` - 管理员API
- `/backend/app/models/article.py` - 文章模型+审核字段
- `/backend/app/models/schedule_db.py` - 行程+审核

### 前端认证
- `/frontend/src/contexts/AuthContext.tsx` - Auth状态（70行关键逻辑）
- `/frontend/src/components/admin/AdminLogin.tsx` - 登录界面
- `/frontend/src/components/admin/ProtectedRoute.tsx` - 路由保护
- `/frontend/src/components/admin/NewAdminLayout.tsx` - 菜单导航

### 数据库
- `users` 表 - 用户信息（12字段）
- `admin_logs` 表 - 操作日志（13字段）
- `articles` 表 - 含review_status, reviewer_id等
- `videos`、`schedules`、`photo_groups` - 同样字段

---

## 快速测试清单

### 认证
- [ ] 注册新用户（默认role=user）
- [ ] 用户登录（获得token）
- [ ] Token过期后尝试访问（应失败）
- [ ] 超管初始化（root/123456）

### 权限
- [ ] USER尝试查看admin页面（应拒绝）
- [ ] ADMIN查看所有用户列表（应成功）
- [ ] USER尝试删除他人文章（应拒绝）
- [ ] SUPER_ADMIN删除任意文章（应成功）

### 审核
- [ ] 创建文章→自动pending
- [ ] Admin批准→自动发布
- [ ] Admin拒绝+备注→文章变rejected
- [ ] 查看审核日志（应有操作记录）

### 日志
- [ ] 执行批准操作→日志中出现
- [ ] 禁用用户→日志中出现BAN操作
- [ ] 过滤日志（按操作者、资源类型）

---

**完整分析报告**: `/docs/AUTH_PERMISSION_ANALYSIS.md`
**最后更新**: 2025-11-01
