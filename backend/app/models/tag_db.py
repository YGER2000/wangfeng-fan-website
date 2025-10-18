"""SQLAlchemy Tag Models for MySQL"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, Index
from datetime import datetime
from ..database import Base


class Tag(Base):
    """标签数据库模型"""
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, comment='标签名称')
    description = Column(Text, nullable=True, comment='标签描述')
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment='更新时间')

    # 创建索引用于搜索
    __table_args__ = (
        Index('idx_name', 'name'),
    )

    def __repr__(self):
        return f"<Tag(id={self.id}, name='{self.name}')>"

    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ContentTag(Base):
    """内容-标签关联表"""
    __tablename__ = "content_tags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tag_id = Column(Integer, ForeignKey('tags.id', ondelete='CASCADE'), nullable=False, comment='标签ID')
    content_type = Column(String(50), nullable=False, comment='内容类型: video/article/gallery/schedule/music')
    content_id = Column(Integer, nullable=False, comment='内容ID')
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment='创建时间')

    # 唯一约束：同一内容不能重复添加同一标签
    __table_args__ = (
        UniqueConstraint('content_type', 'content_id', 'tag_id', name='unique_content_tag'),
        Index('idx_tag', 'tag_id'),
        Index('idx_content', 'content_type', 'content_id'),
    )

    def __repr__(self):
        return f"<ContentTag(tag_id={self.tag_id}, content_type='{self.content_type}', content_id={self.content_id})>"

    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'tag_id': self.tag_id,
            'content_type': self.content_type,
            'content_id': self.content_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
