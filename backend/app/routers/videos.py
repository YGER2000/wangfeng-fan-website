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
from ..utils.bilibili import extract_bvid, get_video_info

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
    db_video = create_video(db=db, video=video_create)
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