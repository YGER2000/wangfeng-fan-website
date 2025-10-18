"""Tag Schemas"""
from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field


class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description='标签名称')
    description: Optional[str] = Field(default=None, description='标签描述')


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100, description='标签名称')
    description: Optional[str] = Field(default=None, description='标签描述')


class TagResponse(TagBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


ContentType = Literal['video', 'article', 'gallery', 'schedule', 'music']


class ContentTagCreate(BaseModel):
    tag_id: int = Field(..., description='标签ID')
    content_type: ContentType = Field(..., description='内容类型')
    content_id: int = Field(..., description='内容ID')


class ContentTagResponse(BaseModel):
    id: int
    tag_id: int
    content_type: str
    content_id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class ContentWithTags(BaseModel):
    """带标签的内容"""
    id: int
    type: ContentType
    title: str
    url: Optional[str] = None
    thumbnail: Optional[str] = None
    tags: List[TagResponse] = []


class TagWithContents(BaseModel):
    """标签及其关联的所有内容"""
    tag: TagResponse
    videos: List[dict] = []
    articles: List[dict] = []
    galleries: List[dict] = []
