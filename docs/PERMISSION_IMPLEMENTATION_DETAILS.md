# 权限系统实现细节

## 1. 权限检查流程图

### 典型的受保护端点流程

```
请求到达
    ↓
FastAPI路由（使用Depends装饰器）
    ↓
security.HTTPBearer()
    ↓ 提取Authorization header中的Bearer token
JWT验证
    ↓ jwt.decode(token, secret_key)
    ↓ 获取claims中的"sub"字段（username）
获取当前用户
    ↓ UserService.get_user_by_username()
    ↓ 从数据库查询用户
权限检查
    ↓ if user.role == required_role 或 hierarchy check
    ↓
✅ 允许访问 / ❌ 返回403
```

---

## 2. 权限检查依赖详解

### 2.1 依赖链

```python
# 最基础依赖：提取token
get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
)
↓
# 中间依赖：检查用户激活状态
get_current_active_user(
    current_user: User = Depends(get_current_user)
)
↓
# 高级依赖：检查角色权限
require_admin(
    current_user: User = Depends(get_current_active_user)
) if not UserRole.has_permission(current_user.role, UserRole.ADMIN):
    raise HTTPException(403)
```

### 2.2 在路由中的使用

```python
@router.get("/admin/articles")
def get_articles_for_admin(
    skip: int = Query(0),
    limit: int = Query(50),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # 权限检查在这里
):
    # 此时current_user已验证为ADMIN或更高
    return admin_articles.get_articles_for_review(db, skip, limit)
```

### 2.3 可选用户（游客也可访问）

```python
@router.get("/articles")
def get_articles(
    skip: int = Query(0),
    limit: int = Query(50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)  # 返回None如果未登录
):
    # current_user可能为None（游客）
    if current_user:
        # 为认证用户自定义返回
        pass
    else:
        # 为游客返回公开内容
        pass
```

---

## 3. 权限检查实现代码详解

### 3.1 角色层级检查（核心逻辑）

```python
# /backend/app/models/roles.py

class UserRole(str, Enum):
    GUEST = "guest"              # 0
    USER = "user"                # 1
    ADMIN = "admin"              # 2
    SUPER_ADMIN = "super_admin"  # 3

    @classmethod
    def get_role_hierarchy(cls) -> dict:
        """获取角色层级"""
        return {
            cls.GUEST: 0,           # 无权限
            cls.USER: 1,            # 基础权限
            cls.ADMIN: 2,           # 管理权限
            cls.SUPER_ADMIN: 3      # 完全权限
        }

    @classmethod
    def has_permission(cls, user_role: str, required_role: str) -> bool:
        """检查user_role是否拥有required_role或更高的权限"""
        hierarchy = cls.get_role_hierarchy()
        user_level = hierarchy.get(user_role, 0)           # 用户权限等级
        required_level = hierarchy.get(required_role, 0)    # 需求权限等级
        return user_level >= required_level                 # 用户等级>=需求等级时允许
```

**示例**:
- `has_permission("user", "admin")` → False（1 >= 2 = False）
- `has_permission("admin", "user")` → True（2 >= 1 = True）
- `has_permission("super_admin", "admin")` → True（3 >= 2 = True）

### 3.2 通用权限检查装饰器

```python
# /backend/app/core/permissions.py

def require_role(required_role: UserRole):
    """创建一个权限检查装饰器"""
    def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if not UserRole.has_permission(current_user.role, required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足：需要 {UserRole.get_chinese_name(required_role)} 或更高权限"
            )
        return current_user
    return role_checker

# 预定义的权限检查（方便使用）
def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """要求ADMIN或更高权限"""
    if not UserRole.has_permission(current_user.role, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="权限不足：需要管理员权限")
    return current_user

def require_super_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """要求SUPER_ADMIN权限（精确匹配）"""
    user_role = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if user_role != UserRole.SUPER_ADMIN.value and user_role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="权限不足：需要超级管理员权限")
    return current_user
```

### 3.3 基于所有权的权限检查

```python
# /backend/app/core/permissions.py

def can_edit_article(user: User, article_author_id: str) -> bool:
    """检查用户是否可以编辑文章"""
    # 超级管理员总是可以编辑
    if user.role == UserRole.SUPER_ADMIN:
        return True
    
    # 其他用户只能编辑自己的
    return str(user.id) == article_author_id

def can_delete_article(user: User, article_author_id: str) -> bool:
    """检查用户是否可以删除文章"""
    # 超级管理员总是可以删除
    if user.role == UserRole.SUPER_ADMIN:
        return True
    
    # 其他用户只能删除自己的
    return str(user.id) == article_author_id
```

**在路由中的使用**:
```python
@router.put("/articles/{article_id}")
def update_article(
    article_id: str,
    article_update: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # 第一步：检查是否是管理员
):
    article = crud_article.get_article(db, article_id)
    if not article:
        raise HTTPException(status_code=404)
    
    # 第二步：检查所有权（除了超级管理员外，只能编辑自己的）
    if not can_edit_article(current_user, article.author_id):
        raise HTTPException(status_code=403, detail="不能编辑他人的文章")
    
    return crud_article.update_article(db, article_id, article_update)
```

### 3.4 基于分类的权限检查

```python
# /backend/app/core/permissions.py

def can_publish_category(user: User, category_primary: str) -> bool:
    """检查用户是否可以发布指定分类的文章"""
    
    if user.role == UserRole.SUPER_ADMIN:
        return True  # 超级管理员可以发布所有分类
    
    if user.role == UserRole.ADMIN:
        # 管理员可以发布 峰言峰语 和 资料科普
        return category_primary in ["峰言峰语", "资料科普"]
    
    if user.role == UserRole.USER:
        # 普通用户只能发布 峰迷荟萃
        return category_primary == "峰迷荟萃"
    
    return False  # 游客无权限

# 权限矩阵
# ┌─────────────────┬──────────┬──────────┬──────────┐
# │   分类          │  USER    │  ADMIN   │ SUPER_AD │
# ├─────────────────┼──────────┼──────────┼──────────┤
# │  峰言峰语        │    ❌    │    ✅    │    ✅    │
# │  峰迷荟萃        │    ✅    │    ❌    │    ✅    │
# │  资料科普        │    ❌    │    ✅    │    ✅    │
# └─────────────────┴──────────┴──────────┴──────────┘
```

---

## 4. 审核系统权限流程

### 4.1 内容创建权限

```
用户创建文章
    ↓ author_id = current_user.id
    ↓ review_status = "pending"（自动设置）
    ↓ is_published = False（自动设置）
审核员查看待审核列表
    ↓ 需要ADMIN+权限
管理员批准
    ↓ review_status = "approved"
    ↓ is_published = True（自动设置）
    ↓ reviewed_at = now()
    ↓ 记录到admin_logs
管理员拒绝
    ↓ review_status = "rejected"
    ↓ review_notes = "原因"（必填）
    ↓ is_published = False
    ↓ reviewed_at = now()
    ↓ 记录到admin_logs
```

### 4.2 批准操作的权限检查

```python
# /backend/app/routers/reviews.py

@router.post("/{content_type}/{content_id}/approve")
async def approve_content(
    content_type: Literal['article', 'video', 'schedule', 'gallery'],
    content_id: str,
    request: ReviewActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)  # 需要认证用户
):
    """批准内容"""
    # 注意：这里没有角色检查！
    # 理论上任何认证用户都可以批准（可能是BUG）
    
    content = db.query(Article).filter(Article.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404)
    
    # 更新审核状态
    content.review_status = 'approved'
    content.reviewer_id = current_user.id
    content.review_notes = request.reviewNotes
    content.reviewed_at = datetime.utcnow()
    
    # 自动发布
    content.is_published = True
    
    db.commit()
    return {"message": "审核通过"}
```

**⚠️ 发现的问题**：reviews.py路由中未检查ADMIN权限！应该添加 `Depends(require_admin)`

---

## 5. 前端权限检查

### 5.1 前端权限工具函数

```typescript
// /frontend/src/contexts/AuthContext.tsx

export const getRoleHierarchy = (role: UserRole): number => {
  const hierarchy = {
    guest: 0,       // 未登录
    user: 1,        // 普通用户
    admin: 2,       // 管理员
    super_admin: 3  // 超级管理员
  };
  return hierarchy[role] || 0;
};

export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return getRoleHierarchy(userRole) >= getRoleHierarchy(requiredRole);
};
```

### 5.2 受保护路由组件

```typescript
// /frontend/src/components/admin/ProtectedRoute.tsx

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { currentRole, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 检查当前角色是否在允许的角色列表中
  const hasAccess = allowedRoles.some((role) => 
    hasPermission(currentRole, role)
  );

  if (!hasAccess) {
    // 游客重定向到登录页
    // 权限不足用户重定向到首页
    const redirectTo = !user || currentRole === 'guest' ? '/admin' : '/';
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

// 使用示例
<ProtectedRoute allowedRoles={['admin', 'super_admin']}>
  <AdminDashboard />
</ProtectedRoute>
```

### 5.3 条件渲染

```typescript
// /frontend/src/components/admin/NewAdminLayout.tsx

const { currentRole } = useAuth();
const isAdmin = currentRole === 'admin' || currentRole === 'super_admin';

// 管理员菜单
const allNavItems = isAdmin ? [...userNavItems, ...adminNavItems] : userNavItems;

// 条件渲染
{isAdmin && (
  <NavItem label="用户管理" to="/admin/users" icon={Users} />
)}
```

---

## 6. JWT令牌结构

### 6.1 令牌生成

```python
# /backend/app/core/security.py

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
    """创建访问令牌"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    # 添加过期时间到payload
    to_encode.update({"exp": expire})
    
    # 使用secret key和算法进行签名
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.secret_key,      # 密钥
        algorithm=settings.algorithm  # 通常是HS256
    )
    return encoded_jwt
```

### 6.2 令牌结构示例

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VybmFtZSIsImV4cCI6MTczMDU3ODk2N30.xxx

                ↓ 解码后

{
  "alg": "HS256",   # 算法：HMAC SHA256
  "typ": "JWT"      # 类型：JSON Web Token
}
.
{
  "sub": "username",     # Subject - 用户标识（我们用username）
  "exp": 1730578967      # Expiration - Unix时间戳
}
.
[签名]
```

### 6.3 令牌验证

```python
# /backend/app/core/security.py

def verify_token(token: str) -> Union[str, None]:
    """验证令牌并返回username"""
    try:
        # 使用相同的密钥解码
        payload = jwt.decode(
            token, 
            settings.secret_key, 
            algorithms=[settings.algorithm]
        )
        
        # 获取subject字段（用户名）
        username: str = payload.get("sub")
        if username is None:
            return None
        
        return username
    except jwt.InvalidTokenError:
        # Token无效、过期、被篡改
        return None
```

### 6.4 前端令牌检查

```typescript
// /frontend/src/contexts/AuthContext.tsx

const isTokenExpired = (token: string): boolean => {
  try {
    // 解析JWT（不验证签名，仅解码）
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    const expirationTime = payload.exp * 1000;  // 转换为毫秒
    
    return Date.now() >= expirationTime;  // 当前时间 >= 过期时间
  } catch (error) {
    return true;  // 解析失败视为过期
  }
};

// 在应用启动时检查token
useEffect(() => {
  const savedToken = localStorage.getItem('access_token');
  
  if (savedToken && isTokenExpired(savedToken)) {
    // Token已过期，清除认证信息
    logout();
  } else if (savedToken) {
    // Token仍有效，恢复认证状态
    setToken(savedToken);
  }
}, []);
```

---

## 7. 日志记录示例

### 7.1 手动记录管理员操作

```python
# /backend/app/routers/admin.py

def create_admin_log(
    db: Session,
    current_user: User,
    action: LogActionType,
    resource_type: LogResourceType,
    resource_id: Optional[str] = None,
    description: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None
):
    """创建管理员操作日志"""
    log_data = AdminLogCreate(
        action=action,           # 操作类型：APPROVE/REJECT/DELETE等
        resource_type=resource_type,  # 资源类型：ARTICLE/USER等
        resource_id=resource_id,      # 被操作的资源ID
        operator_id=str(current_user.id),
        operator_username=current_user.username,
        operator_role=current_user.role.value,
        description=description,      # 人类可读的描述
        details=json.dumps(details, ensure_ascii=False) if details else None,
        ip_address=ip_address,        # 操作者IP地址
        user_agent=None
    )
    return admin_log.create_log(db=db, log_data=log_data)

# 使用示例
create_admin_log(
    db=db,
    current_user=current_user,
    action=LogActionType.APPROVE,
    resource_type=LogResourceType.ARTICLE,
    resource_id=article_id,
    description=f"批准文章: {article.title}",
    details={"review_notes": "内容不错"},
    ip_address=request.client.host
)
```

### 7.2 日志查询

```python
# /backend/app/routers/admin.py

@router.get("/logs")
def get_admin_logs(
    skip: int = Query(0),
    limit: int = Query(50),
    action: Optional[LogActionType] = Query(None),           # 按操作类型筛选
    resource_type: Optional[LogResourceType] = Query(None),  # 按资源类型筛选
    operator_id: Optional[str] = Query(None),                # 按操作者ID筛选
    start_date: Optional[datetime] = Query(None),            # 按日期范围筛选
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """获取管理员操作日志"""
    logs = admin_log.get_logs(
        db=db,
        skip=skip,
        limit=limit,
        action=action,
        resource_type=resource_type,
        operator_id=operator_id,
        start_date=start_date,
        end_date=end_date
    )
    return logs
```

---

## 8. 常见权限检查模式

### 模式1：仅限ADMIN访问

```python
@router.get("/admin/users")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    pass
```

### 模式2：仅限SUPER_ADMIN访问

```python
@router.delete("/articles/{article_id}")
def delete_article(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    pass
```

### 模式3：检查所有权后操作

```python
@router.put("/articles/{article_id}")
def update_article(
    article_id: str,
    article_update: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    article = crud_article.get_article(db, article_id)
    
    # 第一步：只有ADMIN+可以更新文章
    if current_user.role == UserRole.USER:
        raise HTTPException(status_code=403)
    
    # 第二步：非超管只能更新自己的
    if current_user.role == UserRole.ADMIN and str(current_user.id) != article.author_id:
        raise HTTPException(status_code=403, detail="不能编辑他人的文章")
    
    return crud_article.update_article(db, article_id, article_update)
```

### 模式4：多个条件检查

```python
@router.post("/articles/{article_id}/approve")
def approve_article(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # 必须是ADMIN+
):
    article = crud_article.get_article(db, article_id)
    
    # 还需检查分类权限
    if not can_publish_category(current_user, article.category_primary):
        raise HTTPException(status_code=403, detail="权限不足：无法发布此分类")
    
    return admin_articles.approve_article(db, article_id, current_user.id)
```

---

## 9. 权限检查检查清单

### 在实现新端点时，需要检查：

- [ ] 是否需要认证？（游客可访问吗？）
- [ ] 需要什么最低角色？（ADMIN/SUPER_ADMIN/etc）
- [ ] 是否需要所有权检查？（只能操作自己的吗？）
- [ ] 是否需要分类/资源权限？（特定分类的权限规则？）
- [ ] 是否需要记录日志？（管理员操作？）
- [ ] 错误时返回401还是403？（认证失败vs权限不足）

### 错误代码规范

```
400 - Bad Request        # 请求参数错误
401 - Unauthorized       # 需要认证但未提供令牌
403 - Forbidden          # 用户已认证但权限不足
404 - Not Found          # 资源不存在
500 - Server Error       # 服务器错误
```

---

**相关文档**: `/docs/AUTH_PERMISSION_ANALYSIS.md`
**最后更新**: 2025-11-01
