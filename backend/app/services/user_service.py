from typing import Optional
from datetime import datetime

from ..models.user import UserInDB, User
from ..models.roles import UserRole
from ..schemas.user import UserCreate
from ..core.security import get_password_hash, verify_password
from ..core.local_db import local_db


class UserService:
    def __init__(self):
        self.db = local_db

    def create_user(self, user_data: UserCreate) -> UserInDB:
        """创建新用户"""
        try:
            # 创建用户文档
            user_doc = {
                "username": user_data.username,
                "email": user_data.email,
                "hashed_password": get_password_hash(user_data.password),
                "full_name": user_data.full_name,
                "role": user_data.role or UserRole.USER,
                "is_active": True,
            }
            
            created_user = self.db.create_user(user_doc)
            return UserInDB(**created_user)
        except ValueError as e:
            raise e

    def get_user_by_username(self, username: str) -> Optional[UserInDB]:
        """根据用户名获取用户"""
        user_doc = self.db.find_user_by_username(username)
        if user_doc:
            return UserInDB(**user_doc)
        return None

    def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        """根据邮箱获取用户"""
        user_doc = self.db.find_user_by_email(email)
        if user_doc:
            return UserInDB(**user_doc)
        return None

    def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        """根据ID获取用户"""
        user_doc = self.db.find_user_by_id(user_id)
        if user_doc:
            return UserInDB(**user_doc)
        return None

    def authenticate_user(self, username: str, password: str) -> Optional[UserInDB]:
        """验证用户凭据"""
        # 尝试用户名登录
        user = self.get_user_by_username(username)
        
        # 如果用户名不存在，尝试邮箱登录
        if not user:
            user = self.get_user_by_email(username)
        
        if not user:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        return user

    def update_user_last_login(self, user_id: str):
        """更新用户最后登录时间"""
        self.db.update_user(user_id, {"updated_at": datetime.utcnow().isoformat()})

    def create_super_admin(self, username: str, email: str, password: str, full_name: str = None):
        """创建超级管理员账户"""
        # 检查超级管理员是否已存在
        existing_admin = self.db.find_user_by_role(UserRole.SUPER_ADMIN)
        if existing_admin:
            return None  # 超级管理员已存在
        
        try:
            # 创建超级管理员文档
            admin_doc = {
                "username": username,
                "email": email,
                "hashed_password": get_password_hash(password),
                "full_name": full_name,
                "role": UserRole.SUPER_ADMIN,
                "is_active": True,
            }
            
            created_admin = self.db.create_user(admin_doc)
            return UserInDB(**created_admin)
        except ValueError as e:
            raise e

    def get_user_count_by_role(self, role: UserRole) -> int:
        """获取指定角色的用户数量"""
        return self.db.count_users_by_role(role)