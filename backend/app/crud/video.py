# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import uuid4
from datetime import datetime

from ..models.video import Video as VideoModel
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
    """获取视频列表（公开接口，只返回已审核通过且已发布的视频）"""
    query = db.query(VideoModel).filter(
        VideoModel.review_status == 'approved',
        VideoModel.is_published == True
    )
    if category:
        query = query.filter(VideoModel.category == category)
    return query.order_by(VideoModel.created_at.desc()).offset(skip).limit(limit).all()


def get_videos_count(db: Session, category: Optional[str] = None) -> int:
    """获取视频总数"""
    query = db.query(VideoModel)
    if category:
        query = query.filter(VideoModel.category == category)
    return query.count()


def create_video(db: Session, video: VideoCreate, author_id: str) -> VideoModel:
    """创建视频"""
    db_video = VideoModel(
        id=str(uuid4()),
        title=video.title,
        description=video.description,
        author=video.author,
        category=video.category,
        bvid=video.bvid,
        publish_date=video.publish_date,
        cover_url=video.cover_url,  # 保存B站封面URL
        cover_local=video.cover_local,  # 保存本地封面路径
        cover_thumb=video.cover_thumb,  # 保存缩略图路径
        author_id=str(author_id),
        review_status='pending',
        is_published=0,
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


def get_videos_by_author(
    db: Session,
    author_id: str,
    skip: int = 0,
    limit: int = 500,
    category: Optional[str] = None
) -> List[VideoModel]:
    """获取指定作者的所有视频（包含所有状态）"""
    # author_id可能是数字ID，转换为字符串
    author_id_str = str(author_id)

    query = db.query(VideoModel).filter(VideoModel.author_id == author_id_str)

    if category:
        query = query.filter(VideoModel.category == category)

    return query.order_by(VideoModel.updated_at.desc()).offset(skip).limit(limit).all()


def get_all_videos_admin(
    db: Session,
    skip: int = 0,
    limit: int = 500,
    category: Optional[str] = None,
    review_status: Optional[str] = None
) -> List[VideoModel]:
    """获取所有视频（管理员用,包含所有状态）"""
    query = db.query(VideoModel)

    if category:
        query = query.filter(VideoModel.category == category)

    if review_status:
        query = query.filter(VideoModel.review_status == review_status)

    return query.order_by(VideoModel.updated_at.desc()).offset(skip).limit(limit).all()
