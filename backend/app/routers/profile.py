# -*- coding: utf-8 -*-
"""个人中心路由"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pathlib import Path
from datetime import datetime

from ..database import get_db
from ..models.user_db import User
from ..models.article import Article
from ..core.dependencies import get_current_user
from ..core.security import get_password_hash, verify_password
from ..utils.image_utils import compress_image
from ..schemas.user import UserResponse

router = APIRouter(prefix="/api/profile", tags=["profile"])


def get_default_avatar() -> str:
    """获取默认头像路径"""
    return "images/avatars/default-avatar.jpg"


def save_avatar(user_id: int, upload: UploadFile) -> tuple[str, str]:
    """
    保存用户头像（原图和压缩图）

    Args:
        user_id: 用户ID
        upload: 上传的文件

    Returns:
        tuple: (原图路径, 压缩图路径)
    """
    from ..utils.datetime_utils import get_beijing_now

    # 获取项目根目录
    backend_dir = Path(__file__).resolve().parents[2]
    project_root = backend_dir.parent
    avatar_dir = project_root / 'frontend' / 'public' / 'images' / 'avatars'

    # 确保目录存在
    avatar_dir.mkdir(parents=True, exist_ok=True)

    # 获取文件扩展名
    extension = Path(upload.filename or '').suffix.lower() or '.jpg'

    # 生成文件名：用户ID-头像.扩展名
    filename = f"{user_id}-头像{extension}"
    filename_thumb = f"{user_id}-头像-thumb.jpg"

    destination = avatar_dir / filename
    destination_thumb = avatar_dir / filename_thumb

    # 保存原图
    with destination.open('wb') as buffer:
        if hasattr(upload.file, 'seek'):
            upload.file.seek(0)
        content = upload.file.read()
        buffer.write(content)

    # 生成压缩图（100KB以下，用于显示）
    compress_image(destination, destination_thumb, max_size_kb=100)

    # 返回相对路径
    avatar_path = f"images/avatars/{filename}"
    avatar_thumb_path = f"images/avatars/{filename_thumb}"

    return avatar_path, avatar_thumb_path


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
    avatar = current_user.avatar if current_user.avatar else get_default_avatar()
    avatar_thumb = avatar.replace('.jpg', '-thumb.jpg').replace('.png', '-thumb.jpg') if current_user.avatar else avatar

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
        avatar_path, avatar_thumb_path = save_avatar(current_user.id, avatar)

        # 更新数据库
        current_user.avatar = avatar_path
        db.commit()

        return {
            "message": "头像上传成功",
            "avatar": avatar_path,
            "avatar_thumb": avatar_thumb_path
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
