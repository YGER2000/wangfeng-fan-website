# -*- coding: utf-8 -*-
"""验证码数据库模型"""
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from datetime import datetime, timedelta
import uuid
import enum
from ..database import Base


class VerificationType(str, enum.Enum):
    """验证码类型枚举"""
    REGISTER = "register"           # 注册
    RESET_PASSWORD = "reset_password"  # 重置密码
    LOGIN = "login"                 # 登录验证
    CHANGE_EMAIL = "change_email"   # 修改邮箱


class VerificationCode(Base):
    """验证码数据库模型"""
    __tablename__ = "verification_codes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(100), nullable=False, index=True)
    code = Column(String(10), nullable=False)

    # 验证码类型
    type = Column(
        String(20),
        nullable=False,
        index=True
    )

    # 是否已使用
    is_used = Column(String(10), default="false", nullable=False)

    # 创建时间
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 过期时间 (默认10分钟后过期)
    expires_at = Column(
        DateTime,
        default=lambda: datetime.utcnow() + timedelta(minutes=10),
        nullable=False
    )

    def __repr__(self):
        return f"<VerificationCode(email='{self.email}', type='{self.type}', is_used={self.is_used})>"

    def is_valid(self) -> bool:
        """检查验证码是否有效 (未使用且未过期)"""
        return (
            self.is_used == "false" and
            self.expires_at > datetime.utcnow()
        )

    def mark_as_used(self):
        """标记验证码为已使用"""
        self.is_used = "true"
