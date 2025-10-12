# -*- coding: utf-8 -*-
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    author: Optional[str] = "汪峰"
    category: str
    bvid: str
    publish_date: datetime

class VideoCreate(VideoBase):
    pass

class VideoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    bvid: Optional[str] = None
    publish_date: Optional[datetime] = None

class Video(VideoBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True