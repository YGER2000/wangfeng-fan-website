# 汪峰粉丝网站 - 管理后台系统文档

## 概述

本文档描述了管理后台系统的完整实现，包括数据库模型、API端点、权限控制等。

## 系统架构

### 技术栈
- **框架**: FastAPI
- **数据库**: MySQL (使用 SQLAlchemy ORM)
- **认证**: JWT Token
- **端口**: 1994

## 数据库模型

### 1. AdminLog (管理员操作日志)
文件: `/backend/app/models/admin_log.py`

**字段说明**:
- `id`: 日志ID (UUID)
- `action`: 操作类型 (create/update/delete/approve/reject/ban/unban/role_change/login/logout)
- `resource_type`: 资源类型 (article/user/comment/schedule/system)
- `resource_id`: 被操作资源的ID
- `operator_id`: 操作者用户ID
- `operator_username`: 操作者用户名
- `operator_role`: 操作者角色
- `description`: 操作描述
- `details`: 详细信息 (JSON格式)
- `ip_address`: IP地址
- `user_agent`: 浏览器信息
- `created_at`: 创建时间

### 2. Article (文章) - 更新字段
文件: `/backend/app/models/article.py`

**新增字段**:
- `author_id`: 作者用户ID
- `review_status`: 审核状态 (pending/approved/rejected)
- `reviewer_id`: 审核人ID
- `review_notes`: 审核备注
- `reviewed_at`: 审核时间

### 3. User (用户) - 更新字段
文件: `/backend/app/models/user_db.py`

**新增字段**:
- `status`: 用户状态 (active/inactive/banned)

**已有字段**:
- `role`: 用户角色 (user/admin/super_admin)
- `is_active`: 是否激活
- `last_login`: 最后登录时间

## Pydantic Schemas

### 1. Admin Schemas
文件: `/backend/app/schemas/admin.py`

包含:
- `AdminLogBase`, `AdminLogCreate`, `AdminLogResponse` - 日志相关
- `ArticleReviewAction`, `ArticleAdminResponse` - 文章审核相关
- `UserUpdateRole`, `UserBanAction`, `UserAdminResponse` - 用户管理相关
- `CommentAdminResponse`, `ScheduleAdminResponse` - 评论和行程管理

### 2. Dashboard Schemas
文件: `/backend/app/schemas/dashboard.py`

包含:
- `DashboardStats` - 仪表盘统计数据
- `UserGrowthData` - 用户增长数据
- `ArticleStatsData` - 文章统计数据
- `DashboardChartData` - 图表数据
- `SystemInfo` - 系统信息
- `RecentActivity` - 最近活动

## CRUD 操作

### 1. admin_log.py
文件: `/backend/app/crud/admin_log.py`

主要函数:
- `create_log()` - 创建日志
- `get_logs()` - 获取日志列表（支持多种过滤）
- `get_logs_count()` - 获取日志总数
- `get_recent_logs()` - 获取最近的日志
- `delete_old_logs()` - 删除旧日志

### 2. admin_articles.py
文件: `/backend/app/crud/admin_articles.py`

主要函数:
- `get_articles_for_review()` - 获取待审核文章
- `approve_article()` - 批准文章
- `reject_article()` - 拒绝文章
- `get_pending_articles_count()` - 获取待审核数量
- `force_delete_article()` - 强制删除文章

### 3. admin_users.py
文件: `/backend/app/crud/admin_users.py`

主要函数:
- `get_users()` - 获取用户列表（支持过滤）
- `update_user_role()` - 更新用户角色
- `ban_user()` - 封禁用户
- `unban_user()` - 解封用户
- `activate_user()` / `deactivate_user()` - 激活/停用用户

### 4. admin_dashboard.py
文件: `/backend/app/crud/admin_dashboard.py`

主要函数:
- `get_dashboard_stats()` - 获取仪表盘统计
- `get_user_growth_data()` - 获取用户增长趋势
- `get_article_stats_by_category()` - 按分类统计文章
- `get_article_stats_by_status()` - 按状态统计文章

## API 端点

### 基础路径: `/api/admin`

### 仪表盘

#### 1. 获取统计数据
```
GET /api/admin/dashboard/stats
权限: admin 或 super_admin
返回: DashboardStats
```

#### 2. 获取图表数据
```
GET /api/admin/dashboard/charts
权限: admin 或 super_admin
返回: DashboardChartData
```

### 文章管理

#### 1. 获取文章列表
```
GET /api/admin/articles
参数:
  - skip: int (默认: 0)
  - limit: int (默认: 50, 最大: 100)
  - status: ReviewStatus (可选)
  - search: str (可选)
  - category: str (可选)
权限: admin 或 super_admin
返回: List[ArticleAdminResponse]
```

#### 2. 获取文章总数
```
GET /api/admin/articles/count
参数: 同上
权限: admin 或 super_admin
返回: {"count": int}
```

#### 3. 获取文章详情
```
GET /api/admin/articles/{article_id}
权限: admin 或 super_admin
返回: ArticleAdminResponse
```

#### 4. 批准文章
```
PUT /api/admin/articles/{article_id}/approve
请求体: ArticleReviewAction (可选)
权限: admin 或 super_admin
返回: ArticleAdminResponse
```

#### 5. 拒绝文章
```
PUT /api/admin/articles/{article_id}/reject
请求体: ArticleReviewAction (必须包含 review_notes)
权限: admin 或 super_admin
返回: ArticleAdminResponse
```

#### 6. 删除文章
```
DELETE /api/admin/articles/{article_id}
权限: super_admin (仅超级管理员)
返回: {"message": str, "article_id": str}
```

### 用户管理

#### 1. 获取用户列表
```
GET /api/admin/users
参数:
  - skip: int (默认: 0)
  - limit: int (默认: 50, 最大: 100)
  - role: UserRole (可选)
  - status: UserStatus (可选)
  - search: str (可选, 搜索用户名或邮箱)
权限: admin 或 super_admin
返回: List[UserAdminResponse]
```

#### 2. 获取用户总数
```
GET /api/admin/users/count
参数: 同上
权限: admin 或 super_admin
返回: {"count": int}
```

#### 3. 获取用户详情
```
GET /api/admin/users/{user_id}
权限: admin 或 super_admin
返回: UserAdminResponse
```

#### 4. 更新用户角色
```
PUT /api/admin/users/{user_id}/role
请求体: UserUpdateRole
权限: super_admin (仅超级管理员)
限制: 不能修改自己的角色
返回: UserAdminResponse
```

#### 5. 封禁用户
```
PUT /api/admin/users/{user_id}/ban
请求体: UserBanAction (可选)
权限: admin 或 super_admin
限制:
  - 不能封禁自己
  - 普通管理员不能封禁管理员
返回: UserAdminResponse
```

#### 6. 解封用户
```
PUT /api/admin/users/{user_id}/unban
请求体: UserUnbanAction (可选)
权限: admin 或 super_admin
返回: UserAdminResponse
```

### 行程管理

#### 1. 获取行程列表
```
GET /api/admin/schedules
参数:
  - skip: int (默认: 0)
  - limit: int (默认: 50, 最大: 100)
权限: admin 或 super_admin
返回: List[Schedule]
```

#### 2. 获取行程总数
```
GET /api/admin/schedules/count
权限: admin 或 super_admin
返回: {"count": int}
```

#### 3. 更新行程
```
PUT /api/admin/schedules/{schedule_id}
请求: multipart/form-data，可包含 category/date/city/venue/theme/description/image
权限: admin 或 super_admin
返回: {"message": str, "schedule": Schedule}
```

#### 4. 发布行程
```
PUT /api/admin/schedules/{schedule_id}/publish
权限: admin 或 super_admin
返回: {"message": str, "schedule": Schedule}
```

#### 5. 删除行程
```
DELETE /api/admin/schedules/{schedule_id}
权限: super_admin（已发布行程必须超级管理员）
返回: {"message": str}
```

### 评论管理

#### 1. 获取评论列表
```
GET /api/admin/comments
参数:
  - skip: int (默认: 0)
  - limit: int (默认: 50, 最大: 100)
  - article_id: str (可选)
权限: admin 或 super_admin
注意: 评论数据存储在MongoDB中，需要单独实现
```

### 日志管理

#### 1. 获取操作日志
```
GET /api/admin/logs
参数:
  - skip: int (默认: 0)
  - limit: int (默认: 50, 最大: 100)
  - action: LogActionType (可选)
  - resource_type: LogResourceType (可选)
  - operator_id: str (可选)
  - start_date: datetime (可选)
  - end_date: datetime (可选)
权限: admin 或 super_admin
返回: List[AdminLogResponse]
```

#### 2. 获取日志总数
```
GET /api/admin/logs/count
参数: 同上
权限: admin 或 super_admin
返回: {"count": int}
```

#### 3. 获取最近日志
```
GET /api/admin/logs/recent
参数:
  - limit: int (默认: 10, 最大: 50)
权限: admin 或 super_admin
返回: List[AdminLogResponse]
```

#### 4. 创建日志
```
POST /api/admin/logs
请求体: AdminLogCreate
权限: admin 或 super_admin
返回: AdminLogResponse
```

## 权限控制

### 角色层级
1. **user** (普通用户)
2. **admin** (管理员)
3. **super_admin** (超级管理员)

### 权限说明
- 使用 `require_admin` 依赖项: 需要 admin 或 super_admin 角色
- 使用 `require_super_admin` 依赖项: 仅需要 super_admin 角色

### 特殊权限规则
1. **文章删除**: 仅超级管理员可以强制删除文章
2. **角色修改**: 仅超级管理员可以修改用户角色，且不能修改自己的角色
3. **用户封禁**:
   - 不能封禁自己
   - 普通管理员不能封禁管理员或超级管理员

## 数据库迁移

### 执行迁移
```bash
cd /Users/yger/WithFaith/wangfeng-fan-website/backend
mysql -u root -p wangfeng_fan_website < migrations/001_add_admin_features.sql
```

### 迁移内容
1. 为 `users` 表添加 `status` 字段
2. 为 `articles` 表添加审核相关字段
3. 创建 `admin_logs` 表

## 审计日志

### 自动记录的操作
所有管理员操作都会自动记录到 `admin_logs` 表，包括:
- 文章审核（批准/拒绝）
- 文章删除
- 用户角色修改
- 用户封禁/解封
- IP地址和操作时间

### 日志查询示例
```python
# 查询某个管理员的所有操作
logs = admin_log.get_user_logs(db, user_id="xxx", limit=50)

# 查询特定时间范围的操作
logs = admin_log.get_logs(
    db,
    start_date=datetime(2025, 10, 1),
    end_date=datetime(2025, 10, 31)
)

# 查询文章相关的所有操作
logs = admin_log.get_logs(db, resource_type=LogResourceType.ARTICLE)
```

## 测试

### 启动后端服务
```bash
cd /Users/yger/WithFaith/wangfeng-fan-website/backend
python3 run.py
```

### API 文档
访问: http://localhost:1994/docs

### 测试管理员账号
默认没有管理员账号，需要手动创建或通过迁移脚本创建。

## 安全注意事项

1. **密码哈希**: 使用 bcrypt 进行密码加密
2. **JWT Token**: 所有管理员操作都需要有效的JWT令牌
3. **权限验证**: 每个端点都有严格的权限检查
4. **操作日志**: 记录所有敏感操作，包括IP地址
5. **SQL注入防护**: 使用SQLAlchemy ORM，自动防护SQL注入

## 错误处理

### 常见错误码
- `401 Unauthorized`: Token无效或过期
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `400 Bad Request`: 请求参数错误

### 错误响应格式
```json
{
  "detail": "错误信息描述"
}
```

## 后续优化建议

1. **分页优化**: 对大数据量查询添加游标分页
2. **缓存**: 对统计数据添加Redis缓存
3. **批量操作**: 支持批量审核、批量删除等操作
4. **导出功能**: 支持导出日志、用户列表等
5. **通知系统**: 文章审核结果通知作者
6. **评论管理**: 完善MongoDB评论管理接口

## 文件清单

### 新建文件
1. `/backend/app/models/admin_log.py` - 日志模型
2. `/backend/app/schemas/admin.py` - 管理员schemas
3. `/backend/app/schemas/dashboard.py` - 仪表盘schemas
4. `/backend/app/crud/admin_log.py` - 日志CRUD
5. `/backend/app/crud/admin_articles.py` - 文章管理CRUD
6. `/backend/app/crud/admin_users.py` - 用户管理CRUD
7. `/backend/app/crud/admin_dashboard.py` - 仪表盘CRUD
8. `/backend/app/routers/admin.py` - 管理员路由
9. `/backend/migrations/001_add_admin_features.sql` - 数据库迁移脚本

### 修改文件
1. `/backend/app/models/article.py` - 添加审核字段
2. `/backend/app/models/user_db.py` - 添加状态字段
3. `/backend/app/main.py` - 注册管理员路由

## 联系支持

如有问题，请联系开发团队。
