# -*- coding: utf-8 -*-
"""管理员功能相关的Pydantic Schema"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from ..models.admin_log import LogActionType, LogResourceType
from ..models.article import ReviewStatus
from ..models.user_db import UserStatus
from ..models.roles import UserRole


# ============= Admin Log Schemas =============
class AdminLogBase(BaseModel):
    """管理员日志基础模型"""
    action: LogActionType
    resource_type: LogResourceType
    resource_id: Optional[str] = None
    description: Optional[str] = None
    details: Optional[str] = None  # JSON string


class AdminLogCreate(AdminLogBase):
    """创建管理员日志"""
    operator_id: str
    operator_username: str
    operator_role: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class AdminLogResponse(AdminLogBase):
    """管理员日志响应"""
    id: str
    operator_id: str
    operator_username: str
    operator_role: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============= Article Review Schemas =============
class ArticleReviewAction(BaseModel):
    """文章审核操作"""
    review_notes: Optional[str] = Field(None, max_length=500, description="审核备注")


class ArticleAdminResponse(BaseModel):
    """管理员查看文章响应"""
    id: str
    title: str
    slug: str
    excerpt: Optional[str]
    author: str
    author_id: Optional[str]
    category_primary: str
    category_secondary: str
    review_status: ReviewStatus
    reviewer_id: Optional[str]
    review_notes: Optional[str]
    reviewed_at: Optional[datetime]
    is_published: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    view_count: int

    class Config:
        from_attributes = True


# ============= User Management Schemas =============
class UserUpdateRole(BaseModel):
    """更新用户角色"""
    role: UserRole = Field(..., description="新角色")


class UserBanAction(BaseModel):
    """封禁用户操作"""
    reason: Optional[str] = Field(None, max_length=500, description="封禁原因")


class UserUnbanAction(BaseModel):
    """解封用户操作"""
    reason: Optional[str] = Field(None, max_length=500, description="解封原因")


class UserAdminResponse(BaseModel):
    """管理员查看用户响应"""
    id: str
    username: str
    email: str
    full_name: Optional[str]
    role: UserRole
    status: UserStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True


# ============= Schedule Management Schemas =============
class ScheduleAdminResponse(BaseModel):
    """管理员查看行程响应"""
    id: str
    title: str
    venue: str
    city: str
    event_date: datetime
    ticket_url: Optional[str]
    is_published: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
