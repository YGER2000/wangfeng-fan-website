from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class CommentInDB(BaseModel):
    """数据库中的评论模型"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )
    
    id: str = Field(alias="_id")
    post_id: str = Field(..., description="博客文章ID")
    user_id: str = Field(..., description="评论用户ID")
    username: str = Field(..., description="用户名")
    user_full_name: Optional[str] = Field(None, description="用户全名")
    content: str = Field(..., min_length=1, max_length=1000, description="评论内容")
    created_at: str = Field(description="创建时间 ISO 格式")
    updated_at: str = Field(description="更新时间 ISO 格式")
    is_deleted: bool = Field(default=False, description="是否删除")


class Comment(BaseModel):
    """评论响应模型"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    post_id: str
    user_id: str
    username: str
    user_full_name: Optional[str] = None
    content: str
    created_at: str
    updated_at: str