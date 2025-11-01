from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas.article import Article as ArticleSchema, ArticleCreate, ArticleUpdate, ArticleSummary
from app.crud import article as crud_article
from app.core.dependencies import get_current_user
from app.core.permissions import require_admin
from app.models.user_db import User

router = APIRouter(prefix="/api/articles", tags=["articles"])

@router.post("/", response_model=ArticleSchema)
def create_article(
    article: ArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """创建新文章（管理员）"""
    # 设置作者ID
    article.author_id = str(current_user.id)
    return crud_article.create_article(db=db, article=article)

@router.get("/", response_model=List[ArticleSummary])
def get_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = Query(None),
    published_only: bool = Query(True, description="是否只返回已发布的文章"),
    db: Session = Depends(get_db)
):
    """获取文章列表"""
    articles = crud_article.get_articles(
        db=db,
        skip=skip,
        limit=limit,
        category=category,
        published_only=published_only
    )
    return articles

@router.get("/my", response_model=List[ArticleSummary])
def get_my_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的文章（包含所有状态）"""
    articles = crud_article.get_articles_by_author(
        db=db,
        author_id=current_user.id,
        skip=skip,
        limit=limit,
        category=category
    )
    return articles

@router.get("/all", response_model=List[ArticleSummary])
def get_all_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    category: Optional[str] = Query(None),
    review_status: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """获取所有用户的文章（仅管理员,包含所有状态）"""
    articles = crud_article.get_all_articles_admin(
        db=db,
        skip=skip,
        limit=limit,
        category=category,
        review_status=review_status
    )
    return articles

@router.get("/search", response_model=List[ArticleSummary])
def search_articles(
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """搜索文章"""
    articles = crud_article.search_articles(
        db=db,
        query_text=q,
        skip=skip,
        limit=limit
    )
    return articles

@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    """获取所有分类"""
    return crud_article.get_categories(db=db)

@router.get("/count")
def get_article_count(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """获取文章总数"""
    count = crud_article.get_article_count(db=db, category=category)
    return {"count": count}

@router.get("/{article_id}", response_model=ArticleSchema)
def get_article(
    article_id: str,
    db: Session = Depends(get_db)
):
    """根据ID获取文章详情"""
    article = crud_article.get_article(db=db, article_id=article_id)
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")

    # 增加浏览次数
    crud_article.increase_view_count(db=db, article_id=article_id)

    return article

@router.get("/slug/{slug}", response_model=ArticleSchema)
def get_article_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    """根据slug获取文章详情"""
    article = crud_article.get_article_by_slug(db=db, slug=slug)
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")

    # 增加浏览次数
    crud_article.increase_view_count(db=db, article_id=article.id)

    return article

@router.put("/{article_id}", response_model=ArticleSchema)
def update_article(
    article_id: str,
    article_update: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """更新文章"""
    article = crud_article.update_article(
        db=db,
        article_id=article_id,
        article_update=article_update
    )
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")

    return article

@router.delete("/{article_id}")
def delete_article(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """删除文章（软删除）"""
    success = crud_article.delete_article(db=db, article_id=article_id)
    if not success:
        raise HTTPException(status_code=404, detail="文章不存在")

    return {"message": "文章已删除"}

@router.post("/{article_id}/view")
def increase_view_count(
    article_id: str,
    db: Session = Depends(get_db)
):
    """增加浏览次数"""
    article = crud_article.increase_view_count(db=db, article_id=article_id)
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")

    return {"view_count": article.view_count}
