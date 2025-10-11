# -*- coding: utf-8 -*-
"""用户管理CRUD操作（管理员）"""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..models.user_db import User, UserStatus
from ..models.roles import UserRole


def get_users(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    search: Optional[str] = None
) -> List[User]:
    """
    获取用户列表

    Args:
        db: 数据库会话
        skip: 跳过的记录数
        limit: 返回的最大记录数
        role: 角色过滤
        status: 状态过滤
        search: 搜索关键词（用户名或邮箱）
    """
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)

    if status:
        query = query.filter(User.status == status)

    if search:
        query = query.filter(
            (User.username.contains(search)) | (User.email.contains(search))
        )

    return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()


def get_users_count(
    db: Session,
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    search: Optional[str] = None
) -> int:
    """获取用户总数"""
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)

    if status:
        query = query.filter(User.status == status)

    if search:
        query = query.filter(
            (User.username.contains(search)) | (User.email.contains(search))
        )

    return query.count()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """根据ID获取用户"""
    return db.query(User).filter(User.id == user_id).first()


def update_user_role(db: Session, user_id: str, new_role: UserRole) -> Optional[User]:
    """
    更新用户角色

    Args:
        db: 数据库会话
        user_id: 用户ID
        new_role: 新角色

    Returns:
        更新后的用户对象
    """
    user = get_user_by_id(db, user_id)

    if not user:
        return None

    user.role = new_role
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


def ban_user(db: Session, user_id: str) -> Optional[User]:
    """
    封禁用户

    Args:
        db: 数据库会话
        user_id: 用户ID

    Returns:
        更新后的用户对象
    """
    user = get_user_by_id(db, user_id)

    if not user:
        return None

    user.status = UserStatus.BANNED
    user.is_active = False
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


def unban_user(db: Session, user_id: str) -> Optional[User]:
    """
    解封用户

    Args:
        db: 数据库会话
        user_id: 用户ID

    Returns:
        更新后的用户对象
    """
    user = get_user_by_id(db, user_id)

    if not user:
        return None

    user.status = UserStatus.ACTIVE
    user.is_active = True
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


def activate_user(db: Session, user_id: str) -> Optional[User]:
    """
    激活用户

    Args:
        db: 数据库会话
        user_id: 用户ID

    Returns:
        更新后的用户对象
    """
    user = get_user_by_id(db, user_id)

    if not user:
        return None

    user.status = UserStatus.ACTIVE
    user.is_active = True
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


def deactivate_user(db: Session, user_id: str) -> Optional[User]:
    """
    停用用户

    Args:
        db: 数据库会话
        user_id: 用户ID

    Returns:
        更新后的用户对象
    """
    user = get_user_by_id(db, user_id)

    if not user:
        return None

    user.status = UserStatus.INACTIVE
    user.is_active = False
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


def get_total_users(db: Session) -> int:
    """获取用户总数"""
    return db.query(User).count()


def get_users_by_date_range(
    db: Session,
    start_date: datetime,
    end_date: Optional[datetime] = None
) -> int:
    """获取指定日期范围内的用户数"""
    query = db.query(User).filter(User.created_at >= start_date)

    if end_date:
        query = query.filter(User.created_at <= end_date)

    return query.count()
