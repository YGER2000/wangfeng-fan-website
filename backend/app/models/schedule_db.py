"""SQLAlchemy Schedule Model for MySQL"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum
from datetime import datetime
from ..database import Base


class Schedule(Base):
    """行程数据库模型 (SQLAlchemy)"""
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category = Column(String(20), nullable=False, index=True, comment='行程分类：演唱会/音乐节/商演/综艺活动/其他')
    date = Column(String(10), nullable=False, index=True, comment='行程日期 YYYY-MM-DD')
    city = Column(String(50), nullable=False, comment='城市')
    venue = Column(String(200), nullable=True, comment='具体场馆/地点')
    theme = Column(String(200), nullable=False, comment='行程主题/详情')
    description = Column(Text, nullable=True, comment='补充说明')
    image = Column(String(500), nullable=True, comment='海报图片路径（原图）')
    image_thumb = Column(String(500), nullable=True, comment='海报缩略图路径（压缩图）')
    images = Column(Text, nullable=True, comment='多张海报图片数组（JSON格式）')
    images_thumb = Column(Text, nullable=True, comment='多张海报缩略图数组（JSON格式）')
    tags = Column(Text, nullable=True, comment='标签，用逗号分隔')
    source = Column(String(20), default='custom', nullable=False, comment='数据来源：legacy/custom')
    author_id = Column(String(36), nullable=True, index=True, comment='创建者用户ID')

    # 审核状态字段（完整版）
    review_status = Column(String(20), default='pending', nullable=False, index=True, comment='审核状态: pending/approved/rejected')
    reviewer_id = Column(String(36), nullable=True, index=True, comment='审核人ID')
    review_notes = Column(Text, nullable=True, comment='审核备注/拒绝原因')
    reviewed_at = Column(DateTime, nullable=True, comment='审核时间')

    is_published = Column(Integer, default=0, nullable=False, comment='是否已发布: 0未发布/1已发布')
    article_id = Column(String(36), nullable=True, index=True, comment='关联的文章ID')

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment='更新时间')

    def __repr__(self):
        return f"<Schedule(id={self.id}, category='{self.category}', theme='{self.theme}', date='{self.date}')>"

    def to_dict(self):
        """转换为字典格式"""
        import json

        # 解析 JSON 数组字段
        images_list = None
        images_thumb_list = None

        if self.images:
            try:
                images_list = json.loads(self.images) if isinstance(self.images, str) else self.images
            except (json.JSONDecodeError, TypeError):
                images_list = None

        if self.images_thumb:
            try:
                images_thumb_list = json.loads(self.images_thumb) if isinstance(self.images_thumb, str) else self.images_thumb
            except (json.JSONDecodeError, TypeError):
                images_thumb_list = None

        return {
            'id': self.id,
            'category': self.category,
            'date': self.date,
            'city': self.city,
            'venue': self.venue,
            'theme': self.theme,
            'description': self.description,
            'image': self.image,
            'image_thumb': self.image_thumb,
            'images': images_list,
            'images_thumb': images_thumb_list,
            'tags': self.tags.split(',') if self.tags else [],
            'source': self.source,
            'author_id': self.author_id,
            'review_status': self.review_status,
            'reviewer_id': self.reviewer_id,
            'review_notes': self.review_notes,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'is_published': self.is_published,
            'article_id': self.article_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
