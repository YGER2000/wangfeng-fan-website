import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Optional, Any
from pathlib import Path


class LocalDatabase:
    """本地JSON文件数据库"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.users_file = self.data_dir / "users.json"
        self.comments_file = self.data_dir / "comments.json"
        self.likes_file = self.data_dir / "likes.json"
        
        # 如果文件不存在，创建空数据
        if not self.users_file.exists():
            self._save_users([])
        if not self.comments_file.exists():
            self._save_comments([])
        if not self.likes_file.exists():
            self._save_likes([])
    
    def _load_users(self) -> List[Dict[str, Any]]:
        """加载用户数据"""
        try:
            with open(self.users_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def _save_users(self, users: List[Dict[str, Any]]) -> None:
        """保存用户数据"""
        with open(self.users_file, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2, default=str)
    
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建新用户"""
        users = self._load_users()
        
        # 检查用户名是否已存在
        if any(user['username'] == user_data['username'] for user in users):
            raise ValueError("用户名已存在")
        
        # 检查邮箱是否已存在
        if any(user['email'] == user_data['email'] for user in users):
            raise ValueError("邮箱已被注册")
        
        # 创建新用户
        new_user = {
            "_id": str(uuid.uuid4()),
            **user_data,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        users.append(new_user)
        self._save_users(users)
        
        return new_user
    
    def find_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """根据用户名查找用户"""
        users = self._load_users()
        return next((user for user in users if user['username'] == username), None)
    
    def find_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """根据邮箱查找用户"""
        users = self._load_users()
        return next((user for user in users if user['email'] == email), None)
    
    def find_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """根据ID查找用户"""
        users = self._load_users()
        return next((user for user in users if user['_id'] == user_id), None)
    
    def find_user_by_role(self, role: str) -> Optional[Dict[str, Any]]:
        """根据角色查找用户"""
        users = self._load_users()
        return next((user for user in users if user.get('role') == role), None)
    
    def count_users_by_role(self, role: str) -> int:
        """统计指定角色的用户数量"""
        users = self._load_users()
        return len([user for user in users if user.get('role') == role])
    
    def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新用户信息"""
        users = self._load_users()
        
        for i, user in enumerate(users):
            if user['_id'] == user_id:
                users[i].update(update_data)
                users[i]['updated_at'] = datetime.utcnow().isoformat()
                self._save_users(users)
                return users[i]
        
        return None
    
    def get_all_users(self) -> List[Dict[str, Any]]:
        """获取所有用户"""
        return self._load_users()
    
    def delete_user(self, user_id: str) -> bool:
        """删除用户"""
        users = self._load_users()
        original_length = len(users)
        users = [user for user in users if user['_id'] != user_id]
        
        if len(users) != original_length:
            self._save_users(users)
            return True
        return False

    # === 评论相关方法 ===
    
    def _load_comments(self) -> List[Dict[str, Any]]:
        """加载评论数据"""
        try:
            with open(self.comments_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def _save_comments(self, comments: List[Dict[str, Any]]) -> None:
        """保存评论数据"""
        with open(self.comments_file, 'w', encoding='utf-8') as f:
            json.dump(comments, f, ensure_ascii=False, indent=2, default=str)
    
    def create_comment(self, comment_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建新评论"""
        comments = self._load_comments()
        
        new_comment = {
            "_id": str(uuid.uuid4()),
            **comment_data,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "is_deleted": False
        }
        
        comments.append(new_comment)
        self._save_comments(comments)
        return new_comment
    
    def find_comments_by_post_id(self, post_id: str) -> List[Dict[str, Any]]:
        """根据文章ID查找评论"""
        comments = self._load_comments()
        return [comment for comment in comments 
                if comment['post_id'] == post_id and not comment.get('is_deleted', False)]
    
    def find_comment_by_id(self, comment_id: str) -> Optional[Dict[str, Any]]:
        """根据评论ID查找评论"""
        comments = self._load_comments()
        return next((comment for comment in comments if comment['_id'] == comment_id), None)
    
    def update_comment(self, comment_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新评论"""
        comments = self._load_comments()
        
        for i, comment in enumerate(comments):
            if comment['_id'] == comment_id:
                comments[i].update(update_data)
                comments[i]['updated_at'] = datetime.utcnow().isoformat()
                self._save_comments(comments)
                return comments[i]
        return None
    
    def delete_comment(self, comment_id: str) -> bool:
        """软删除评论"""
        comments = self._load_comments()
        
        for i, comment in enumerate(comments):
            if comment['_id'] == comment_id:
                comments[i]['is_deleted'] = True
                comments[i]['updated_at'] = datetime.utcnow().isoformat()
                self._save_comments(comments)
                return True
        return False

    # === 点赞相关方法 ===
    
    def _load_likes(self) -> List[Dict[str, Any]]:
        """加载点赞数据"""
        try:
            with open(self.likes_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def _save_likes(self, likes: List[Dict[str, Any]]) -> None:
        """保存点赞数据"""
        with open(self.likes_file, 'w', encoding='utf-8') as f:
            json.dump(likes, f, ensure_ascii=False, indent=2, default=str)
    
    def create_like(self, like_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建点赞"""
        likes = self._load_likes()
        
        # 检查是否已经点赞
        existing_like = next((like for like in likes 
                            if like['post_id'] == like_data['post_id'] 
                            and like['user_id'] == like_data['user_id']), None)
        
        if existing_like:
            raise ValueError("用户已经点赞过此文章")
        
        new_like = {
            "_id": str(uuid.uuid4()),
            **like_data,
            "created_at": datetime.utcnow().isoformat()
        }
        
        likes.append(new_like)
        self._save_likes(likes)
        return new_like
    
    def find_likes_by_post_id(self, post_id: str) -> List[Dict[str, Any]]:
        """根据文章ID查找点赞"""
        likes = self._load_likes()
        return [like for like in likes if like['post_id'] == post_id]
    
    def find_like_by_user_and_post(self, user_id: str, post_id: str) -> Optional[Dict[str, Any]]:
        """查找用户对特定文章的点赞"""
        likes = self._load_likes()
        return next((like for like in likes 
                   if like['user_id'] == user_id and like['post_id'] == post_id), None)
    
    def delete_like(self, user_id: str, post_id: str) -> bool:
        """删除点赞（取消点赞）"""
        likes = self._load_likes()
        original_length = len(likes)
        likes = [like for like in likes 
                if not (like['user_id'] == user_id and like['post_id'] == post_id)]
        
        if len(likes) != original_length:
            self._save_likes(likes)
            return True
        return False
    
    def count_likes_by_post_id(self, post_id: str) -> int:
        """统计文章的点赞数"""
        likes = self._load_likes()
        return len([like for like in likes if like['post_id'] == post_id])


# 全局数据库实例
local_db = LocalDatabase()