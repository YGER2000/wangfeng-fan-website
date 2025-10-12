# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import uuid4
from datetime import datetime

from ..models.video import Video as VideoModel, VideoCategory
from ..schemas.video import VideoCreate, VideoUpdate


def get_video(db: Session, video_id: str) -> Optional[VideoModel]:
    """根据ID获取视频"""
    return db.query(VideoModel).filter(VideoModel.id == video_id).first()


def get_videos(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None
) -> List[VideoModel]:
    """获取视频列表"""
    query = db.query(VideoModel)
    if category:
        query = query.filter(VideoModel.category == category)
    return query.offset(skip).limit(limit).all()


def get_videos_count(db: Session, category: Optional[str] = None) -> int:
    """获取视频总数"""
    query = db.query(VideoModel)
    if category:
        query = query.filter(VideoModel.category == category)
    return query.count()


def create_video(db: Session, video: VideoCreate) -> VideoModel:
    """创建视频"""
    db_video = VideoModel(
        id=str(uuid4()),
        title=video.title,
        description=video.description,
        author=video.author,
        category=video.category,
        bvid=video.bvid,
        publish_date=video.publish_date,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    return db_video


def update_video(db: Session, video_id: str, video: VideoUpdate) -> Optional[VideoModel]:
    """更新视频"""
    db_video = get_video(db, video_id)
    if not db_video:
        return None
    
    update_data = video.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_video, key, value)
    
    setattr(db_video, 'updated_at', datetime.utcnow())
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    return db_video


def delete_video(db: Session, video_id: str) -> bool:
    """删除视频"""
    db_video = get_video(db, video_id)
    if not db_video:
        return False
    
    db.delete(db_video)
    db.commit()
    return True