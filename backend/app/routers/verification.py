# -*- coding: utf-8 -*-
"""验证码相关路由"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..schemas.verification import (
    SendVerificationCodeRequest,
    VerifyCodeRequest,
    VerificationCodeResponse,
    RegisterWithEmailRequest,
    ResetPasswordRequest,
    EmailLoginRequest
)
from ..schemas.user import UserResponse, Token
from ..crud.verification_code import VerificationCodeCRUD
from ..services.user_service_mysql import UserServiceMySQL
from ..core.dependencies import get_db, get_user_service
from ..core.security import create_access_token
from ..core.config import get_settings
from ..utils.email_service import EmailService
from ..models.roles import UserRole
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/verification", tags=["验证码"])
settings = get_settings()


def get_email_service() -> EmailService:
    """获取邮件服务实例"""
    return EmailService(
        smtp_host=settings.smtp_host,
        smtp_port=settings.smtp_port,
        smtp_username=settings.smtp_username,
        smtp_password=settings.smtp_password,
        sender_email=settings.sender_email,
        sender_name=settings.sender_name
    )


@router.post("/send-code", response_model=VerificationCodeResponse)
def send_verification_code(
    request: SendVerificationCodeRequest,
    db: Session = Depends(get_db),
    email_service: EmailService = Depends(get_email_service)
):
    """
    发送验证码

    - **email**: 邮箱地址
    - **type**: 验证码类型 (register, reset_password, login, change_email)
    """
    try:
        crud = VerificationCodeCRUD(db)

        # 检查发送频率限制 (1分钟内只能发送一次)
        if not crud.check_rate_limit(request.email, request.type, limit_minutes=1):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="发送过于频繁,请稍后再试"
            )

        # 生成验证码
        code = email_service.generate_verification_code(length=6)

        # 保存验证码到数据库
        verification_code = crud.create_verification_code(
            email=request.email,
            code=code,
            code_type=request.type,
            expires_minutes=10
        )

        # 发送邮件
        purpose_map = {
            "register": "注册",
            "reset_password": "重置密码",
            "login": "登录",
            "change_email": "修改邮箱"
        }
        purpose = purpose_map.get(request.type, "验证")

        success = email_service.send_verification_code(
            to_email=request.email,
            code=code,
            purpose=purpose
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="验证码发送失败,请稍后重试"
            )

        return VerificationCodeResponse(
            success=True,
            message="验证码已发送,请查收邮件",
            expires_in=600  # 10分钟
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"发送验证码失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="验证码发送失败"
        )


@router.post("/verify-code", response_model=VerificationCodeResponse)
def verify_code(
    request: VerifyCodeRequest,
    db: Session = Depends(get_db)
):
    """
    验证验证码 (不标记为已使用)

    - **email**: 邮箱地址
    - **code**: 验证码
    - **type**: 验证码类型
    """
    crud = VerificationCodeCRUD(db)

    # 验证验证码 (不标记为已使用)
    is_valid = crud.verify_code(
        email=request.email,
        code=request.code,
        code_type=request.type,
        mark_as_used=False
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误或已过期"
        )

    return VerificationCodeResponse(
        success=True,
        message="验证码正确"
    )


@router.post("/register-with-email", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_with_email(
    request: RegisterWithEmailRequest,
    db: Session = Depends(get_db),
    user_service: UserServiceMySQL = Depends(get_user_service)
):
    """
    邮箱注册

    - **email**: 邮箱地址
    - **code**: 验证码
    - **username**: 用户名
    - **password**: 密码
    - **full_name**: 全名 (可选)
    """
    crud = VerificationCodeCRUD(db)

    # 验证验证码并标记为已使用
    is_valid = crud.verify_code(
        email=request.email,
        code=request.code,
        code_type="register",
        mark_as_used=True
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误或已过期"
        )

    # 创建用户
    try:
        from ..schemas.user import UserCreate
        user_data = UserCreate(
            username=request.username,
            email=request.email,
            password=request.password
        )
        user = user_service.create_user(user_data)

        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            role_name=UserRole.get_chinese_name(user.role),
            is_active=user.is_active
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/reset-password", response_model=VerificationCodeResponse)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
    user_service: UserServiceMySQL = Depends(get_user_service)
):
    """
    重置密码

    - **email**: 邮箱地址
    - **code**: 验证码
    - **new_password**: 新密码
    """
    crud = VerificationCodeCRUD(db)

    # 验证验证码并标记为已使用
    is_valid = crud.verify_code(
        email=request.email,
        code=request.code,
        code_type="reset_password",
        mark_as_used=True
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误或已过期"
        )

    # 查找用户
    user = user_service.get_user_by_email(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    # 更新密码
    try:
        user_service.update_user_password(user.id, request.new_password)
        return VerificationCodeResponse(
            success=True,
            message="密码重置成功"
        )
    except Exception as e:
        logger.error(f"密码重置失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="密码重置失败"
        )


@router.post("/login-with-email", response_model=Token)
def login_with_email(
    request: EmailLoginRequest,
    user_service: UserServiceMySQL = Depends(get_user_service)
):
    """
    邮箱密码登录

    - **email**: 邮箱地址
    - **password**: 密码
    """
    # 通过邮箱查找用户
    user = user_service.get_user_by_email(request.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 验证密码
    if not user_service.verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户已被禁用"
        )

    # 更新最后登录时间
    user_service.update_user_last_login(user.id)

    # 创建访问令牌
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
