# 📊 权限系统实现 - 计划总结

## 🎯 核心目标

实现您在 BACKEND_V3_PLAN.md 中定义的 4 级权限模型：

```
游客 (GUEST)  →  用户 (USER)  →  管理员 (ADMIN)  →  超管 (SUPER_ADMIN)
只读前台       创建/编辑自己的   审核/管理内容      全部权限
```

---

## 🔑 关键特性

### 1. 内容生命周期
```
draft(草稿) → pending(审核) → approved(通过) + published(已发布)
    ↑                ↓
    └── rejected(拒绝，含原因)
```

### 2. 权限矩阵速查

| 操作 | 游客 | 用户 | 管理员 | 超管 |
|------|------|------|--------|------|
| 创建内容 | ❌ | ✅ | ✅ | ✅ |
| 编辑自己的草稿 | ❌ | ✅ | ✅ | ✅ |
| 编辑他人内容(任意状态) | ❌ | ❌ | ✅ | ✅ |
| 提交审核 | ❌ | ✅ | ✅ | ✅ |
| 批准内容 | ❌ | ❌ | ✅ | ✅ |
| 拒绝内容 | ❌ | ❌ | ✅ | ✅ |
| 删除自己的草稿 | ❌ | ✅ | ✅ | ✅ |
| 删除他人内容 | ❌ | ❌ | ❌ | ✅ |
| 删除用户 | ❌ | ❌ | ❌ | ✅ |

---

## 📋 分阶段实现计划

### Phase 1: 数据库改动 (1-2天)
**关键修改**:
- 添加 `status` 字段 (draft/pending/approved/rejected)
- 添加 `created_by_id` 字段 (内容作者)
- 添加 `rejection_reason` 字段 (拒绝原因)
- 添加 `submit_time`, `reviewed_at` 字段

**文件**:
```
backend/migrations/
  ├── 001_add_status_field.sql
  ├── 002_add_created_by.sql
  └── 003_add_review_fields.sql
```

### Phase 2: 后端权限逻辑 (2-3天)
**核心文件**:
```
backend/app/core/permissions.py
  ├── can_create(content_type, user)
  ├── can_edit_content(content, user)
  ├── can_delete_content(content, user)
  ├── can_review(user)
  └── can_manage_users(user)

backend/app/routers/articles.py (所有内容路由)
  ├── POST /articles (创建)
  ├── PUT /articles/{id} (编辑)
  ├── DELETE /articles/{id} (删除)
  ├── POST /articles/{id}/submit-for-review (提交审核)
  └── GET /articles/my-content (我的内容)

backend/app/routers/reviews.py
  ├── GET /admin/reviews/pending (待审核列表)
  ├── POST /admin/reviews/{id}/approve (批准)
  ├── POST /admin/reviews/{id}/reject (拒绝)
  └── GET /admin/reviews/history (审核历史)

backend/app/routers/admin.py (用户管理)
  ├── GET /admin/users
  ├── POST /admin/users/{id}/ban
  ├── POST /admin/users/{id}/unban
  ├── PUT /admin/users/{id}/role
  └── DELETE /admin/users/{id}
```

### Phase 3: 前端适配 (2-3天)
**核心文件**:
```
frontend/src/contexts/AuthContext.tsx
  ├── 添加 user.role 字段
  └── 添加权限检查方法 (can.edit, can.delete 等)

frontend/src/components/admin/pages/
  ├── ArticleEdit.tsx (更新状态显示和按钮)
  ├── ReviewPanel.tsx (审核面板 - 新建)
  ├── UserManagement.tsx (用户管理 - 新建)
  └── ReviewHistory.tsx (审核历史 - 新建)

frontend/src/components/ui/
  └── StatusBadge.tsx (状态显示器 - 新建)
```

### Phase 4: 测试和验证 (1-2天)
**覆盖范围**:
- ✅ 单元测试: 权限检查函数 (15个测试用例)
- ✅ 集成测试: 完整工作流 (8个场景)
- ✅ E2E测试: 前端交互 (10个用户故事)
- ✅ 权限矩阵验证: 32个检查点

### Phase 5: 文档 (1天)
**文件**:
```
docs/
  ├── PERMISSIONS.md (权限参考)
  ├── ADMIN_GUIDE.md (管理员指南)
  └── USER_GUIDE.md (用户指南)
```

---

## 🔄 当前状态 vs 目标状态

### 当前实现
❌ 无草稿状态
❌ 无提交审核操作
❌ 审核时无法编辑
❌ 管理员可编辑他人内容（权限太宽泛）
❌ 无法拒绝并要求修改

### 目标实现
✅ 完整的draft→pending→approved流程
✅ 用户可提交审核
✅ 审核中ADMIN可编辑
✅ 权限矩阵明确限制
✅ 拒绝含修改意见

---

## 📊 工作量估计

| Phase | 任务 | 工作量 | 难度 |
|-------|------|--------|------|
| 1 | 数据库改动 | 4-6小时 | ⭐ |
| 2 | 权限逻辑 | 8-12小时 | ⭐⭐ |
| 2 | API端点 | 8-12小时 | ⭐⭐ |
| 3 | 前端适配 | 8-10小时 | ⭐⭐ |
| 4 | 测试 | 6-8小时 | ⭐⭐⭐ |
| 5 | 文档 | 4-6小时 | ⭐ |
| **总计** | **完整系统** | **40-50小时** | **中等** |

---

## ✨ 好处

### 对用户
- ✅ 可以保存草稿多次修改
- ✅ 知道内容状态（待审核/已发布/被拒）
- ✅ 拒绝时收到具体意见
- ✅ 明确了贡献流程

### 对管理员
- ✅ 集中的审核面板
- ✅ 可以边审核边编辑
- ✅ 完整的审核历史
- ✅ 清晰的权限边界

### 对系统
- ✅ 明确的权限检查，无遗漏
- ✅ 完整的审计日志
- ✅ 内容生命周期明确
- ✅ 易于维护和扩展

---

## 🚨 关键检查点

实现过程中必须验证：

- [ ] 游客无法访问任何管理页面
- [ ] 用户无法看到他人草稿
- [ ] 用户无法删除已提交的内容
- [ ] 管理员可以编辑他人的pending内容
- [ ] 管理员无法删除他人的approved内容
- [ ] 超管可以删除任意内容
- [ ] 拒绝操作必须包含原因
- [ ] 所有审核操作都有日志记录
- [ ] 权限检查在API和前端两端都有
- [ ] 状态转换不能跳过中间状态

---

## 📖 相关文档

- **详细计划**: [PERMISSION_IMPLEMENTATION_PLAN.md](./PERMISSION_IMPLEMENTATION_PLAN.md) ← 完整步骤
- **系统分析**: [docs/AUTH_SYSTEM_SUMMARY.md](./docs/AUTH_SYSTEM_SUMMARY.md) ← 当前状态
- **完整分析**: [docs/AUTH_PERMISSION_ANALYSIS.md](./docs/AUTH_PERMISSION_ANALYSIS.md) ← 技术细节

---

## ✅ 下一步

1. **审批计划** - 确认这个计划是否符合您的需求
2. **确定优先级** - 如果时间有限，可以分阶段实现
3. **开始Phase 1** - 数据库改动
4. **持续验证** - 每个phase完成后验证

---

**状态**: 📋 计划已制定，等待您的批准
**文档**: 详见 [PERMISSION_IMPLEMENTATION_PLAN.md](./PERMISSION_IMPLEMENTATION_PLAN.md)
