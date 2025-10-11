# -*- coding: utf-8 -*-
"""管理员操作日志数据库模型"""
from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum
from datetime import datetime
import uuid
from ..database import Base
import enum


class LogActionType(str, enum.Enum):
    """日志操作类型枚举"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    APPROVE = "approve"
    REJECT = "reject"
    BAN = "ban"
    UNBAN = "unban"
    ROLE_CHANGE = "role_change"
    LOGIN = "login"
    LOGOUT = "logout"


class LogResourceType(str, enum.Enum):
    """日志资源类型枚举"""
    ARTICLE = "article"
    USER = "user"
    COMMENT = "comment"
    SCHEDULE = "schedule"
    SYSTEM = "system"


class AdminLog(Base):
    """管理员操作日志模型"""
    __tablename__ = "admin_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)

    # 操作信息
    action = Column(SQLEnum(LogActionType, native_enum=False, length=20), nullable=False, index=True)
    resource_type = Column(SQLEnum(LogResourceType, native_enum=False, length=20), nullable=False, index=True)
    resource_id = Column(String(36), nullable=True, index=True)  # 被操作资源的ID

    # 操作者信息
    operator_id = Column(String(36), nullable=False, index=True)  # 操作者用户ID
    operator_username = Column(String(50), nullable=False)  # 操作者用户名
    operator_role = Column(String(20), nullable=False)  # 操作者角色

    # 详细信息
    description = Column(Text, nullable=True)  # 操作描述
    details = Column(Text, nullable=True)  # JSON格式的详细信息

    # 请求信息
    ip_address = Column(String(45), nullable=True)  # 支持IPv6
    user_agent = Column(String(255), nullable=True)  # 浏览器信息

    # 时间信息
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self):
        return f"<AdminLog(action='{self.action}', operator='{self.operator_username}', resource='{self.resource_type}')>"
