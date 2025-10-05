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
    image = Column(String(500), nullable=True, comment='海报图片路径')
    source = Column(String(20), default='custom', nullable=False, comment='数据来源：legacy/custom')
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment='更新时间')

    def __repr__(self):
        return f"<Schedule(id={self.id}, category='{self.category}', theme='{self.theme}', date='{self.date}')>"

    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'category': self.category,
            'date': self.date,
            'city': self.city,
            'venue': self.venue,
            'theme': self.theme,
            'description': self.description,
            'image': self.image,
            'source': self.source,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
