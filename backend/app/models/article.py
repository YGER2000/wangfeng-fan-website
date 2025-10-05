from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Article(Base):
    __tablename__ = "articles"

    id = Column(String(36), primary_key=True, index=True)  # UUID length
    title = Column(String(200), nullable=False, index=True)
    slug = Column(String(250), unique=True, nullable=False, index=True)
    content = Column(Text, nullable=False)
    excerpt = Column(Text)
    author = Column(String(100), default="汪峰")

    # 分类字段：一级分类（主目录）和二级分类（子目录）
    category_primary = Column(String(50), default="峰言峰语", index=True)  # 一级：峰言峰语/峰迷聊峰/数据科普
    category_secondary = Column(String(50), default="汪峰博客", index=True)  # 二级：具体子分类
    category = Column(String(50), default="个人感悟")  # 保留旧字段兼容性

    tags = Column(JSON, default=list)
    
    # 状态字段
    is_published = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    
    # 时间字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime, default=datetime.utcnow)
    
    # SEO字段
    meta_description = Column(String(160))
    meta_keywords = Column(String(255))
    
    # 统计字段
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<Article(title='{self.title}', slug='{self.slug}')>"