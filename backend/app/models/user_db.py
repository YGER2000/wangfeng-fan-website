# -*- coding: utf-8 -*-
"""SQLAlchemy User Model for MySQL"""
from sqlalchemy import Column, String, Boolean, DateTime, Integer
from datetime import datetime
import enum
from ..database import Base
from .roles import UserRole


class UserStatus(str, enum.Enum):
    """用户状态枚举"""
    ACTIVE = "active"      # 正常
    INACTIVE = "inactive"  # 未激活
    BANNED = "banned"      # 已封禁


class User(Base):
    """用户数据库模型 (SQLAlchemy)"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True, comment="昵称(支持中文)")
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    avatar = Column(String(500), nullable=True, comment="头像路径")
    role = Column(
        String(20),
        default="user",
        nullable=False,
        index=True
    )
    is_active = Column(Boolean, default=True, nullable=False)

    # 用户状态字段
    status = Column(
        String(20),
        default="active",
        nullable=False,
        index=True
    )

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}', status='{self.status}')>"
