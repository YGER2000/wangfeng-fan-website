# -*- coding: utf-8 -*-
"""图片画廊数据库模型"""
from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean
from datetime import datetime
import enum

from ..database import Base


class GalleryCategory(str, enum.Enum):
    """画廊分类枚举"""
    TOUR = "巡演返图"
    WORK = "工作花絮"
    DAILY = "日常生活"


class PhotoGroup(Base):
    """照片组表 - 一个照片组包含多张照片"""
    __tablename__ = "photo_groups"

    id = Column(String(36), primary_key=True, index=True)  # UUID
    title = Column(String(200), nullable=False, index=True)  # 照片组标题
    category = Column(String(50), nullable=False, index=True)  # 分类
    date = Column(DateTime, nullable=False, index=True)  # 照片日期
    display_date = Column(String(100))  # 显示日期（如：2023年7月8日）
    year = Column(String(4), index=True)  # 年份
    description = Column(Text)  # 描述
    author_id = Column(String(36), nullable=True, index=True)  # 创建者用户ID

    # 封面图片信息
    cover_image_url = Column(String(500))  # 封面图片完整URL（原图）
    cover_image_thumb_url = Column(String(500))  # 封面图片缩略图URL

    # 存储相关
    storage_type = Column(String(20), default="oss")  # local, oss, r2, minio (默认oss)

    # 状态
    is_published = Column(Boolean, default=False, index=True)  # 是否发布（默认未发布）
    is_deleted = Column(Boolean, default=False, index=True)  # 是否删除

    # 审核字段
    review_status = Column(String(20), default='draft', nullable=False, index=True)  # 审核状态
    reviewer_id = Column(String(36), nullable=True, index=True)  # 审核人ID
    review_notes = Column(Text, nullable=True)  # 审核备注/拒绝原因
    reviewed_at = Column(DateTime, nullable=True)  # 审核时间

    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<PhotoGroup(title='{self.title}', category='{self.category}')>"


class Photo(Base):
    """单张照片表"""
    __tablename__ = "photos"

    id = Column(String(36), primary_key=True, index=True)  # UUID
    photo_group_id = Column(String(36), nullable=False, index=True)  # 所属照片组ID

    # 图片信息
    original_filename = Column(String(255))  # 原始文件名
    title = Column(String(200))  # 照片标题（可选）
    description = Column(Text)  # 照片描述（可选）

    # 图片URL - 支持多种尺寸
    image_url = Column(String(500), nullable=False)  # 原图URL
    image_thumb_url = Column(String(500))  # 缩略图URL（用于瀑布流展示，宽度约400px）
    image_medium_url = Column(String(500))  # 中等尺寸URL（用于灯箱预览，宽度约1200px）

    # 图片元数据
    file_size = Column(Integer)  # 文件大小（字节）
    width = Column(Integer)  # 图片宽度
    height = Column(Integer)  # 图片高度
    mime_type = Column(String(50))  # MIME类型（image/jpeg, image/png等）

    # 存储相关
    storage_type = Column(String(20), default="local")  # local, oss, r2, minio
    storage_path = Column(String(500))  # 存储路径（相对路径或OSS key）

    # 排序和状态
    sort_order = Column(Integer, default=0, index=True)  # 排序顺序
    is_deleted = Column(Boolean, default=False, index=True)  # 是否删除

    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Photo(id='{self.id}', filename='{self.original_filename}')>"
