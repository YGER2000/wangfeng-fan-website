from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ArticleBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    excerpt: Optional[str] = None
    author: str = Field(default="汪峰", max_length=100)

    # 新的二级分类系统
    category_primary: str = Field(default="峰言峰语", max_length=50)  # 一级分类
    category_secondary: str = Field(default="汪峰博客", max_length=50)  # 二级分类
    category: str = Field(default="个人感悟", max_length=50)  # 保留兼容

    tags: List[str] = Field(default_factory=list)
    meta_description: Optional[str] = Field(None, max_length=160)
    meta_keywords: Optional[str] = Field(None, max_length=255)

class ArticleCreate(ArticleBase):
    pass

class ArticleUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    excerpt: Optional[str] = None
    author: Optional[str] = Field(None, max_length=100)
    category_primary: Optional[str] = Field(None, max_length=50)
    category_secondary: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = None
    meta_description: Optional[str] = Field(None, max_length=160)
    meta_keywords: Optional[str] = Field(None, max_length=255)
    is_published: Optional[bool] = None

class ArticleInDBBase(ArticleBase):
    id: str
    slug: str
    is_published: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]
    view_count: int
    like_count: int

    class Config:
        from_attributes = True

class Article(ArticleInDBBase):
    pass

class ArticleInDB(ArticleInDBBase):
    pass

# 用于列表页面的简化版本
class ArticleSummary(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: Optional[str]
    author: str
    category_primary: str
    category_secondary: str
    category: str
    tags: List[str]
    is_published: bool
    created_at: datetime
    published_at: Optional[datetime]
    view_count: int
    like_count: int

    class Config:
        from_attributes = True