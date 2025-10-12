# -*- coding: utf-8 -*-
from sqlalchemy import Column, String, Text, DateTime, Integer
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
    category = Column(String(50), nullable=False, index=True)  # 使用新的分类
    bvid = Column(String(50), nullable=False)  # B站视频ID
    
    # 时间字段
    publish_date = Column(DateTime, nullable=False)  # 视频发布日期
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Video(title='{self.title}', bvid='{self.bvid}', category='{self.category}')>"