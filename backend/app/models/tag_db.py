"""SQLAlchemy Tag Models for MySQL"""
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Index
)
from sqlalchemy.orm import relationship

from ..database import Base


class TagCategory(Base):
    """标签种类表"""
    __tablename__ = "tag_categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, comment='标签种类名称')
    description = Column(Text, nullable=True, comment='标签种类描述')
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment='更新时间')

    tags = relationship(
        "Tag",
        back_populates="category",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    def __repr__(self):
        return f"<TagCategory(id={self.id}, name='{self.name}')>"

    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Tag(Base):
    """标签数据库模型"""
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_id = Column(
        Integer,
        ForeignKey('tag_categories.id', ondelete='RESTRICT'),
        nullable=False,
        index=True,
        comment='标签种类ID'
    )
    value = Column(String(150), nullable=False, comment='标签值')
    name = Column(String(200), unique=True, nullable=False, comment='标签显示名称')
    description = Column(Text, nullable=True, comment='标签描述')
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment='更新时间')

    category = relationship("TagCategory", back_populates="tags")

    __table_args__ = (
        UniqueConstraint('category_id', 'value', name='unique_category_value'),
        Index('idx_category_value', 'category_id', 'value'),
        Index('idx_value', 'value'),
        Index('idx_name', 'name'),
    )

    def __repr__(self):
        return f"<Tag(id={self.id}, category_id={self.category_id}, value='{self.value}')>"

    def compute_display_name(self, category_name: Optional[str] = None) -> str:
        """计算标签显示名称"""
        resolved_category = category_name or (self.category.name if self.category else "")
        if resolved_category:
            return f"{resolved_category}：{self.value}"
        return self.value

    def sync_display_name(self, category_name: Optional[str] = None) -> None:
        """根据当前值和种类同步显示名称"""
        self.name = self.compute_display_name(category_name)

    def to_dict(self):
        """转换为字典格式"""
        category_name = self.category.name if self.category else None
        display_name = self.compute_display_name(category_name)
        return {
            'id': self.id,
            'name': display_name,
            'display_name': display_name,
            'value': self.value,
            'category_id': self.category_id,
            'category_name': category_name,
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
    content_id = Column(String(64), nullable=False, comment='内容ID（字符串形式，兼容 UUID 和自增ID）')
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
