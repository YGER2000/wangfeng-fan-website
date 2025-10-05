from typing import List, Optional
from datetime import datetime

from ..models.like import LikeInDB, Like, LikeStats
from ..core.local_db import local_db


class LikeService:
    def __init__(self):
        self.db = local_db

    def toggle_like(self, post_id: str, user_id: str, username: str) -> dict:
        """切换点赞状态（点赞/取消点赞）"""
        try:
            # 检查用户是否已经点赞
            existing_like = self.db.find_like_by_user_and_post(user_id, post_id)
            
            if existing_like:
                # 已点赞，取消点赞
                self.db.delete_like(user_id, post_id)
                action = "unliked"
            else:
                # 未点赞，添加点赞
                like_data = {
                    "post_id": post_id,
                    "user_id": user_id,
                    "username": username
                }
                self.db.create_like(like_data)
                action = "liked"
            
            # 返回更新后的点赞统计
            like_stats = self.get_like_stats(post_id, user_id)
            return {
                "action": action,
                "stats": like_stats
            }
        except ValueError as e:
            raise e

    def get_like_stats(self, post_id: str, user_id: str = None) -> LikeStats:
        """获取文章的点赞统计"""
        likes = self.db.find_likes_by_post_id(post_id)
        like_count = len(likes)
        
        # 检查当前用户是否已点赞
        user_liked = False
        if user_id:
            user_liked = any(like['user_id'] == user_id for like in likes)
        
        # 获取最近点赞的用户名（最多显示5个）
        recent_likes = sorted(likes, key=lambda x: x['created_at'], reverse=True)[:5]
        recent_usernames = [like['username'] for like in recent_likes]
        
        return LikeStats(
            post_id=post_id,
            like_count=like_count,
            user_liked=user_liked,
            recent_likes=recent_usernames
        )

    def get_likes_by_post_id(self, post_id: str) -> List[LikeInDB]:
        """获取文章的所有点赞"""
        like_docs = self.db.find_likes_by_post_id(post_id)
        # 按创建时间排序，最新的在前
        like_docs.sort(key=lambda x: x['created_at'], reverse=True)
        return [LikeInDB(**doc) for doc in like_docs]

    def get_like_count_by_post_id(self, post_id: str) -> int:
        """获取文章的点赞数"""
        return self.db.count_likes_by_post_id(post_id)

    def check_user_liked(self, post_id: str, user_id: str) -> bool:
        """检查用户是否已点赞"""
        like = self.db.find_like_by_user_and_post(user_id, post_id)
        return like is not None