# -*- coding: utf-8 -*-
"""
内容工作流路由 - 支持权限系统的内容管理端点
集成权限检查、状态管理、审核流程
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from app.database import get_db
from app.schemas.article import Article as ArticleSchema, ArticleCreate, ArticleUpdate
from app.models.article import Article
from app.models.user_db import User
from app.core.dependencies import get_current_user, get_current_active_user
from app.core.permissions import (
    can_create_content,
    can_edit_content,
    can_delete_content,
    can_review,
    require_admin
)
from app.models.roles import UserRole
from slugify import slugify

router = APIRouter(prefix="/api/v3/content", tags=["content-workflow"])

# ============================================================================
# 响应模型
# ============================================================================

class ContentCreateRequest:
    """创建内容请求"""
    pass

class ContentStatusResponse:
    """内容状态响应"""
    pass

class ReviewActionRequest:
    """审核操作请求"""
    reason: Optional[str] = None

# ============================================================================
# 创建内容 - POST /api/v3/content/articles
# ============================================================================

@router.post("/articles", response_model=ArticleSchema, status_code=status.HTTP_201_CREATED)
def create_article_v3(
    article: ArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    创建新文章（权限感知版本）

    权限：USER+（任何认证用户）
    初始状态：draft（草稿）
    """
    # 权限检查：检查用户是否可以创建文章
    if not can_create_content('article', current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限创建文章"
        )

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

    # 创建文章 - 初始状态为 draft
    db_article = Article(
        id=article_id,
        slug=slug,
        title=article.title,
        content=article.content,
        excerpt=excerpt,
        author=article.author or current_user.username,
        author_id=str(current_user.id),
        category=article.category,
        category_primary=article.category_primary,
        category_secondary=article.category_secondary,
        tags=article.tags or [],
        meta_description=article.meta_description,
        meta_keywords=article.meta_keywords,
        cover_url=article.cover_url,
        # 新增权限系统字段
        created_by_id=current_user.id,
        created_at=datetime.utcnow(),
        # 初始状态为草稿
        review_status='pending',  # 注：暂时使用 review_status（未来可统一为 status）
        is_published=False
    )

    db.add(db_article)
    db.commit()
    db.refresh(db_article)

    return db_article


# ============================================================================
# 编辑内容 - PUT /api/v3/content/articles/{id}
# ============================================================================

@router.put("/articles/{article_id}", response_model=ArticleSchema)
def update_article_v3(
    article_id: str,
    article_update: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    编辑文章（权限感知版本）

    权限：
    - 作者可编辑自己的草稿
    - 管理员+可编辑任意内容（包括已发布）
    """
    # 获取文章
    article = db.query(Article).filter(
        Article.id == article_id,
        Article.is_deleted == False
    ).first()

    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文章不存在"
        )

    # 权限检查：检查用户是否可以编辑
    content_dict = {
        'created_by_id': int(article.author_id) if article.author_id else None,
        'status': article.review_status
    }

    if not can_edit_content(content_dict, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限编辑此文章"
        )

    # 更新字段
    update_data = article_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(article, field):
            setattr(article, field, value)

    # 记录更新时间
    article.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(article)

    return article


# ============================================================================
# 删除内容 - DELETE /api/v3/content/articles/{id}
# ============================================================================

@router.delete("/articles/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_article_v3(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    删除文章（权限感知版本）

    权限：
    - 用户只能删除自己的草稿
    - 超管可以删除任意内容
    """
    # 获取文章
    article = db.query(Article).filter(
        Article.id == article_id,
        Article.is_deleted == False
    ).first()

    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文章不存在"
        )

    # 权限检查：检查用户是否可以删除
    content_dict = {
        'created_by_id': int(article.author_id) if article.author_id else None,
        'status': article.review_status
    }

    if not can_delete_content(content_dict, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限删除此文章"
        )

    # 软删除
    article.is_deleted = True
    article.updated_at = datetime.utcnow()

    db.commit()

    return None


# ============================================================================
# 提交审核 - POST /api/v3/content/articles/{id}/submit-review
# ============================================================================

@router.post("/articles/{article_id}/submit-review", response_model=ArticleSchema)
def submit_article_for_review(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    提交文章进行审核

    权限：任何用户都可以提交自己创建的草稿
    状态转换：draft -> pending
    """
    # 获取文章
    article = db.query(Article).filter(
        Article.id == article_id,
        Article.is_deleted == False
    ).first()

    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文章不存在"
        )

    # 权限检查：只有作者可以提交自己的文章
    if int(article.author_id) != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只能提交自己创建的文章"
        )

    # 状态检查：只有草稿可以提交
    if article.review_status != 'pending':  # 注：当前系统使用 review_status='pending' 表示待审核
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"只有草稿文章可以提交审核，当前状态: {article.review_status}"
        )

    # 更新状态为待审核
    article.review_status = 'pending'
    article.submit_time = datetime.utcnow()
    article.submitted_by_id = current_user.id

    db.commit()
    db.refresh(article)

    return article


# ============================================================================
# 审核操作 - 批准/拒绝
# ============================================================================

@router.post("/articles/{article_id}/approve", response_model=ArticleSchema)
def approve_article(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    批准文章（发布）

    权限：仅管理员+可以批准
    状态转换：pending -> approved，自动发布
    """
    # 权限检查
    if not can_review(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限审核文章"
        )

    # 获取文章
    article = db.query(Article).filter(
        Article.id == article_id,
        Article.is_deleted == False
    ).first()

    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文章不存在"
        )

    # 状态检查：只有待审核的文章可以批准
    if article.review_status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"只能批准待审核的文章，当前状态: {article.review_status}"
        )

    # 更新状态为已批准，自动发布
    article.review_status = 'approved'
    article.is_published = True
    article.reviewed_at = datetime.utcnow()
    article.reviewer_id = str(current_user.id)

    db.commit()
    db.refresh(article)

    return article


@router.post("/articles/{article_id}/reject", response_model=ArticleSchema)
def reject_article(
    article_id: str,
    reason: str = Query(..., description="拒绝原因"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    拒绝文章

    权限：仅管理员+可以拒绝
    状态转换：pending -> rejected
    """
    # 权限检查
    if not can_review(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限审核文章"
        )

    # 获取文章
    article = db.query(Article).filter(
        Article.id == article_id,
        Article.is_deleted == False
    ).first()

    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文章不存在"
        )

    # 状态检查：只有待审核的文章可以拒绝
    if article.review_status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"只能拒绝待审核的文章，当前状态: {article.review_status}"
        )

    # 更新状态为已拒绝
    article.review_status = 'rejected'
    article.is_published = False
    article.review_notes = reason
    article.reviewed_at = datetime.utcnow()
    article.reviewer_id = str(current_user.id)

    db.commit()
    db.refresh(article)

    return article


# ============================================================================
# 获取待审核列表 - GET /api/v3/content/pending-review
# ============================================================================

@router.get("/pending-review", response_model=List[ArticleSchema])
def get_pending_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取待审核的文章列表

    权限：仅管理员+可以查看
    """
    # 权限检查
    if not can_review(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限查看审核列表"
        )

    # 查询待审核的文章
    query = db.query(Article).filter(
        Article.review_status == 'pending',
        Article.is_deleted == False
    )

    if category:
        query = query.filter(Article.category_primary == category)

    items = query.offset(skip).limit(limit).all()
    return items


# ============================================================================
# 获取我的内容列表 - GET /api/v3/content/my-articles
# ============================================================================

@router.get("/my-articles", response_model=List[ArticleSchema])
def get_my_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None, description="按状态筛选: pending, approved, rejected"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取当前用户创建的所有文章（包含所有状态）

    权限：任何认证用户可以查看自己的
    """
    query = db.query(Article).filter(
        Article.author_id == str(current_user.id),
        Article.is_deleted == False
    )

    if status_filter:
        query = query.filter(Article.review_status == status_filter)

    items = query.offset(skip).limit(limit).all()
    return items


# ============================================================================
# 获取所有内容（管理员视图）- GET /api/v3/content/all-articles
# ============================================================================

@router.get("/all-articles", response_model=List[ArticleSchema])
def get_all_articles_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
    author_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取所有文章（仅限管理员+）

    权限：仅管理员+可以查看所有内容
    """
    # 权限检查
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限查看所有文章"
        )

    query = db.query(Article).filter(Article.is_deleted == False)

    if status_filter:
        query = query.filter(Article.review_status == status_filter)

    if author_id:
        query = query.filter(Article.author_id == str(author_id))

    items = query.offset(skip).limit(limit).all()
    return items
