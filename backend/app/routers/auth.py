from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from ..schemas.user import UserCreate, UserLogin, UserResponse, Token
from ..services.user_service_mysql import UserServiceMySQL
from ..core.dependencies import get_user_service, get_current_active_user
from ..core.security import create_access_token
from ..core.config import get_settings
from ..models.user_db import User
from ..models.roles import UserRole

router = APIRouter(prefix="/api/auth", tags=["认证"])
settings = get_settings()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreate,
    user_service: UserServiceMySQL = Depends(get_user_service)
):
    """用户注册"""
    try:
        user = user_service.create_user(user_data)
        return UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            role_name=UserRole.get_chinese_name(user.role),
            is_active=user.is_active
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=Token)
def login(
    user_data: UserLogin,
    user_service: UserServiceMySQL = Depends(get_user_service)
):
    """用户登录"""
    user = user_service.authenticate_user(user_data.username, user_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户已被禁用"
        )

    # 更新最后登录时间
    user_service.update_user_last_login(str(user.id))

    # 创建访问令牌
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_service: UserServiceMySQL = Depends(get_user_service)
):
    """OAuth2兼容的令牌登录端点"""
    user = user_service.authenticate_user(form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    """获取当前用户信息"""
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        role_name=UserRole.get_chinese_name(current_user.role),
        is_active=current_user.is_active
    )


@router.post("/init-super-admin", response_model=UserResponse)
def init_super_admin(user_service: UserServiceMySQL = Depends(get_user_service)):
    """初始化超级管理员账户 root/123456"""
    try:
        # 创建超级管理员 root/123456
        super_admin = user_service.create_super_admin(
            username="root",
            email="root@wangfeng.fan",
            password="123456",
            full_name="超级管理员"
        )

        if super_admin is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="超级管理员已存在"
            )

        return UserResponse(
            id=str(super_admin.id),
            username=super_admin.username,
            email=super_admin.email,
            full_name=super_admin.full_name,
            role=super_admin.role,
            role_name=UserRole.get_chinese_name(super_admin.role),
            is_active=super_admin.is_active
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )