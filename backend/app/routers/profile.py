# -*- coding: utf-8 -*-
"""个人中心路由"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import shutil
import tempfile
from pathlib import Path
from typing import Optional

from ..database import get_db
from ..models.user_db import User
from ..models.article import Article
from ..core.dependencies import get_current_user
from ..core.security import get_password_hash, verify_password
from ..utils.image_utils import compress_image
from ..services.storage_service import (
    get_storage_service,
    generate_avatar_keys
)

router = APIRouter(prefix="/api/profile", tags=["profile"])


def get_default_avatar() -> str:
    """获取默认头像路径"""
    return "images/avatars/default-avatar.jpg"


def _derive_thumb_key(original_key: str) -> str:
    """根据原图键推导缩略图键"""
    if '/' in original_key:
        directory, filename = original_key.rsplit('/', 1)
    else:
        directory, filename = '', original_key

    name, _ = os.path.splitext(filename)
    base_name = name[:-9] if name.endswith('_original') else name
    thumb_filename = f"{base_name}_thumb.jpg"
    return f"{directory}/{thumb_filename}" if directory else thumb_filename


def _resolve_avatar_urls(avatar_value: Optional[str]) -> tuple[str, str]:
    """根据存储值返回原图和缩略图URL/路径"""
    if not avatar_value:
        default = get_default_avatar()
        return default, default

    # 新的存储键形式（avatars/...）
    if avatar_value.startswith('avatars/'):
        storage = get_storage_service()
        original_url = storage.get_file_url(avatar_value)
        thumb_key = _derive_thumb_key(avatar_value)
        thumb_url = storage.get_file_url(thumb_key)
        return original_url, thumb_url

    # 已是完整URL
    if avatar_value.startswith('http://') or avatar_value.startswith('https://'):
        thumb_url = avatar_value
        if '_original' in avatar_value:
            thumb_url = avatar_value.replace('_original', '_thumb')
        return avatar_value, thumb_url

    # 兼容旧的相对路径（images/avatars/xxx.jpg）
    relative_path = avatar_value.lstrip('/')
    thumb_path = relative_path
    for ext in ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'):
        if relative_path.lower().endswith(ext):
            thumb_path = f"{relative_path[:-len(ext)]}-thumb.jpg"
            break

    return relative_path, thumb_path


def save_avatar(user_id: int, upload: UploadFile) -> tuple[str, str, str, str]:
    """保存头像到配置的存储服务，返回键和值"""
    temp_dir = Path(tempfile.mkdtemp(prefix="avatar-"))
    storage = get_storage_service()

    try:
        extension = Path(upload.filename or '').suffix.lower()
        if extension not in {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'}:
            extension = '.jpg'

        original_temp_path = temp_dir / f"original{extension}"
        if hasattr(upload.file, 'seek'):
            upload.file.seek(0)
        original_content = upload.file.read()
        original_temp_path.write_bytes(original_content)

        thumb_temp_path = temp_dir / "thumb.jpg"
        compressed = compress_image(original_temp_path, thumb_temp_path, max_size_kb=100)
        if not compressed:
            thumb_temp_path.write_bytes(original_content)

        avatar_key, thumb_key = generate_avatar_keys(user_id, extension)
        avatar_url = storage.upload_file(str(original_temp_path), avatar_key)
        thumb_url = storage.upload_file(str(thumb_temp_path), thumb_key)

        return avatar_key, thumb_key, avatar_url, thumb_url
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@router.get("/me")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的个人信息和统计数据"""

    # 统计用户发布的文章数
    article_count = db.query(func.count(Article.id)).filter(
        Article.author_id == str(current_user.id)
    ).scalar() or 0

    # 获取用户头像，如果没有则返回默认头像
    avatar, avatar_thumb = _resolve_avatar_urls(current_user.avatar)

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "avatar": avatar,
        "avatar_thumb": avatar_thumb,
        "role": current_user.role,
        "status": current_user.status,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
        "stats": {
            "article_count": article_count,
        }
    }


@router.post("/avatar")
async def upload_avatar(
    avatar: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """上传/更换用户头像"""

    # 验证文件类型
    if not avatar.content_type or not avatar.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="只支持图片文件")

    # 验证文件大小（最大10MB）
    content = await avatar.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="文件大小不能超过10MB")

    # 重置文件指针
    await avatar.seek(0)

    try:
        # 保存头像
        avatar_key, _thumb_key, avatar_url, avatar_thumb_url = save_avatar(current_user.id, avatar)

        # 更新数据库
        current_user.avatar = avatar_key
        db.commit()

        return {
            "message": "头像上传成功",
            "avatar": avatar_url,
            "avatar_thumb": avatar_thumb_url
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"头像上传失败: {str(e)}")


@router.put("/password")
async def change_password(
    old_password: str = Form(...),
    new_password: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """修改密码"""

    # 验证旧密码
    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="旧密码错误")

    # 验证新密码长度
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="新密码长度不能少于6位")

    # 更新密码
    try:
        current_user.hashed_password = get_password_hash(new_password)
        db.commit()

        return {"message": "密码修改成功"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"密码修改失败: {str(e)}")


@router.get("/my-articles")
async def get_my_articles(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取我发布的文章列表"""

    articles = db.query(Article).filter(
        Article.author_id == str(current_user.id)
    ).order_by(Article.created_at.desc()).offset(skip).limit(limit).all()

    total = db.query(func.count(Article.id)).filter(
        Article.author_id == str(current_user.id)
    ).scalar() or 0

    return {
        "articles": [
            {
                "id": article.id,
                "title": article.title,
                "slug": article.slug,
                "excerpt": article.excerpt,
                "category_primary": article.category_primary,
                "category_secondary": article.category_secondary,
                "status": article.status,
                "review_status": article.review_status,
                "is_published": article.is_published,
                "created_at": article.created_at.isoformat() if article.created_at else None,
                "updated_at": article.updated_at.isoformat() if article.updated_at else None,
            }
            for article in articles
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }
