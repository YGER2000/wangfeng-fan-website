from sqlalchemy.orm import Session
from app.models.article import Article
from app.schemas.article import ArticleCreate, ArticleUpdate
from typing import List, Optional
from datetime import datetime
from slugify import slugify
import uuid

def create_article(db: Session, article: ArticleCreate) -> Article:
    # 生成唯一ID和slug
    article_id = str(uuid.uuid4())
    slug = slugify(article.title)
    
    # 确保slug唯一
    base_slug = slug
    counter = 1
    while db.query(Article).filter(Article.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    # 如果没有摘要，从内容中生成
    excerpt = article.excerpt
    if not excerpt and article.content:
        excerpt = article.content[:150] + "..." if len(article.content) > 150 else article.content
    
    # 创建文章实例
    db_article = Article(
        id=article_id,
        slug=slug,
        title=article.title,
        content=article.content,
        excerpt=excerpt,
        author=article.author,
        category=article.category,
        category_primary=article.category_primary,
        category_secondary=article.category_secondary,
        tags=article.tags,
        meta_description=article.meta_description,
        meta_keywords=article.meta_keywords,
        is_published=True,
        published_at=datetime.utcnow()
    )
    
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

def get_article(db: Session, article_id: str) -> Optional[Article]:
    return db.query(Article).filter(
        Article.id == article_id,
        Article.is_deleted == False
    ).first()

def get_article_by_slug(db: Session, slug: str) -> Optional[Article]:
    return db.query(Article).filter(
        Article.slug == slug,
        Article.is_deleted == False
    ).first()

def get_articles(
    db: Session, 
    skip: int = 0, 
    limit: int = 50,
    category: Optional[str] = None,
    published_only: bool = True
) -> List[Article]:
    query = db.query(Article).filter(Article.is_deleted == False)
    
    if published_only:
        query = query.filter(Article.is_published == True)
    
    if category:
        query = query.filter(Article.category == category)
    
    return query.order_by(Article.published_at.desc()).offset(skip).limit(limit).all()

def search_articles(
    db: Session,
    query_text: str,
    skip: int = 0,
    limit: int = 50
) -> List[Article]:
    return db.query(Article).filter(
        Article.is_deleted == False,
        Article.is_published == True,
        Article.title.contains(query_text) | Article.content.contains(query_text)
    ).order_by(Article.published_at.desc()).offset(skip).limit(limit).all()

def update_article(db: Session, article_id: str, article_update: ArticleUpdate) -> Optional[Article]:
    db_article = get_article(db, article_id)
    if not db_article:
        return None
    
    update_data = article_update.model_dump(exclude_unset=True)
    
    # 如果更新标题，需要重新生成slug
    if "title" in update_data:
        new_slug = slugify(update_data["title"])
        base_slug = new_slug
        counter = 1
        while db.query(Article).filter(
            Article.slug == new_slug, 
            Article.id != article_id
        ).first():
            new_slug = f"{base_slug}-{counter}"
            counter += 1
        update_data["slug"] = new_slug
    
    # 更新字段
    for field, value in update_data.items():
        setattr(db_article, field, value)
    
    db_article.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_article)
    return db_article

def delete_article(db: Session, article_id: str) -> bool:
    db_article = get_article(db, article_id)
    if not db_article:
        return False
    
    db_article.is_deleted = True
    db_article.updated_at = datetime.utcnow()
    db.commit()
    return True

def increase_view_count(db: Session, article_id: str) -> Optional[Article]:
    db_article = get_article(db, article_id)
    if db_article:
        db_article.view_count += 1
        db.commit()
        db.refresh(db_article)
    return db_article

def get_article_count(db: Session, category: Optional[str] = None) -> int:
    query = db.query(Article).filter(
        Article.is_deleted == False,
        Article.is_published == True
    )
    
    if category:
        query = query.filter(Article.category == category)
    
    return query.count()

def get_categories(db: Session) -> List[str]:
    categories = db.query(Article.category).filter(
        Article.is_deleted == False,
        Article.is_published == True
    ).distinct().all()
    
    return [cat[0] for cat in categories if cat[0]]