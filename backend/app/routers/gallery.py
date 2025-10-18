# -*- coding: utf-8 -*-
"""图片画廊路由"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import tempfile
from pathlib import Path

from ..database import get_db
from ..core.permissions import require_admin
from ..models.user_db import User
from ..schemas.gallery import (
    PhotoGroupCreate,
    PhotoGroupUpdate,
    PhotoGroup as PhotoGroupSchema,
    PhotoGroupWithPhotos,
    PhotoCreate,
    PhotoUpdate,
    Photo as PhotoSchema,
    UploadResponse
)
from ..crud.gallery import (
    create_photo_group,
    get_photo_group,
    get_photo_groups,
    update_photo_group,
    delete_photo_group,
    get_photo_group_count,
    create_photo,
    get_photo,
    get_photos_by_group,
    update_photo,
    delete_photo,
    batch_create_photos
)
from ..services.image_processing import ImageProcessor
from ..services.storage_service import (
    get_storage_service,
    generate_unique_filename,
    get_upload_path
)

router = APIRouter(prefix="/api/gallery", tags=["gallery"])


# ========== 照片组相关路由 ==========

@router.get("/groups", response_model=List[PhotoGroupSchema])
def list_photo_groups(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """获取照片组列表（前台，只返回已发布的）"""
    photo_groups = get_photo_groups(
        db=db,
        skip=skip,
        limit=limit,
        category=category,
        published_only=True
    )
    return photo_groups


@router.get("/groups/{group_id}", response_model=PhotoGroupWithPhotos)
def get_photo_group_detail(
    group_id: str,
    db: Session = Depends(get_db)
):
    """获取照片组详情（包含所有照片）"""
    photo_group = get_photo_group(db=db, photo_group_id=group_id)
    if not photo_group:
        raise HTTPException(status_code=404, detail="照片组不存在")

    # 获取照片组的所有照片
    photos = get_photos_by_group(db=db, photo_group_id=group_id)

    return {
        **photo_group.__dict__,
        "photos": photos
    }


@router.get("/groups/count")
def get_groups_count(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """获取照片组总数"""
    count = get_photo_group_count(db=db, category=category, published_only=True)
    return {"count": count}


# ========== 管理员路由 ==========

@router.get("/admin/groups", response_model=List[PhotoGroupSchema])
def admin_list_photo_groups(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """获取照片组列表（管理员，包含未发布的）"""
    photo_groups = get_photo_groups(
        db=db,
        skip=skip,
        limit=limit,
        category=category,
        published_only=False
    )
    return photo_groups


@router.post("/admin/groups", response_model=PhotoGroupSchema)
def admin_create_photo_group(
    photo_group: PhotoGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """创建照片组（管理员）"""
    db_photo_group = create_photo_group(db=db, photo_group=photo_group)
    return db_photo_group


@router.put("/admin/groups/{group_id}", response_model=PhotoGroupSchema)
def admin_update_photo_group(
    group_id: str,
    photo_group_update: PhotoGroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """更新照片组（管理员）"""
    db_photo_group = update_photo_group(
        db=db,
        photo_group_id=group_id,
        photo_group_update=photo_group_update
    )
    if not db_photo_group:
        raise HTTPException(status_code=404, detail="照片组不存在")
    return db_photo_group


@router.delete("/admin/groups/{group_id}")
def admin_delete_photo_group(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """删除照片组（管理员）"""
    success = delete_photo_group(db=db, photo_group_id=group_id)
    if not success:
        raise HTTPException(status_code=404, detail="照片组不存在")
    return {"message": "删除成功"}


# ========== 照片相关路由 ==========

@router.get("/photos/group/{group_id}", response_model=List[PhotoSchema])
def list_photos_by_group(
    group_id: str,
    db: Session = Depends(get_db)
):
    """获取照片组的所有照片"""
    photos = get_photos_by_group(db=db, photo_group_id=group_id)
    return photos


@router.post("/admin/photos", response_model=PhotoSchema)
def admin_create_photo(
    photo: PhotoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """创建照片（管理员）"""
    db_photo = create_photo(db=db, photo=photo)
    return db_photo


@router.put("/admin/photos/{photo_id}", response_model=PhotoSchema)
def admin_update_photo(
    photo_id: str,
    photo_update: PhotoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """更新照片（管理员）"""
    db_photo = update_photo(db=db, photo_id=photo_id, photo_update=photo_update)
    if not db_photo:
        raise HTTPException(status_code=404, detail="照片不存在")
    return db_photo


@router.delete("/admin/photos/{photo_id}")
def admin_delete_photo(
    photo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """删除照片（管理员）"""
    success = delete_photo(db=db, photo_id=photo_id)
    if not success:
        raise HTTPException(status_code=404, detail="照片不存在")
    return {"message": "删除成功"}


# ========== 文件上传路由 ==========

@router.post("/admin/upload", response_model=UploadResponse)
async def admin_upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    上传图片（管理员）
    - 自动生成缩略图（400px宽）
    - 自动生成中等尺寸（1200px宽）
    - 压缩原图
    - 支持本地存储和OSS
    """
    # 验证文件类型
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型：{file.content_type}，仅支持 JPEG, PNG, WebP"
        )

    # 验证文件大小（最大20MB）
    file_size = 0
    content = await file.read()
    file_size = len(content)
    if file_size > 20 * 1024 * 1024:  # 20MB
        raise HTTPException(status_code=400, detail="文件大小不能超过 20MB")

    # 重置文件指针
    await file.seek(0)

    try:
        # 1. 保存临时文件
        temp_dir = tempfile.mkdtemp()
        temp_input_path = os.path.join(temp_dir, file.filename)

        with open(temp_input_path, 'wb') as f:
            f.write(content)

        # 2. 处理图片（生成缩略图和中等尺寸）
        unique_name = generate_unique_filename(file.filename)
        filename_base = Path(unique_name).stem

        # 生成临时输出目录
        temp_output_dir = os.path.join(temp_dir, "processed")

        # 处理图片
        original_path, medium_path, thumb_path, width, height = ImageProcessor.process_image(
            input_path=temp_input_path,
            output_dir=temp_output_dir,
            filename_base=filename_base
        )

        # 3. 上传到存储服务
        storage = get_storage_service()
        upload_base_path = get_upload_path("gallery")

        # 上传原图
        original_dest = f"{upload_base_path}/{filename_base}.jpg"
        original_url = storage.upload_file(original_path, original_dest)

        # 上传中等尺寸
        medium_dest = f"{upload_base_path}/{filename_base}_medium.jpg"
        medium_url = storage.upload_file(medium_path, medium_dest)

        # 上传缩略图
        thumb_dest = f"{upload_base_path}/{filename_base}_thumb.jpg"
        thumb_url = storage.upload_file(thumb_path, thumb_dest)

        # 4. 获取文件信息（在清理临时文件之前）
        file_size = ImageProcessor.get_file_size(original_path)

        # 5. 清理临时文件
        import shutil
        shutil.rmtree(temp_dir)

        # 6. 返回结果
        return UploadResponse(
            success=True,
            message="上传成功",
            file_url=original_url,
            thumb_url=thumb_url,
            medium_url=medium_url,
            file_size=file_size,
            width=width,
            height=height
        )

    except Exception as e:
        # 清理临时文件
        if os.path.exists(temp_dir):
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)

        # 记录详细错误信息
        import traceback
        error_detail = f"上传失败：{str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=f"上传失败：{str(e)}")


# ========== 批量上传路由 ==========

@router.post("/admin/batch-upload", response_model=List[UploadResponse])
async def admin_batch_upload_images(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """批量上传图片（管理员）"""
    if len(files) > 50:
        raise HTTPException(status_code=400, detail="单次最多上传50张图片")

    results = []
    for file in files:
        try:
            result = await admin_upload_image(file, db, current_user)
            results.append(result)
        except HTTPException as e:
            results.append(UploadResponse(
                success=False,
                message=f"上传失败：{e.detail}"
            ))

    return results
