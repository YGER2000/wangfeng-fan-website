# -*- coding: utf-8 -*-
from pydantic import BaseModel, field_validator
from typing import Optional, List, Union
from datetime import datetime, date

class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    author: Optional[str] = "汪峰"
    category: str
    bvid: str
    publish_date: Union[datetime, date, str]  # 接受datetime、date或字符串格式
    cover_url: Optional[str] = None  # B站视频封面URL
    cover_local: Optional[str] = None  # 本地缓存的封面路径(640x480, 4:3)
    cover_thumb: Optional[str] = None  # 本地缓存的缩略图路径(480x360, 4:3)
    tags: List[str] = []  # 标签列表

    @field_validator('publish_date', mode='before')
    @classmethod
    def parse_publish_date(cls, v):
        if isinstance(v, str):
            # 尝试解析字符串为datetime
            try:
                return datetime.strptime(v, '%Y-%m-%d')
            except ValueError:
                try:
                    return datetime.fromisoformat(v)
                except ValueError:
                    raise ValueError('Invalid date format. Use YYYY-MM-DD or ISO format.')
        return v

class VideoCreate(VideoBase):
    # title可以为空，如果为空则从B站API获取
    title: Optional[str] = ""

class VideoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    bvid: Optional[str] = None
    publish_date: Optional[Union[datetime, date, str]] = None
    cover_url: Optional[str] = None
    cover_local: Optional[str] = None
    cover_thumb: Optional[str] = None
    tags: Optional[List[str]] = None  # 标签列表

    @field_validator('publish_date', mode='before')
    @classmethod
    def parse_publish_date(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            try:
                return datetime.strptime(v, '%Y-%m-%d')
            except ValueError:
                try:
                    return datetime.fromisoformat(v)
                except ValueError:
                    raise ValueError('Invalid date format. Use YYYY-MM-DD or ISO format.')
        return v

class Video(VideoBase):
    id: str
    author_id: Optional[str] = None
    is_published: int
    review_status: str
    reviewer_id: Optional[str] = None
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
