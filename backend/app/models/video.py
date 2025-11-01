# -*- coding: utf-8 -*-
from sqlalchemy import Column, String, Text, DateTime, Integer, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class VideoCategory(str, enum.Enum):
    """视频分类枚举"""
    PERFORMANCE = "演出现场"
    SONG_PERFORMANCE = "单曲现场"
    VARIETY_SHOW = "综艺节目"
    SONG_MV = "歌曲mv"
    INTERVIEW = "访谈节目"
    DOCUMENTARY = "纪录片"
    OTHER = "其他"


class Video(Base):
    __tablename__ = "videos"

    id = Column(String(36), primary_key=True, index=True)  # UUID
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    author = Column(String(100), default="汪峰")
    author_id = Column(String(36), nullable=True, index=True)  # 作者用户ID
    category = Column(String(50), nullable=False, index=True)  # 使用新的分类
    bvid = Column(String(50), nullable=False)  # B站视频ID
    cover_url = Column(String(500))  # B站封面图片URL
    cover_local = Column(String(500))  # 本地缓存的封面路径
    cover_thumb = Column(String(500))  # 本地缓存的缩略图路径
    tags = Column(JSON, default=list)  # 标签列表

    # 状态字段
    is_published = Column(Integer, default=1, nullable=False)  # 是否已发布: 0未发布/1已发布

    # 审核字段
    review_status = Column(String(20), default='pending', nullable=False, index=True)  # 审核状态
    reviewer_id = Column(String(36), nullable=True, index=True)  # 审核人ID
    review_notes = Column(Text, nullable=True)  # 审核备注/拒绝原因
    reviewed_at = Column(DateTime, nullable=True)  # 审核时间

    # 时间字段
    publish_date = Column(DateTime, nullable=False)  # 视频发布日期
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Video(title='{self.title}', bvid='{self.bvid}', category='{self.category}')>"