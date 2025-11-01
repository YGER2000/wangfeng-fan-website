"""Tag Schemas"""
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TagCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description='标签种类名称')
    description: Optional[str] = Field(default=None, description='标签种类描述')


class TagCategoryCreate(TagCategoryBase):
    pass


class TagCategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100, description='标签种类名称')
    description: Optional[str] = Field(default=None, description='标签种类描述')


class TagCategoryResponse(TagCategoryBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TagBase(BaseModel):
    value: str = Field(..., min_length=1, max_length=150, description='标签值')
    description: Optional[str] = Field(default=None, description='标签描述')


class TagCreate(TagBase):
    category_id: Optional[int] = Field(default=None, ge=1, description='标签种类ID')
    category_name: Optional[str] = Field(default=None, min_length=1, max_length=100, description='标签种类名称')

    @model_validator(mode='after')
    def validate_category(cls, model: 'TagCreate'):
        if not model.category_id and not model.category_name:
            raise ValueError('创建标签时必须提供标签种类ID或标签种类名称')
        return model


class TagUpdate(BaseModel):
    category_id: Optional[int] = Field(default=None, ge=1, description='标签种类ID')
    category_name: Optional[str] = Field(default=None, min_length=1, max_length=100, description='标签种类名称')
    value: Optional[str] = Field(default=None, min_length=1, max_length=150, description='标签值')
    description: Optional[str] = Field(default=None, description='标签描述')


class TagResponse(BaseModel):
    id: int
    category_id: int
    category_name: Optional[str] = None
    value: str
    name: str
    display_name: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


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

    model_config = ConfigDict(from_attributes=True)


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
