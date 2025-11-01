# -*- coding: utf-8 -*-
"""图片画廊 Pydantic Schemas"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PhotoBase(BaseModel):
    """照片基础Schema"""
    title: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 0


class PhotoCreate(PhotoBase):
    """创建照片Schema"""
    photo_group_id: str
    original_filename: str
    image_url: str
    image_thumb_url: Optional[str] = None
    image_medium_url: Optional[str] = None
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    mime_type: Optional[str] = None
    storage_type: str = "local"
    storage_path: str


class PhotoUpdate(BaseModel):
    """更新照片Schema"""
    title: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None


class Photo(PhotoBase):
    """照片完整Schema"""
    id: str
    photo_group_id: str
    original_filename: Optional[str]
    image_url: str
    image_thumb_url: Optional[str]
    image_medium_url: Optional[str]
    file_size: Optional[int]
    width: Optional[int]
    height: Optional[int]
    mime_type: Optional[str]
    storage_type: str
    storage_path: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PhotoGroupBase(BaseModel):
    """照片组基础Schema"""
    title: str
    category: str
    date: datetime
    display_date: Optional[str] = None
    year: Optional[str] = None
    description: Optional[str] = None


class PhotoGroupCreate(PhotoGroupBase):
    """创建照片组Schema"""
    cover_image_url: Optional[str] = None
    cover_image_thumb_url: Optional[str] = None
    storage_type: str = "local"
    is_published: bool = True
    author_id: Optional[str] = None
    review_status: Optional[str] = 'pending'


class PhotoGroupUpdate(BaseModel):
    """更新照片组Schema"""
    title: Optional[str] = None
    category: Optional[str] = None
    date: Optional[datetime] = None
    display_date: Optional[str] = None
    year: Optional[str] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    cover_image_thumb_url: Optional[str] = None
    is_published: Optional[bool] = None


class PhotoGroup(PhotoGroupBase):
    """照片组完整Schema"""
    id: str
    cover_image_url: Optional[str]
    cover_image_thumb_url: Optional[str]
    storage_type: str
    is_published: bool
    is_deleted: bool
    author_id: Optional[str]
    review_status: str
    reviewer_id: Optional[str] = None
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    photo_count: int = 0  # 照片数量
    created_by: Optional[str] = None  # 创建者名称
    tags: List[str] = []  # 标签列表

    class Config:
        from_attributes = True


class PhotoGroupWithPhotos(PhotoGroup):
    """照片组及其包含的所有照片"""
    photos: List[Photo] = []

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    """文件上传响应"""
    success: bool
    message: str
    file_url: Optional[str] = None
    thumb_url: Optional[str] = None
    medium_url: Optional[str] = None
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
