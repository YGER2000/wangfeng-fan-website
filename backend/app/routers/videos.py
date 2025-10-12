# -*- coding: utf-8 -*-
"""视频管理路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..core.permissions import require_admin
from ..models.user_db import User
from ..models.video import VideoCategory
from ..schemas.video import VideoCreate, VideoUpdate, Video as VideoSchema
from ..crud.video import get_video, get_videos, get_videos_count, create_video, update_video, delete_video

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


@router.get("/count")
def get_videos_count_endpoint(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """获取视频总数"""
    count = get_videos_count(db=db, category=category)
    return {"count": count}


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
    """创建视频（管理员）"""
    # 验证分类是否有效
    if video.category not in [cat.value for cat in VideoCategory]:
        raise HTTPException(status_code=400, detail="无效的视频分类")
    
    # 检查BVID是否已存在
    from ..models.video import Video as VideoModel
    existing_video = db.query(VideoModel).filter(VideoModel.bvid == video.bvid).first()
    if existing_video:
        raise HTTPException(status_code=400, detail="该BVID的视频已存在")
    
    db_video = create_video(db=db, video=video)
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