# -*- coding: utf-8 -*-
"""文章管理CRUD操作（管理员）"""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..models.article import Article, ReviewStatus
from ..schemas.admin import ArticleReviewAction


def get_articles_for_review(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    status: Optional[ReviewStatus] = None,
    search: Optional[str] = None,
    category_primary: Optional[str] = None
) -> List[Article]:
    """
    获取需要审核的文章列表

    Args:
        db: 数据库会话
        skip: 跳过的记录数
        limit: 返回的最大记录数
        status: 审核状态过滤
        search: 搜索关键词（标题）
        category_primary: 一级分类过滤
    """
    query = db.query(Article).filter(Article.is_deleted == False)

    if status:
        query = query.filter(Article.review_status == status)

    if search:
        query = query.filter(Article.title.contains(search))

    if category_primary:
        query = query.filter(Article.category_primary == category_primary)

    return query.order_by(Article.created_at.desc()).offset(skip).limit(limit).all()


def get_articles_count(
    db: Session,
    status: Optional[ReviewStatus] = None,
    search: Optional[str] = None,
    category_primary: Optional[str] = None
) -> int:
    """获取文章总数"""
    query = db.query(Article).filter(Article.is_deleted == False)

    if status:
        query = query.filter(Article.review_status == status)

    if search:
        query = query.filter(Article.title.contains(search))

    if category_primary:
        query = query.filter(Article.category_primary == category_primary)

    return query.count()


def approve_article(
    db: Session,
    article_id: str,
    reviewer_id: str,
    review_data: Optional[ArticleReviewAction] = None
) -> Optional[Article]:
    """
    批准文章

    Args:
        db: 数据库会话
        article_id: 文章ID
        reviewer_id: 审核者ID
        review_data: 审核数据
    """
    article = db.query(Article).filter(
        Article.id == article_id,
        Article.is_deleted == False
    ).first()

    if not article:
        return None

    article.review_status = ReviewStatus.APPROVED
    article.reviewer_id = reviewer_id
    article.reviewed_at = datetime.utcnow()
    article.is_published = True

    if review_data and review_data.review_notes:
        article.review_notes = review_data.review_notes

    article.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(article)
    return article


def reject_article(
    db: Session,
    article_id: str,
    reviewer_id: str,
    review_data: ArticleReviewAction
) -> Optional[Article]:
    """
    拒绝文章

    Args:
        db: 数据库会话
        article_id: 文章ID
        reviewer_id: 审核者ID
        review_data: 审核数据（必须包含拒绝原因）
    """
    article = db.query(Article).filter(
        Article.id == article_id,
        Article.is_deleted == False
    ).first()

    if not article:
        return None

    article.review_status = ReviewStatus.REJECTED
    article.reviewer_id = reviewer_id
    article.reviewed_at = datetime.utcnow()
    article.is_published = False

    if review_data.review_notes:
        article.review_notes = review_data.review_notes

    article.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(article)
    return article


def get_pending_articles_count(db: Session) -> int:
    """获取待审核文章数量"""
    return db.query(Article).filter(
        Article.is_deleted == False,
        Article.review_status == ReviewStatus.PENDING
    ).count()


def get_article_with_details(db: Session, article_id: str) -> Optional[Article]:
    """获取文章详情（包含审核信息）"""
    return db.query(Article).filter(
        Article.id == article_id,
        Article.is_deleted == False
    ).first()


def force_delete_article(db: Session, article_id: str) -> bool:
    """
    强制删除文章（管理员权限）

    Args:
        db: 数据库会话
        article_id: 文章ID

    Returns:
        是否删除成功
    """
    article = db.query(Article).filter(Article.id == article_id).first()

    if not article:
        return False

    article.is_deleted = True
    article.updated_at = datetime.utcnow()
    db.commit()
    return True
