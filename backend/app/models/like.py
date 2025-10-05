from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class LikeInDB(BaseModel):
    """数据库中的点赞模型"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )
    
    id: str = Field(alias="_id")
    post_id: str = Field(..., description="博客文章ID")
    user_id: str = Field(..., description="点赞用户ID")
    username: str = Field(..., description="用户名")
    created_at: str = Field(description="创建时间 ISO 格式")


class Like(BaseModel):
    """点赞响应模型"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    post_id: str
    user_id: str
    username: str
    created_at: str


class LikeStats(BaseModel):
    """点赞统计模型"""
    post_id: str
    like_count: int
    user_liked: bool = False
    recent_likes: list[str] = Field(default_factory=list, description="最近点赞的用户名列表")