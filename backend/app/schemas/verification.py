# -*- coding: utf-8 -*-
"""验证码相关Schema"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class SendVerificationCodeRequest(BaseModel):
    """发送验证码请求"""
    email: EmailStr = Field(..., description="邮箱地址")
    type: str = Field(..., description="验证码类型: register, reset_password, login, change_email")


class VerifyCodeRequest(BaseModel):
    """验证验证码请求"""
    email: EmailStr = Field(..., description="邮箱地址")
    code: str = Field(..., min_length=4, max_length=8, description="验证码")
    type: str = Field(..., description="验证码类型")


class VerificationCodeResponse(BaseModel):
    """验证码响应"""
    success: bool = Field(..., description="是否成功")
    message: str = Field(..., description="提示信息")
    expires_in: Optional[int] = Field(None, description="过期时间(秒)")


class RegisterWithEmailRequest(BaseModel):
    """邮箱注册请求"""
    email: EmailStr = Field(..., description="邮箱地址")
    code: str = Field(..., min_length=4, max_length=8, description="验证码")
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    password: str = Field(..., min_length=6, max_length=100, description="密码")


class ResetPasswordRequest(BaseModel):
    """重置密码请求"""
    email: EmailStr = Field(..., description="邮箱地址")
    code: str = Field(..., min_length=4, max_length=8, description="验证码")
    new_password: str = Field(..., min_length=6, max_length=100, description="新密码")


class EmailLoginRequest(BaseModel):
    """邮箱登录请求"""
    email: EmailStr = Field(..., description="邮箱地址")
    password: str = Field(..., description="密码")
