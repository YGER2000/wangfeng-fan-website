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
    if current_user.role != UserRole.SUPER_ADMIN:
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
    - 用户：只能发布 峰迷聊峰
    - 管理员：可以发布 峰言峰语 和 数据科普
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
        # 管理员可以发布 峰言峰语 和 数据科普
        return category_primary in ["峰言峰语", "数据科普"]

    if user.role == UserRole.USER:
        # 普通用户只能发布 峰迷聊峰
        return category_primary == "峰迷聊峰"

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
