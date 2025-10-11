# -*- coding: utf-8 -*-
"""验证码CRUD操作"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import logging

from ..models.verification_code import VerificationCode, VerificationType

logger = logging.getLogger(__name__)


class VerificationCodeCRUD:
    """验证码数据库操作类"""

    def __init__(self, db: Session):
        self.db = db

    def create_verification_code(
        self,
        email: str,
        code: str,
        code_type: str,
        expires_minutes: int = 10
    ) -> VerificationCode:
        """
        创建验证码

        Args:
            email: 邮箱地址
            code: 验证码
            code_type: 验证码类型
            expires_minutes: 过期时间(分钟)

        Returns:
            VerificationCode: 验证码对象
        """
        # 先删除该邮箱该类型的旧验证码
        self.delete_old_codes(email, code_type)

        # 创建新验证码
        verification_code = VerificationCode(
            email=email,
            code=code,
            type=code_type,
            expires_at=datetime.utcnow() + timedelta(minutes=expires_minutes)
        )

        self.db.add(verification_code)
        self.db.commit()
        self.db.refresh(verification_code)

        logger.info(f"创建验证码: email={email}, type={code_type}, code={code}")
        return verification_code

    def verify_code(
        self,
        email: str,
        code: str,
        code_type: str,
        mark_as_used: bool = True
    ) -> bool:
        """
        验证验证码

        Args:
            email: 邮箱地址
            code: 验证码
            code_type: 验证码类型
            mark_as_used: 是否标记为已使用

        Returns:
            bool: 验证成功返回True
        """
        verification_code = self.db.query(VerificationCode).filter(
            VerificationCode.email == email,
            VerificationCode.code == code,
            VerificationCode.type == code_type,
            VerificationCode.is_used == "false",
            VerificationCode.expires_at > datetime.utcnow()
        ).first()

        if not verification_code:
            logger.warning(f"验证码验证失败: email={email}, code={code}, type={code_type}")
            return False

        # 标记为已使用
        if mark_as_used:
            verification_code.mark_as_used()
            self.db.commit()

        logger.info(f"验证码验证成功: email={email}, type={code_type}")
        return True

    def get_latest_code(
        self,
        email: str,
        code_type: str
    ) -> Optional[VerificationCode]:
        """
        获取最新的验证码

        Args:
            email: 邮箱地址
            code_type: 验证码类型

        Returns:
            Optional[VerificationCode]: 验证码对象或None
        """
        return self.db.query(VerificationCode).filter(
            VerificationCode.email == email,
            VerificationCode.type == code_type
        ).order_by(VerificationCode.created_at.desc()).first()

    def delete_old_codes(self, email: str, code_type: str):
        """删除旧的验证码"""
        self.db.query(VerificationCode).filter(
            VerificationCode.email == email,
            VerificationCode.type == code_type
        ).delete()
        self.db.commit()

    def cleanup_expired_codes(self):
        """清理过期的验证码"""
        deleted = self.db.query(VerificationCode).filter(
            VerificationCode.expires_at < datetime.utcnow()
        ).delete()
        self.db.commit()
        logger.info(f"清理过期验证码: {deleted} 条")
        return deleted

    def check_rate_limit(
        self,
        email: str,
        code_type: str,
        limit_minutes: int = 1
    ) -> bool:
        """
        检查发送频率限制

        Args:
            email: 邮箱地址
            code_type: 验证码类型
            limit_minutes: 限制时间(分钟)

        Returns:
            bool: 允许发送返回True, 否则返回False
        """
        latest_code = self.get_latest_code(email, code_type)

        if not latest_code:
            return True

        # 检查距离上次发送是否超过限制时间
        time_diff = datetime.utcnow() - latest_code.created_at
        if time_diff < timedelta(minutes=limit_minutes):
            logger.warning(f"发送频率限制: email={email}, type={code_type}")
            return False

        return True
