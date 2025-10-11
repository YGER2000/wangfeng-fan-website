"""MySQL-based User Service"""
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from ..models.user_db import User
from ..models.roles import UserRole
from ..schemas.user import UserCreate
from ..core.security import get_password_hash, verify_password


class UserServiceMySQL:
    """MySQL 用户服务"""

    def __init__(self, db: Session):
        self.db = db

    def create_user(self, user_data: UserCreate) -> User:
        """创建新用户"""
        # 检查用户名是否已存在
        existing_user = self.db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            raise ValueError("用户名已存在")

        # 检查邮箱是否已存在
        existing_email = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise ValueError("邮箱已被注册")

        # 创建新用户
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            role=user_data.role or UserRole.USER,
            is_active=True
        )

        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)

        return db_user

    def get_user_by_username(self, username: str) -> Optional[User]:
        """根据用户名获取用户"""
        return self.db.query(User).filter(User.username == username).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """根据邮箱获取用户"""
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """根据ID获取用户"""
        return self.db.query(User).filter(User.id == user_id).first()

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
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

    def update_user_last_login(self, user_id: int):
        """更新用户最后登录时间"""
        user = self.get_user_by_id(user_id)
        if user:
            user.last_login = datetime.utcnow()
            user.updated_at = datetime.utcnow()
            self.db.commit()

    def create_super_admin(self, username: str, email: str, password: str) -> Optional[User]:
        """创建超级管理员账户"""
        # 检查超级管理员是否已存在
        existing_admin = self.db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        if existing_admin:
            return None  # 超级管理员已存在

        # 检查用户名是否已存在
        existing_user = self.get_user_by_username(username)
        if existing_user:
            raise ValueError(f"用户名 '{username}' 已存在")

        # 检查邮箱是否已存在
        existing_email = self.get_user_by_email(email)
        if existing_email:
            raise ValueError(f"邮箱 '{email}' 已被注册")

        # 创建超级管理员
        super_admin = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )

        self.db.add(super_admin)
        self.db.commit()
        self.db.refresh(super_admin)

        return super_admin

    def get_all_users(self, skip: int = 0, limit: int = 100) -> list[User]:
        """获取所有用户（分页）"""
        return self.db.query(User).offset(skip).limit(limit).all()

    def update_user_role(self, user_id: int, new_role: UserRole) -> Optional[User]:
        """更新用户角色"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None

        user.role = new_role
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)

        return user

    def deactivate_user(self, user_id: int) -> Optional[User]:
        """禁用用户"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None

        user.is_active = False
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)

        return user

    def activate_user(self, user_id: int) -> Optional[User]:
        """激活用户"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None

        user.is_active = True
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)

        return user

    def update_user_password(self, user_id: int, new_password: str) -> Optional[User]:
        """更新用户密码"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None

        user.hashed_password = get_password_hash(new_password)
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)

        return user

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """验证密码"""
        return verify_password(plain_password, hashed_password)
