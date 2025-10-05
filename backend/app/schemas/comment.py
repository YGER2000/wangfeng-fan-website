from pydantic import BaseModel, Field
from typing import Optional


class CommentCreate(BaseModel):
    """创建评论的请求模型"""
    post_id: str = Field(..., description="博客文章ID")
    content: str = Field(..., min_length=1, max_length=1000, description="评论内容")


class CommentUpdate(BaseModel):
    """更新评论的请求模型"""
    content: str = Field(..., min_length=1, max_length=1000, description="评论内容")


class CommentResponse(BaseModel):
    """评论响应模型"""
    id: str
    post_id: str
    user_id: str
    username: str
    user_full_name: Optional[str] = None
    content: str
    created_at: str
    updated_at: str