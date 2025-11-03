# -*- coding: utf-8 -*-
"""文章图片上传路由 - 支持封面和配图上传"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
import os
import tempfile
from pathlib import Path

from ..database import get_db
from ..core.permissions import require_admin
from ..core.dependencies import get_current_user
from ..models.user_db import User
from ..schemas.gallery import UploadResponse
from ..services.image_processing import ImageProcessor
from ..services.storage_service import (
    get_storage_service,
    generate_article_cover_path,
    generate_article_image_path
)

router = APIRouter(prefix="/api/articles/upload", tags=["article_upload"])


@router.post("/cover", response_model=UploadResponse)
async def upload_article_cover(
    article_id: str = Form(..., description="文章ID"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    上传文章封面图片
    - 生成 3 种尺寸: original, medium, thumb
    - 自动上传到 OSS
    - 返回 3 个尺寸的 URL
    """
    # 验证文件类型
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型：{file.content_type}，仅支持 JPEG, PNG, WebP"
        )

    # 验证文件大小（最大20MB）
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="文件大小不能超过 20MB")

    temp_dir = None
    try:
        # 1. 保存临时文件
        temp_dir = tempfile.mkdtemp()
        temp_input_path = os.path.join(temp_dir, file.filename or "cover.jpg")

        with open(temp_input_path, 'wb') as f:
            f.write(content)

        # 2. 处理图片（生成 3 种尺寸）
        temp_output_dir = os.path.join(temp_dir, "processed")
        original_path, medium_path, thumb_path, width, height = ImageProcessor.process_image(
            input_path=temp_input_path,
            output_dir=temp_output_dir,
            filename_base=article_id  # 使用文章ID作为基础文件名
        )

        # 3. 上传到OSS（使用新的可读性命名）
        storage = get_storage_service()

        # 上传 3 种尺寸
        original_oss_path = generate_article_cover_path(article_id, "original")
        medium_oss_path = generate_article_cover_path(article_id, "medium")
        thumb_oss_path = generate_article_cover_path(article_id, "thumb")

        original_url = storage.upload_file(original_path, original_oss_path)
        medium_url = storage.upload_file(medium_path, medium_oss_path)
        thumb_url = storage.upload_file(thumb_path, thumb_oss_path)

        # 4. 获取文件信息
        file_size = ImageProcessor.get_file_size(original_path)

        # 5. 返回结果
        return UploadResponse(
            success=True,
            message="文章封面上传成功",
            file_url=original_url,
            thumb_url=thumb_url,
            medium_url=medium_url,
            file_size=file_size,
            width=width,
            height=height
        )

    except Exception as e:
        import traceback
        error_detail = f"上传失败：{str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=f"上传失败：{str(e)}")

    finally:
        # 清理临时文件
        if temp_dir and os.path.exists(temp_dir):
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)


@router.post("/image", response_model=UploadResponse)
async def upload_article_image(
    article_id: str = Form(..., description="文章ID"),
    category_primary: str = Form(..., description="文章一级分类"),
    sequence: int = Form(..., description="图片序号（从1开始）"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    上传文章配图（内嵌图片）
    - 生成 3 种尺寸: original, medium, thumb
    - 自动上传到 OSS
    - 返回 3 个尺寸的 URL，其中 file_url 是 original，thumb_url 是 thumb，medium_url 是 medium
    """
    # 验证文件类型
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型：{file.content_type}，仅支持 JPEG, PNG, WebP"
        )

    # 验证文件大小（最大20MB）
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="文件大小不能超过 20MB")

    temp_dir = None
    try:
        # 1. 保存临时文件
        temp_dir = tempfile.mkdtemp()
        temp_input_path = os.path.join(temp_dir, file.filename or "image.jpg")

        with open(temp_input_path, 'wb') as f:
            f.write(content)

        # 2. 处理图片（生成 3 种尺寸）
        # 使用 article_id_sequence 作为文件名基础，便于查找
        filename_base = f"{article_id}_seq{sequence:03d}"
        temp_output_dir = os.path.join(temp_dir, "processed")
        original_path, medium_path, thumb_path, width, height = ImageProcessor.process_image(
            input_path=temp_input_path,
            output_dir=temp_output_dir,
            filename_base=filename_base
        )

        # 3. 上传到OSS（使用新的可读性命名）
        storage = get_storage_service()

        # 上传 3 种尺寸
        original_oss_path = generate_article_image_path(category_primary, article_id, sequence, "original")
        medium_oss_path = generate_article_image_path(category_primary, article_id, sequence, "medium")
        thumb_oss_path = generate_article_image_path(category_primary, article_id, sequence, "thumb")

        original_url = storage.upload_file(original_path, original_oss_path)
        medium_url = storage.upload_file(medium_path, medium_oss_path)
        thumb_url = storage.upload_file(thumb_path, thumb_oss_path)

        # 4. 获取文件信息
        file_size = ImageProcessor.get_file_size(original_path)

        # 5. 返回结果
        return UploadResponse(
            success=True,
            message="文章配图上传成功",
            file_url=original_url,
            thumb_url=thumb_url,
            medium_url=medium_url,
            file_size=file_size,
            width=width,
            height=height
        )

    except Exception as e:
        import traceback
        error_detail = f"上传失败：{str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=f"上传失败：{str(e)}")

    finally:
        # 清理临时文件
        if temp_dir and os.path.exists(temp_dir):
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
