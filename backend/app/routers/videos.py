# -*- coding: utf-8 -*-
"""视频管理路由"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import tempfile
from pathlib import Path

from ..database import get_db
from ..core.permissions import require_admin
from ..core.dependencies import get_current_user
from ..models.user_db import User
from ..models.video import VideoCategory
from ..schemas.video import VideoCreate, VideoUpdate, Video as VideoSchema
from ..schemas.gallery import UploadResponse
from ..crud.video import get_video, get_videos, get_videos_count, create_video, update_video, delete_video, get_videos_by_author, get_all_videos_admin
from ..utils.bilibili import extract_bvid, get_video_info
from ..services.image_processing import ImageProcessor
from ..services.storage_service import (
    get_storage_service,
    generate_video_cover_path
)

router = APIRouter(prefix="/api/videos", tags=["videos"])


@router.get("/", response_model=List[VideoSchema])
def list_videos(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """获取视频列表"""
    videos = get_videos(db=db, skip=skip, limit=limit, category=category)
    return videos


@router.get("/my", response_model=List[VideoSchema])
def get_my_videos(
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的视频（包含所有状态）"""
    videos = get_videos_by_author(
        db=db,
        author_id=current_user.id,
        skip=skip,
        limit=limit,
        category=category
    )
    return videos


@router.get("/all", response_model=List[VideoSchema])
def get_all_videos(
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    category: Optional[str] = Query(None),
    review_status: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """获取所有用户的视频（仅管理员,包含所有状态）"""
    videos = get_all_videos_admin(
        db=db,
        skip=skip,
        limit=limit,
        category=category,
        review_status=review_status
    )
    return videos


@router.get("/count")
def get_videos_count_endpoint(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """获取视频总数"""
    count = get_videos_count(db=db, category=category)
    return {"count": count}


@router.get("/parse-bilibili")
def parse_bilibili_video(
    bvid: str = Query(..., description="B站视频BV号或链接")
):
    """
    解析B站视频信息
    从B站API获取视频标题、描述、作者、发布时间等信息
    """
    from datetime import datetime

    # 提取BV号
    extracted_bvid = extract_bvid(bvid)
    if not extracted_bvid:
        raise HTTPException(status_code=400, detail="无效的B站视频链接或BV号")

    # 获取视频信息
    video_info = get_video_info(extracted_bvid)
    if not video_info:
        raise HTTPException(status_code=404, detail="无法获取视频信息，请检查BV号是否正确")

    # 转换发布时间
    publish_date = None
    if video_info.get('pubdate'):
        try:
            publish_date = datetime.fromtimestamp(video_info['pubdate']).strftime('%Y-%m-%d')
        except:
            pass

    return {
        "bvid": extracted_bvid,
        "title": video_info.get('title', ''),
        "description": video_info.get('description', ''),
        "author": video_info.get('author', ''),
        "publish_date": publish_date,
        "cover_url": video_info.get('cover', ''),
        "duration": video_info.get('duration', 0),
        "view_count": video_info.get('view', 0)
    }


@router.get("/{video_id}", response_model=VideoSchema)
def get_video_endpoint(
    video_id: str,
    db: Session = Depends(get_db)
):
    """获取视频详情"""
    video = get_video(db=db, video_id=video_id)
    if not video:
        raise HTTPException(status_code=404, detail="视频不存在")
    return video


@router.post("/", response_model=VideoSchema)
def create_video_endpoint(
    video: VideoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """创建视频（管理员）- 支持自动提取BV号和封面"""
    # 验证分类是否有效
    if video.category not in [cat.value for cat in VideoCategory]:
        raise HTTPException(status_code=400, detail="无效的视频分类")

    # 从输入中提取BV号（支持URL或纯BV号）
    bvid = extract_bvid(video.bvid)
    if not bvid:
        raise HTTPException(status_code=400, detail="无效的B站视频链接或BV号")

    # 检查BVID是否已存在
    from ..models.video import Video as VideoModel
    existing_video = db.query(VideoModel).filter(VideoModel.bvid == bvid).first()
    if existing_video:
        raise HTTPException(status_code=400, detail="该视频已存在")

    # 尝试从B站API获取视频信息（封面、标题等）
    bilibili_info = get_video_info(bvid)

    # 使用B站信息补充数据
    video_data = video.dict()
    video_data['bvid'] = bvid  # 使用提取的BV号
    video_data['author_id'] = str(current_user.id)  # 设置创建者ID

    if bilibili_info:
        # 如果成功获取B站信息，使用封面URL
        video_data['cover_url'] = bilibili_info.get('cover')

        # 如果标题为空，使用B站标题
        if not video_data.get('title'):
            video_data['title'] = bilibili_info.get('title', '')

        # 如果描述为空，使用B站描述
        if not video_data.get('description'):
            video_data['description'] = bilibili_info.get('description', '')

    # 创建Pydantic对象
    video_create = VideoCreate(**video_data)
    db_video = create_video(db=db, video=video_create, author_id=str(current_user.id))
    return db_video


@router.put("/{video_id}", response_model=VideoSchema)
def update_video_endpoint(
    video_id: str,
    video_update: VideoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """更新视频（管理员）"""
    # 验证分类是否有效
    if video_update.category and video_update.category not in [cat.value for cat in VideoCategory]:
        raise HTTPException(status_code=400, detail="无效的视频分类")
    
    db_video = update_video(db=db, video_id=video_id, video=video_update)
    if not db_video:
        raise HTTPException(status_code=404, detail="视频不存在")
    return db_video


@router.delete("/{video_id}")
def delete_video_endpoint(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """删除视频（管理员）"""
    success = delete_video(db=db, video_id=video_id)
    if not success:
        raise HTTPException(status_code=404, detail="视频不存在")
    return {"message": "视频删除成功"}


# ========== 视频封面上传路由 ==========

@router.post("/upload/cover", response_model=UploadResponse)
async def upload_video_cover(
    video_id: str = Form(..., description="视频ID"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    上传视频封面图片
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
            filename_base=video_id
        )

        # 3. 上传到OSS（使用新的可读性命名）
        storage = get_storage_service()

        # 上传 3 种尺寸
        original_oss_path = generate_video_cover_path(video_id, "original")
        medium_oss_path = generate_video_cover_path(video_id, "medium")
        thumb_oss_path = generate_video_cover_path(video_id, "thumb")

        original_url = storage.upload_file(original_path, original_oss_path)
        medium_url = storage.upload_file(medium_path, medium_oss_path)
        thumb_url = storage.upload_file(thumb_path, thumb_oss_path)

        # 4. 获取文件信息
        file_size = ImageProcessor.get_file_size(original_path)

        # 5. 返回结果
        return UploadResponse(
            success=True,
            message="视频封面上传成功",
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
