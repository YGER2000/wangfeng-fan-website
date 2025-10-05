from typing import List, Optional
from datetime import datetime

from ..models.comment import CommentInDB, Comment
from ..schemas.comment import CommentCreate, CommentUpdate
from ..core.local_db import local_db


class CommentService:
    def __init__(self):
        self.db = local_db

    def create_comment(self, comment_data: CommentCreate, user_id: str, username: str, user_full_name: str = None) -> CommentInDB:
        """创建新评论"""
        try:
            # 创建评论文档
            comment_doc = {
                "post_id": comment_data.post_id,
                "user_id": user_id,
                "username": username,
                "user_full_name": user_full_name,
                "content": comment_data.content,
            }
            
            created_comment = self.db.create_comment(comment_doc)
            return CommentInDB(**created_comment)
        except ValueError as e:
            raise e

    def get_comments_by_post_id(self, post_id: str) -> List[CommentInDB]:
        """根据文章ID获取评论列表"""
        comment_docs = self.db.find_comments_by_post_id(post_id)
        # 按创建时间排序，最新的在前
        comment_docs.sort(key=lambda x: x['created_at'], reverse=True)
        return [CommentInDB(**doc) for doc in comment_docs]

    def get_comment_by_id(self, comment_id: str) -> Optional[CommentInDB]:
        """根据评论ID获取评论"""
        comment_doc = self.db.find_comment_by_id(comment_id)
        if comment_doc and not comment_doc.get('is_deleted', False):
            return CommentInDB(**comment_doc)
        return None

    def update_comment(self, comment_id: str, comment_data: CommentUpdate, user_id: str) -> Optional[CommentInDB]:
        """更新评论（只有作者可以更新）"""
        # 先检查评论是否存在且属于当前用户
        existing_comment = self.get_comment_by_id(comment_id)
        if not existing_comment:
            return None
        
        if existing_comment.user_id != user_id:
            raise ValueError("无权限修改此评论")
        
        update_data = {
            "content": comment_data.content
        }
        
        updated_comment = self.db.update_comment(comment_id, update_data)
        if updated_comment:
            return CommentInDB(**updated_comment)
        return None

    def delete_comment(self, comment_id: str, user_id: str, user_role: str = None) -> bool:
        """删除评论（软删除）"""
        # 检查评论是否存在
        existing_comment = self.get_comment_by_id(comment_id)
        if not existing_comment:
            return False
        
        # 检查权限：评论作者或管理员可以删除
        if existing_comment.user_id != user_id and user_role not in ['admin', 'super_admin']:
            raise ValueError("无权限删除此评论")
        
        return self.db.delete_comment(comment_id)

    def get_comment_count_by_post_id(self, post_id: str) -> int:
        """获取文章的评论数"""
        comments = self.db.find_comments_by_post_id(post_id)
        return len(comments)