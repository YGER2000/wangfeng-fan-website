from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field, EmailStr, model_validator, ConfigDict
from .roles import UserRole


class UserInDB(BaseModel):
    """数据库中的用户模型"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )
    
    id: str = Field(alias="_id")
    username: str = Field(..., min_length=1, max_length=50, description="支持中文用户名")
    email: EmailStr
    hashed_password: str
    full_name: Optional[str] = None
    role: UserRole = Field(default=UserRole.USER, description="用户角色")
    is_active: bool = True
    created_at: str = Field(description="创建时间 ISO 格式")
    updated_at: str = Field(description="更新时间 ISO 格式")


class User(BaseModel):
    """用户响应模型（不包含密码）"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: str