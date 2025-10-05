from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .security import verify_token
from ..services.user_service_mysql import UserServiceMySQL
from ..services.comment_service import CommentService
from ..services.like_service import LikeService
from ..services.schedule_service_mysql import ScheduleServiceMySQL
from ..models.user_db import User
from ..database import get_db

security = HTTPBearer()


def get_user_service(db: Session = Depends(get_db)) -> UserServiceMySQL:
    """获取用户服务"""
    return UserServiceMySQL(db)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    user_service: UserServiceMySQL = Depends(get_user_service)
) -> User:
    """获取当前认证用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    username = verify_token(token)

    if username is None:
        raise credentials_exception

    user = user_service.get_user_by_username(username)
    if user is None:
        raise credentials_exception

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """获取当前活跃用户"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="用户已被禁用")
    return current_user


def get_comment_service() -> CommentService:
    """获取评论服务"""
    return CommentService()


def get_like_service() -> LikeService:
    """获取点赞服务"""
    return LikeService()


def get_schedule_service(db: Session = Depends(get_db)) -> ScheduleServiceMySQL:
    """获取行程服务"""
    return ScheduleServiceMySQL(db)


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    user_service: UserServiceMySQL = Depends(get_user_service)
) -> Optional[User]:
    """获取可选的当前用户（用于游客也可访问的端点）"""
    if not credentials:
        return None

    token = credentials.credentials
    username = verify_token(token)

    if username is None:
        return None

    user = user_service.get_user_by_username(username)
    return user
