"""权限控制模块"""
from fastapi import Depends, HTTPException, status
from ..models.roles import UserRole
from ..models.user_db import User
from .dependencies import get_current_active_user


def require_role(required_role: UserRole):
    """
    创建一个依赖项，要求当前用户具有指定角色或更高权限

    Args:
        required_role: 所需的最低角色级别

    Returns:
        返回一个依赖函数，该函数验证用户权限
    """
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if not UserRole.has_permission(current_user.role, required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足：需要 {UserRole.get_chinese_name(required_role)} 或更高权限"
            )
        return current_user
    return role_checker


def require_user(current_user: User = Depends(get_current_active_user)) -> User:
    """要求用户角色或更高权限"""
    if not UserRole.has_permission(current_user.role, UserRole.USER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足：需要用户或更高权限"
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """要求管理员角色或更高权限"""
    if not UserRole.has_permission(current_user.role, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足：需要管理员或更高权限"
        )
    return current_user


def require_super_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """要求超级管理员权限"""
    # 支持字符串和枚举类型的比较
    user_role = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if user_role != UserRole.SUPER_ADMIN.value and user_role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足：需要超级管理员权限"
        )
    return current_user


def can_publish_category(user: User, category_primary: str) -> bool:
    """
    检查用户是否有权限发布指定分类的文章

    权限规则：
    - 游客：无发布权限
    - 用户：只能发布 峰迷荟萃
    - 管理员：可以发布 峰言峰语 和 资料科普
    - 超级管理员：可以发布所有分类，并可以管理、修改、删除任何文章

    Args:
        user: 当前用户
        category_primary: 一级分类名称

    Returns:
        是否有权限发布
    """
    if user.role == UserRole.SUPER_ADMIN:
        return True  # 超级管理员可以发布所有分类

    if user.role == UserRole.ADMIN:
        # 管理员可以发布 峰言峰语 和 资料科普
        return category_primary in ["峰言峰语", "资料科普"]

    if user.role == UserRole.USER:
        # 普通用户只能发布 峰迷荟萃
        return category_primary == "峰迷荟萃"

    return False  # 游客无权限


def can_edit_article(user: User, article_author_id: str) -> bool:
    """
    检查用户是否有权限编辑指定文章

    权限规则：
    - 超级管理员：可以编辑所有文章
    - 其他用户：只能编辑自己的文章

    Args:
        user: 当前用户
        article_author_id: 文章作者ID

    Returns:
        是否有权限编辑
    """
    if user.role == UserRole.SUPER_ADMIN:
        return True

    return str(user.id) == article_author_id


def can_delete_article(user: User, article_author_id: str) -> bool:
    """
    检查用户是否有权限删除指定文章

    权限规则：
    - 超级管理员：可以删除所有文章
    - 其他用户：只能删除自己的文章

    Args:
        user: 当前用户
        article_author_id: 文章作者ID

    Returns:
        是否有权限删除
    """
    if user.role == UserRole.SUPER_ADMIN:
        return True

    return str(user.id) == article_author_id


# ============================================================================
# v3 权限系统新增函数
# ============================================================================

def can_create_content(content_type: str, user: User) -> bool:
    """
    检查用户是否可以创建内容

    权限规则：
    - 游客：无法创建
    - 用户：可创建 文章、视频、图组、标签
    - 管理员：可创建所有内容类型
    - 超级管理员：可创建所有内容类型

    Args:
        content_type: 内容类型 (article, video, photo-group, schedule, tag)
        user: 当前用户

    Returns:
        是否有权限创建
    """
    # 游客无法创建
    if user.role == UserRole.GUEST:
        return False

    # 行程仅ADMIN+可创建
    if content_type == 'schedule':
        return user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]

    # 其他内容USER+都可以创建
    return user.role in [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]


def can_edit_content(content: dict, user: User) -> bool:
    """
    检查用户是否可以编辑内容

    权限规则：
    - 作者：可编辑自己的草稿
    - 管理员+：可编辑任意内容（包括已发布）
    - 其他：无法编辑

    Args:
        content: 内容对象（包含 created_by_id 和 status 字段）
        user: 当前用户

    Returns:
        是否有权限编辑
    """
    status = content.get('status')
    created_by = content.get('created_by_id')

    # 作者可以编辑自己的内容，支持草稿/待审核/已驳回/已发布的重新提交
    if created_by == user.id and status in ['draft', 'pending', 'rejected', 'approved']:
        return True

    # 管理员+可以编辑任意内容（包括已发布）
    if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        return True

    return False


def can_delete_content(content: dict, user: User) -> bool:
    """
    检查用户是否可以删除内容

    权限规则：
    - 仅SUPER_ADMIN可以删除任意内容
    - 其他用户只能删除自己的草稿
    - 已提交的内容无法删除

    Args:
        content: 内容对象（包含 created_by_id 和 status 字段）
        user: 当前用户

    Returns:
        是否有权限删除
    """
    status = content.get('status')
    created_by = content.get('created_by_id')

    # 超级管理员可以删除任意内容
    if user.role == UserRole.SUPER_ADMIN:
        return True

    # 其他人可以删除自己创建的内容（草稿/待审核/已驳回/已发布）
    if created_by == user.id and status in ['draft', 'pending', 'rejected', 'approved']:
        return True

    return False


def can_review(user: User) -> bool:
    """
    检查用户是否可以进行审核

    权限规则：
    - 仅ADMIN+可以审核

    Args:
        user: 当前用户

    Returns:
        是否有权限审核
    """
    return user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]


def can_manage_users(user: User) -> bool:
    """
    检查用户是否可以管理用户

    权限规则：
    - 仅SUPER_ADMIN可以管理用户

    Args:
        user: 当前用户

    Returns:
        是否有权限管理用户
    """
    return user.role == UserRole.SUPER_ADMIN
