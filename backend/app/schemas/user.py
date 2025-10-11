from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from ..models.roles import UserRole


class UserCreate(BaseModel):
    """用户注册模式"""
    username: str = Field(..., min_length=1, max_length=50, description="昵称，支持中文，1-50个字符")
    email: EmailStr = Field(..., description="邮箱地址")
    password: str = Field(..., min_length=6, max_length=100, description="密码，至少6个字符")
    role: Optional[UserRole] = Field(default=UserRole.USER, description="用户角色（管理员注册时可指定）")


class UserLogin(BaseModel):
    """用户登录模式"""
    username: str = Field(..., description="用户名或邮箱")
    password: str = Field(..., description="密码")


class UserResponse(BaseModel):
    """用户响应模式"""
    id: int
    username: str
    email: str
    role: UserRole
    role_name: str = Field(description="角色中文名称")
    is_active: bool


class Token(BaseModel):
    """令牌响应模式"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """令牌数据模式"""
    username: Optional[str] = None