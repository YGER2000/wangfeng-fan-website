# 🎯 权限系统完整实现计划

**目标**: 实现您在 BACKEND_V3_PLAN.md 中定义的权限模型
**基于**: 现有系统分析（详见 `docs/AUTH_SYSTEM_SUMMARY.md`）
**时间表**: 严格阶段式交付

---

## 📋 权限模型明确定义

### 用户角色划分（4个等级）

#### 1️⃣ **游客 (GUEST/无登录)**
**权限**:
- ✅ 前台页面只读（浏览文章、视频、行程、图片）
- ✅ 可查看已发布内容 (published=true, review_status=approved)
- ❌ 无创建/编辑/删除权限
- ❌ 无法访问管理后台

**受影响页面**:
- 前台所有页面（ArticleDetailPage, VideoArchive, Gallery 等）- 无认证访问

#### 2️⃣ **用户 (USER/普通用户)**
**创建权限**:
- ✅ 可创建文章、视频、图组、标签
- ❌ 可创建新标签（tag 模式）
- ❌ 无法创建行程（仅管理员+超管）

**编辑权限**:
- ✅ 可编辑自己创建的内容（任何状态）
- ✅ 草稿状态下可编辑
- ❌ 无法编辑他人内容
- ❌ 无法编辑已发布内容（需要"撤回"然后重新编辑草稿）

#### 3️⃣ **管理员 (ADMIN)** [已更新]
**编辑权限**:
- ✅ 可编辑自己创建的内容（任何状态）
- ✅ **可编辑他人的内容，即使已发布** ← 新增
- ✅ 可随时修改任何内容（无状态限制）
- ❌ 无法编辑已拒绝的内容（仅作者可修改）

**提交权限**:
- ✅ 可将草稿提交审核 (`submit_for_review` 操作)
- ✅ 提交后进入 `pending` 状态
- ❌ 已提交审核后无法撤回

**删除权限**:
- ✅ 可删除自己创建的内容（仅草稿状态）
- ❌ 无法删除他人内容
- ❌ 无法删除已提交或已发布的内容

**访问权限**:
- ✅ 可访问个人管理后台（`/admin/user/*`）
- ✅ 可查看自己的内容列表和审核状态
- ❌ 无法访问全局管理功能
- ❌ 无法查看他人的内容

#### 3️⃣ **管理员 (ADMIN)**
**创建权限**:
- ✅ 可创建所有内容类型（文章、视频、图组、行程、标签）
- ✅ 创建的内容也需进入 `pending` 审核（同USER规则）

**编辑权限**:
- ✅ 可编辑自己创建的内容（任何状态）
- ✅ 可编辑他人内容 **仅当状态为 `pending`** 或 `draft`
- ❌ 无法编辑已批准/已发布的内容（需要内容作者先"撤回"）
- ✅ 可编辑拒绝的内容（含修改意见）

**审核权限** (核心职责):
- ✅ 可查看所有待审核内容 (pending)
- ✅ 可批准内容 (approve) → 状态变 `approved`
- ✅ 可拒绝内容 (reject) + 提供拒绝原因 → 状态变 `rejected`
- ✅ 拒绝后内容可供作者重新编辑后再提交
- ❌ 无法在发布后撤销审核

**发布权限**:
- ✅ 审核通过后自动发布（`is_published=true`）
- ❌ 无法单独发布内容（必须通过审核流程）

**删除权限**:
- ✅ 可删除自己创建的内容
- ❌ **无法删除他人内容**（关键！这是与超管的区别）
- ❌ 无法全局删除

**管理权限**:
- ✅ 可管理行程 (schedules) - CRUD
- ✅ 可管理标签和分类
- ✅ 可查看审核日志
- ✅ 可禁用/启用用户账户
- ❌ 无法删除用户账户
- ❌ 无法修改用户角色

**访问权限**:
- ✅ 可访问完整管理后台 (`/admin/*`)
- ✅ 可查看所有用户的内容（只读）
- ✅ 可查看审核面板
- ✅ 可查看操作日志

#### 4️⃣ **超级管理员 (SUPER_ADMIN)**
**全部权限**:
- ✅ 拥有所有权限（包括ADMIN的所有权限）
- ✅ 可删除任意内容（包括他人的、已发布的）
- ✅ 可修改任何用户的角色
- ✅ 可删除用户账户
- ✅ 可重置用户密码
- ✅ 可修改系统配置
- ✅ 可查看和导出所有日志
- ✅ 可批量操作

---

## 📊 权限矩阵 (完整清晰版)

### 内容操作权限

| 操作 | 游客 | 用户 | 管理员 | 超管 | 备注 |
|------|------|------|--------|------|------|
| **创建文章** | ❌ | ✅ | ✅ | ✅ | 创建后为draft |
| **编辑自己的草稿** | ❌ | ✅ | ✅ | ✅ | 状态=draft时可编辑 |
| **编辑他人草稿** | ❌ | ❌ | ✅ | ✅ | 仅ADMIN+ |
| **编辑他人pending** | ❌ | ❌ | ✅ | ✅ | 仅ADMIN+，审核时 |
| **编辑已发布的** | ❌ | ❌ | ✅ | ✅ | ADMIN+可随时编辑 |
| **提交审核** | ❌ | ✅ | ✅ | ✅ | draft→pending |
| **删除自己的draft** | ❌ | ✅ | ✅ | ✅ | 仅未提交的 |
| **删除自己的其他** | ❌ | ❌ | ❌ | ❌ | 不允许 |
| **删除他人的** | ❌ | ❌ | ❌ | ✅ | 仅SUPER_ADMIN |
| **删除用户账户** | ❌ | ❌ | ❌ | ✅ | 仅SUPER_ADMIN |

### 审核操作权限

| 操作 | 游客 | 用户 | 管理员 | 超管 | 备注 |
|------|------|------|--------|------|------|
| **查看待审核列表** | ❌ | ❌ | ✅ | ✅ | 管理员+ |
| **批准内容** | ❌ | ❌ | ✅ | ✅ | pending→approved |
| **拒绝内容** | ❌ | ❌ | ✅ | ✅ | 需要拒绝原因 |
| **修改拒绝原因** | ❌ | ❌ | ✅ | ✅ | 仅在rejected时 |
| **自动发布** | ❌ | ❌ | ✅ | ✅ | 批准时自动 |

### 用户管理权限

| 操作 | 游客 | 用户 | 管理员 | 超管 | 备注 |
|------|------|------|--------|------|------|
| **查看所有用户** | ❌ | ❌ | ✅ | ✅ | 只读 |
| **禁用用户** | ❌ | ❌ | ✅ | ✅ | BAN操作 |
| **启用用户** | ❌ | ❌ | ✅ | ✅ | UNBAN操作 |
| **修改用户角色** | ❌ | ❌ | ❌ | ✅ | 仅SUPER_ADMIN |
| **删除用户账户** | ❌ | ❌ | ❌ | ✅ | 仅SUPER_ADMIN |
| **重置用户密码** | ❌ | ❌ | ❌ | ✅ | 仅SUPER_ADMIN |

### 管理员功能权限

| 功能 | 游客 | 用户 | 管理员 | 超管 | 备注 |
|------|------|------|--------|------|------|
| **管理行程** | ❌ | ❌ | ✅ | ✅ | CRUD操作 |
| **管理标签** | ❌ | ❌ | ✅ | ✅ | CRUD操作 |
| **管理分类** | ❌ | ❌ | ✅ | ✅ | CRUD操作 |
| **查看审核日志** | ❌ | ❌ | ✅ | ✅ | 只读 |
| **修改系统配置** | ❌ | ❌ | ❌ | ✅ | 仅SUPER_ADMIN |
| **导出数据** | ❌ | ❌ | ❌ | ✅ | 仅SUPER_ADMIN |

---

## 🔄 内容工作流状态机

### 状态转换图

```
┌─────────────┐
│   draft     │  ← 初始状态（创建时）
└──────┬──────┘
       │
       ├─→ submit_for_review() ──→ ┌─────────────┐
       │                            │   pending   │
       │                            └──────┬──────┘
       │                                   │
       ├─ (编辑&保存)                  ┌───┴────────────┐
       │                             │                │
       │                        approve()           reject()
       │                             │                │
       │                             ▼                ▼
       │                     ┌──────────────┐   ┌──────────────┐
       │                     │  approved    │   │  rejected    │
       │                     │(自动发布)     │   │(含拒绝原因)  │
       │                     └──────────────┘   └──────┬───────┘
       │                                               │
       │                                          (用户编辑)
       │                                               │
       └───────────────────────────────────────────────┘
```

### 状态定义

| 状态 | 含义 | 谁可见 | 可执行操作 | 发布? |
|------|------|--------|---------|-------|
| **draft** | 草稿 | 仅作者+ADMIN+ | 编辑、删除、提交 | ❌ |
| **pending** | 等待审核 | 作者+ADMIN+ | 查看、等待(ADMIN编辑) | ❌ |
| **approved** | 已批准 | 所有人 | 查看(ADMIN+仅只读) | ✅ |
| **rejected** | 已拒绝 | 作者+ADMIN+ | 编辑、重新提交 | ❌ |

---

## 🛠️ 实现步骤 (分阶段)

### **Phase 1: 数据库改动** (1-2天)
**目标**: 完善数据模型支持新权限模型

#### Step 1.1: 修改内容表字段
**文件**:
- `backend/migrations/` (新建迁移脚本)
- `backend/app/models/article.py`、`video.py`、`photo_groups_db.py`

**操作**:
```sql
-- 所有内容表都添加以下字段（如果没有）
ALTER TABLE articles ADD COLUMN `status` ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft' AFTER `is_published`;
ALTER TABLE articles ADD COLUMN `submit_time` DATETIME NULL AFTER `status`;
ALTER TABLE articles ADD COLUMN `rejection_reason` TEXT NULL AFTER `submit_time`;
ALTER TABLE articles ADD COLUMN `reviewer_notes` TEXT NULL AFTER `rejection_reason`;
ALTER TABLE articles ADD COLUMN `submitted_by_id` INT NULL AFTER `reviewer_notes`;
ALTER TABLE articles ADD COLUMN `reviewed_at` DATETIME NULL AFTER `submitted_by_id`;

-- 同样改动: videos, photo_groups, schedules
```

**验证**:
- [ ] 所有内容表都有这些字段
- [ ] 迁移脚本可逆

#### Step 1.2: 添加作者关联
**文件**: `backend/app/models/`

**操作**:
- 添加 `created_by_id` 字段（指向users表）
- 添加 `created_at` 字段（创建时间）
- 添加索引优化查询

**SQL**:
```sql
ALTER TABLE articles ADD COLUMN `created_by_id` INT NOT NULL;
ALTER TABLE articles ADD FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`);
ALTER TABLE articles ADD COLUMN `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE articles ADD INDEX `idx_created_by` (`created_by_id`);

-- 同样改动所有内容表
```

#### Step 1.3: 创建迁移脚本
**文件**: `backend/migrations/`

**操作**:
```python
# 生成迁移脚本
alembic revision --autogenerate -m "Add draft workflow and ownership fields"
# 或手动创建 SQL 迁移脚本
```

**验证**:
- [ ] `alembic upgrade head` 成功
- [ ] 所有旧数据正确迁移

---

### **Phase 2: 后端权限逻辑** (2-3天)
**目标**: 实现完整的权限检查和操作

#### Step 2.1: 权限检查函数 (core/permissions.py)

**新增函数**:
```python
def can_create(content_type: str, user: User) -> bool:
    """检查用户是否可以创建内容"""
    if content_type == 'schedule':  # 行程只有ADMIN+可创建
        return user.role in [Role.ADMIN, Role.SUPER_ADMIN]
    if content_type == 'tag':
        return user.role in [Role.USER, Role.ADMIN, Role.SUPER_ADMIN]
    return user.role in [Role.USER, Role.ADMIN, Role.SUPER_ADMIN]

def can_edit_content(content: Article, user: User) -> bool:
    """检查用户是否可以编辑内容"""
    # 作者总是可以编辑自己的草稿
    if content.created_by_id == user.id and content.status == 'draft':
        return True
    # ADMIN+可以编辑他人的草稿和待审核内容
    if user.role in [Role.ADMIN, Role.SUPER_ADMIN]:
        return content.status in ['draft', 'pending']
    return False

def can_delete_content(content: Article, user: User) -> bool:
    """检查用户是否可以删除内容"""
    # 仅SUPER_ADMIN可以删除任意内容
    if user.role == Role.SUPER_ADMIN:
        return True
    # 其他人只能删除自己的草稿
    if content.created_by_id == user.id and content.status == 'draft':
        return True
    return False

def can_review(user: User) -> bool:
    """检查用户是否可以进行审核"""
    return user.role in [Role.ADMIN, Role.SUPER_ADMIN]

def can_manage_users(user: User) -> bool:
    """检查用户是否可以管理用户"""
    return user.role == Role.SUPER_ADMIN
```

**验证**:
- [ ] 单元测试覆盖所有情况
- [ ] 权限检查函数完整

#### Step 2.2: 路由和端点实现

**文件**: `backend/app/routers/articles.py` (所有内容路由都类似)

**新增/修改端点**:

1. **创建内容** - POST `/api/articles`
```python
@router.post("/articles")
async def create_article(
    article: ArticleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 检查权限
    if not can_create('article', current_user):
        raise HTTPException(403, "You cannot create articles")

    # 创建并保存
    new_article = Article(
        **article.dict(),
        created_by_id=current_user.id,
        status='draft',  # 初始状态为草稿
        created_at=datetime.now()
    )
    db.add(new_article)
    db.commit()
    return new_article
```

2. **编辑内容** - PUT `/api/articles/{id}`
```python
@router.put("/articles/{id}")
async def update_article(
    id: int,
    article: ArticleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Article).get(id)
    if not item:
        raise HTTPException(404, "Not found")

    # 检查权限
    if not can_edit_content(item, current_user):
        raise HTTPException(403, "Cannot edit this article")

    # 更新字段
    for key, value in article.dict(exclude_unset=True).items():
        setattr(item, key, value)

    db.commit()
    return item
```

3. **提交审核** - POST `/api/articles/{id}/submit-for-review`
```python
@router.post("/articles/{id}/submit-for-review")
async def submit_for_review(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Article).get(id)
    if not item:
        raise HTTPException(404, "Not found")

    # 仅作者可提交自己的内容
    if item.created_by_id != current_user.id:
        raise HTTPException(403, "Can only submit your own content")

    # 仅草稿可提交
    if item.status != 'draft':
        raise HTTPException(400, "Only draft content can be submitted")

    item.status = 'pending'
    item.submit_time = datetime.now()
    item.submitted_by_id = current_user.id

    # 记录日志
    log_action(db, current_user.id, 'SUBMIT_FOR_REVIEW', 'article', id)

    db.commit()
    return item
```

4. **删除内容** - DELETE `/api/articles/{id}`
```python
@router.delete("/articles/{id}")
async def delete_article(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Article).get(id)
    if not item:
        raise HTTPException(404, "Not found")

    # 检查权限
    if not can_delete_content(item, current_user):
        raise HTTPException(403, "Cannot delete this article")

    # 记录日志
    log_action(db, current_user.id, 'DELETE', 'article', id)

    db.delete(item)
    db.commit()
    return {"status": "deleted"}
```

**验证**:
- [ ] 所有端点实现完成
- [ ] 权限检查到位
- [ ] 日志记录完整

#### Step 2.3: 审核相关端点

**文件**: `backend/app/routers/reviews.py`

**端点**:

1. **获取待审核列表** - GET `/api/admin/reviews/pending`
```python
@router.get("/admin/reviews/pending")
async def get_pending_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    content_type: str = Query(None),
    page: int = Query(1),
    limit: int = Query(10)
):
    # 检查权限
    if not can_review(current_user):
        raise HTTPException(403, "Only admins can review")

    query = db.query(Article).filter(Article.status == 'pending')
    if content_type:
        # 过滤内容类型
        pass

    total = query.count()
    items = query.offset((page-1)*limit).limit(limit).all()

    return {
        "total": total,
        "items": items,
        "page": page,
        "limit": limit
    }
```

2. **批准内容** - POST `/api/admin/reviews/{id}/approve`
```python
@router.post("/admin/reviews/{id}/approve")
async def approve_content(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Article).get(id)
    if not item:
        raise HTTPException(404, "Not found")

    # 检查权限
    if not can_review(current_user):
        raise HTTPException(403, "Only admins can approve")

    # 更新状态
    item.status = 'approved'
    item.is_published = True  # 自动发布
    item.reviewed_at = datetime.now()
    item.reviewer_id = current_user.id

    # 记录日志
    log_action(db, current_user.id, 'APPROVE', 'article', id)

    db.commit()
    return item
```

3. **拒绝内容** - POST `/api/admin/reviews/{id}/reject`
```python
@router.post("/admin/reviews/{id}/reject")
async def reject_content(
    id: int,
    rejection: RejectionRequest,  # {"reason": "..."}
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Article).get(id)
    if not item:
        raise HTTPException(404, "Not found")

    # 检查权限
    if not can_review(current_user):
        raise HTTPException(403, "Only admins can reject")

    # 更新状态
    item.status = 'rejected'
    item.rejection_reason = rejection.reason
    item.is_published = False
    item.reviewed_at = datetime.now()
    item.reviewer_id = current_user.id

    # 记录日志
    log_action(db, current_user.id, 'REJECT', 'article', id,
              reason=rejection.reason)

    db.commit()
    return item
```

**验证**:
- [ ] 审核端点完整
- [ ] 状态转换正确
- [ ] 日志记录准确

#### Step 2.4: 用户管理端点

**文件**: `backend/app/routers/admin.py`

**新增端点**:
1. GET `/api/admin/users` - 列出所有用户（ADMIN+）
2. POST `/api/admin/users/{id}/ban` - 禁用用户（ADMIN+）
3. POST `/api/admin/users/{id}/unban` - 启用用户（ADMIN+）
4. PUT `/api/admin/users/{id}/role` - 修改角色（SUPER_ADMIN）
5. DELETE `/api/admin/users/{id}` - 删除用户（SUPER_ADMIN）

**验证**:
- [ ] 所有用户管理端点实现
- [ ] 权限检查正确

---

### **Phase 3: 前端适配** (2-3天)
**目标**: 更新前端UI以支持新的权限模型

#### Step 3.1: 更新认证上下文
**文件**: `frontend/src/contexts/AuthContext.tsx`

**修改**:
- 添加 `user.role` 信息
- 添加权限检查辅助函数
- 添加内容状态查询

```typescript
interface User {
  id: number;
  username: string;
  email: string;
  role: 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  is_banned: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;

  // 权限检查方法
  can: {
    create: (contentType: string) => boolean;
    edit: (content: any) => boolean;
    delete: (content: any) => boolean;
    review: () => boolean;
  };
}
```

**验证**:
- [ ] 权限检查函数正确
- [ ] User对象包含role字段

#### Step 3.2: 更新创建/编辑表单
**文件**:
- `frontend/src/components/admin/pages/ArticleCreate.tsx`
- `frontend/src/components/admin/pages/ArticleEdit.tsx`

**修改**:
1. 添加状态显示（draft/pending/approved/rejected）
2. 添加拒绝原因显示（如果rejected）
3. 修改按钮逻辑：
   - 草稿：显示"保存草稿"、"提交审核"、"删除"
   - 待审核：显示"正在审核中..."（仅ADMIN+可编辑）
   - 已批准：显示"已发布"（只读）
   - 已拒绝：显示拒绝原因和"编辑并重新提交"

**示例代码**:
```typescript
const ArticleEdit = ({ id }) => {
  const [article, setArticle] = useState(null);
  const { user, can } = useAuth();

  const canEdit = can.edit(article);
  const canDelete = can.delete(article);
  const canSubmit = article?.status === 'draft' && article?.created_by_id === user.id;

  return (
    <>
      <StatusBadge status={article?.status} />
      {article?.status === 'rejected' && (
        <Alert>{article.rejection_reason}</Alert>
      )}

      <Form disabled={!canEdit} />

      <div>
        <button onClick={save} disabled={!canEdit}>
          {article?.status === 'draft' ? '保存草稿' : '无法编辑'}
        </button>
        <button onClick={submit} disabled={!canSubmit}>
          提交审核
        </button>
        <button onClick={delete} disabled={!canDelete} className="danger">
          删除
        </button>
      </div>
    </>
  );
};
```

**验证**:
- [ ] 状态显示正确
- [ ] 按钮权限检查到位
- [ ] 拒绝原因显示

#### Step 3.3: 添加审核面板
**文件**: `frontend/src/components/admin/pages/ReviewPanel.tsx` (新建)

**功能**:
1. 列表显示所有 pending 内容
2. 支持按内容类型过滤
3. 支持批准/拒绝操作
4. 显示拒绝原因输入框

**示例代码**:
```typescript
const ReviewPanel = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  if (!user || user.role !== 'ADMIN') {
    return <Forbidden />;
  }

  return (
    <div>
      <h2>待审核内容</h2>
      <List
        items={reviews}
        onSelect={(item) => setSelectedItem(item)}
      />

      {selectedItem && (
        <ReviewModal
          item={selectedItem}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};
```

**验证**:
- [ ] 审核面板完整
- [ ] 批准/拒绝功能正常
- [ ] 权限检查准确

#### Step 3.4: 用户管理界面
**文件**: `frontend/src/components/admin/pages/UserManagement.tsx` (新建)

**功能** (仅ADMIN+可访问):
1. 列表显示所有用户
2. 禁用/启用用户
3. 修改用户角色 (仅SUPER_ADMIN)
4. 删除用户 (仅SUPER_ADMIN)

**验证**:
- [ ] 用户管理界面完整
- [ ] 权限检查准确

---

### **Phase 4: 测试和验证** (1-2天)
**目标**: 确保权限系统工作正常

#### Step 4.1: 单元测试
**文件**: `backend/tests/test_permissions.py`

**测试覆盖**:
```python
def test_user_can_create_article():
    user = create_test_user(role='USER')
    assert can_create('article', user) == True

def test_user_cannot_create_schedule():
    user = create_test_user(role='USER')
    assert can_create('schedule', user) == False

def test_user_can_edit_own_draft():
    user = create_test_user(role='USER')
    article = create_test_article(created_by=user, status='draft')
    assert can_edit_content(article, user) == True

def test_user_cannot_edit_pending():
    user = create_test_user(role='USER')
    article = create_test_article(created_by=user, status='pending')
    assert can_edit_content(article, user) == False

def test_admin_can_edit_others_pending():
    admin = create_test_user(role='ADMIN')
    user = create_test_user(role='USER')
    article = create_test_article(created_by=user, status='pending')
    assert can_edit_content(article, admin) == True

def test_user_cannot_delete_approved():
    user = create_test_user(role='USER')
    article = create_test_article(created_by=user, status='approved')
    assert can_delete_content(article, user) == False

def test_super_admin_can_delete_anything():
    super_admin = create_test_user(role='SUPER_ADMIN')
    article = create_test_article(created_by=someone_else, status='approved')
    assert can_delete_content(article, super_admin) == True

# ... 更多测试
```

**验证**:
- [ ] 所有权限检查单元测试通过
- [ ] 覆盖率 > 90%

#### Step 4.2: 集成测试
**文件**: `backend/tests/test_integration.py`

**测试场景**:
1. 用户创建文章 → 自动draft → 提交 → pending → admin批准 → approved+发布
2. 用户创建文章 → admin拒绝 → 用户编辑 → 重新提交 → admin批准
3. Admin创建内容 → pending（同样流程）
4. 用户尝试编辑他人内容 → 403错误
5. 超管删除内容 → 成功

**验证**:
- [ ] 完整工作流测试通过
- [ ] 权限检查准确
- [ ] 状态转换正确

#### Step 4.3: 前端E2E测试
**文件**: `frontend/cypress/e2e/permissions.cy.ts`

**测试场景**:
1. 游客访问管理后台 → 重定向
2. 用户创建文章 → 草稿状态 → 提交 → pending
3. 管理员查看审核面板 → 批准 → 发布
4. 用户尝试删除已发布 → 按钮禁用

**验证**:
- [ ] E2E测试通过
- [ ] UI交互准确

#### Step 4.4: 权限矩阵验证表

| 测试用例 | 操作 | 用户角色 | 预期结果 | 实际结果 | 状态 |
|---------|------|---------|--------|---------|------|
| TC001 | 创建文章 | USER | ✅ | ? | ⬜ |
| TC002 | 创建行程 | USER | ❌ | ? | ⬜ |
| TC003 | 编辑他人草稿 | USER | ❌ | ? | ⬜ |
| TC004 | 编辑他人草稿 | ADMIN | ✅ | ? | ⬜ |
| TC005 | 批准内容 | USER | ❌ | ? | ⬜ |
| TC006 | 批准内容 | ADMIN | ✅ | ? | ⬜ |
| TC007 | 删除他人内容 | ADMIN | ❌ | ? | ⬜ |
| TC008 | 删除他人内容 | SUPER_ADMIN | ✅ | ? | ⬜ |
| ... | ... | ... | ... | ... | ... |

---

### **Phase 5: 文档和培训** (1天)
**目标**: 确保系统清晰易用

#### Step 5.1: 权限系统文档
**文件**: `docs/PERMISSIONS.md`

包含内容：
- 权限矩阵（清晰表格）
- 工作流图
- API端点列表
- 常见问题

#### Step 5.2: 管理员指南
**文件**: `docs/ADMIN_GUIDE.md`

包含内容：
- 如何审核内容
- 如何管理用户
- 如何处理拒绝
- 常见问题

#### Step 5.3: 用户指南
**文件**: `docs/USER_GUIDE.md`

包含内容：
- 如何创建内容
- 如何提交审核
- 理解审核状态
- 重新提交流程

---

## 📈 实现优先级顺序

### **必须完成** (这些做不完系统无法用)
1. ✅ Phase 1: 数据库改动
2. ✅ Phase 2: 后端权限逻辑
3. ✅ Phase 3: 前端适配
4. ✅ Phase 4.1-4.2: 单元和集成测试

### **应该完成** (不完成会有问题)
5. ✅ Phase 4.3: 前端E2E测试
6. ✅ Phase 4.4: 权限矩阵验证

### **可以延后** (上线后完成)
7. ⏳ Phase 5: 文档和培训

---

## 🚀 开发节奏建议

### Week 1
- Day 1-2: Phase 1 (数据库)
- Day 3-5: Phase 2.1-2.2 (权限逻辑和基础端点)

### Week 2
- Day 1-3: Phase 2.3-2.4 (审核和用户管理端点)
- Day 4-5: Phase 3 (前端适配)

### Week 3
- Day 1-2: Phase 4 (测试)
- Day 3-4: Bug修复
- Day 5: Phase 5 (文档)

---

## ✅ 完成标准

系统完成时应满足：

- [ ] 所有权限检查函数实现完整
- [ ] 所有API端点实现完整
- [ ] 工作流状态转换正确
- [ ] 前端UI显示准确
- [ ] 权限矩阵测试覆盖100%
- [ ] 无权限绕过漏洞
- [ ] 审核日志完整
- [ ] 文档清晰完整
- [ ] 管理员和用户都能理解使用

---

## 📞 如有疑问

任何权限相关的实现细节，请参考：
- `docs/AUTH_PERMISSION_ANALYSIS.md` - 完整分析
- `docs/PERMISSIONS.md` - 权限矩阵（完成后）
- `docs/ADMIN_GUIDE.md` - 管理员指南（完成后）
