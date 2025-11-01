# -*- coding: utf-8 -*-
"""
审核系统API路由
提供统一的内容审核接口，支持文章、视频、行程、图片组的审核
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel
import re

from ..database import get_db
from ..models.article import Article
from ..models.video import Video
from ..models.schedule_db import Schedule
from ..models.gallery_db import PhotoGroup
from ..models.user_db import User
from ..core.dependencies import get_current_active_user

router = APIRouter(prefix="/api/admin/reviews", tags=["审核管理"])


def strip_html_tags(text: str) -> str:
    """移除HTML标签，返回纯文本"""
    if not text:
        return ''
    # 移除HTML标签
    text = re.sub(r'<[^>]+>', '', text)
    # 移除多余空白
    text = re.sub(r'\s+', ' ', text)
    # 限制长度
    text = text.strip()
    if len(text) > 150:
        text = text[:150] + '...'
    return text

# ==================== Pydantic Schemas ====================

class ReviewItemResponse(BaseModel):
    """审核项响应模型"""
    id: str | int
    type: Literal['article', 'video', 'schedule', 'gallery']
    title: str
    author: Optional[str] = None
    authorId: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = []
    reviewStatus: str
    reviewerId: Optional[str] = None
    reviewNotes: Optional[str] = None
    reviewedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    # 类型特定字段
    coverImage: Optional[str] = None  # 文章封面、视频封面、图片组封面
    bvid: Optional[str] = None  # 视频的bilibili ID
    date: Optional[str] = None  # 行程日期、图片组日期
    city: Optional[str] = None  # 行程城市
    venue: Optional[str] = None  # 行程场馆

    class Config:
        from_attributes = True


class ReviewActionRequest(BaseModel):
    """审核操作请求"""
    reviewNotes: Optional[str] = None  # 审核备注（拒绝时必填）


class ReviewStatisticsResponse(BaseModel):
    """审核统计响应"""
    total: int
    pending: int
    approved: int
    rejected: int
    by_type: dict  # 按类型统计


# ==================== Helper Functions ====================

def map_article_to_review_item(article: Article) -> dict:
    """将Article对象映射为ReviewItem"""
    # 清理excerpt中的HTML标签
    description = strip_html_tags(article.excerpt) if article.excerpt else None

    return {
        "id": article.id,
        "type": "article",
        "title": article.title,
        "author": article.author,
        "authorId": article.author_id,
        "category": f"{article.category_primary or ''} > {article.category_secondary or ''}".strip(" >"),
        "description": description,
        "tags": article.tags if isinstance(article.tags, list) else [],
        "reviewStatus": article.review_status,
        "reviewerId": article.reviewer_id,
        "reviewNotes": article.review_notes,
        "reviewedAt": article.reviewed_at,
        "createdAt": article.created_at,
        "updatedAt": article.updated_at,
        "coverImage": article.cover_url,
    }


def map_video_to_review_item(video: Video) -> dict:
    """将Video对象映射为ReviewItem"""
    # 清理description中的HTML标签
    description = strip_html_tags(video.description) if video.description else None

    return {
        "id": video.id,
        "type": "video",
        "title": video.title,
        "author": video.author,
        "authorId": getattr(video, 'author_id', None),
        "category": video.category,
        "description": description,
        "tags": [],
        "reviewStatus": getattr(video, 'review_status', 'approved'),
        "reviewerId": getattr(video, 'reviewer_id', None),
        "reviewNotes": getattr(video, 'review_notes', None),
        "reviewedAt": getattr(video, 'reviewed_at', None),
        "createdAt": video.created_at,
        "updatedAt": video.updated_at,
        "coverImage": video.cover_local or video.cover_url,
        "bvid": video.bvid,
    }


def map_schedule_to_review_item(schedule: Schedule) -> dict:
    """将Schedule对象映射为ReviewItem"""
    return {
        "id": schedule.id,
        "type": "schedule",
        "title": schedule.theme,
        "author": None,
        "authorId": getattr(schedule, 'author_id', None),
        "category": schedule.category,
        "description": schedule.description,
        "tags": schedule.tags.split(',') if schedule.tags else [],
        "reviewStatus": schedule.review_status,
        "reviewerId": getattr(schedule, 'reviewer_id', None),
        "reviewNotes": getattr(schedule, 'review_notes', None),
        "reviewedAt": getattr(schedule, 'reviewed_at', None),
        "createdAt": schedule.created_at,
        "updatedAt": schedule.updated_at,
        "coverImage": schedule.image_thumb or schedule.image,
        "date": schedule.date,
        "city": schedule.city,
        "venue": schedule.venue,
    }


def map_gallery_to_review_item(gallery: PhotoGroup) -> dict:
    """将PhotoGroup对象映射为ReviewItem"""
    return {
        "id": gallery.id,
        "type": "gallery",
        "title": gallery.title,
        "author": None,
        "authorId": getattr(gallery, 'author_id', None),
        "category": gallery.category,
        "description": gallery.description,
        "tags": [],
        "reviewStatus": getattr(gallery, 'review_status', 'approved'),
        "reviewerId": getattr(gallery, 'reviewer_id', None),
        "reviewNotes": getattr(gallery, 'review_notes', None),
        "reviewedAt": getattr(gallery, 'reviewed_at', None),
        "createdAt": gallery.created_at,
        "updatedAt": gallery.updated_at,
        "coverImage": gallery.cover_image_thumb_url or gallery.cover_image_url,
        "date": gallery.date.strftime('%Y-%m-%d') if gallery.date else None,
    }


# ==================== API Endpoints ====================

@router.get("/", response_model=List[ReviewItemResponse])
async def get_review_list(
    content_type: Optional[Literal['article', 'video', 'schedule', 'gallery']] = Query(None, description="内容类型筛选"),
    status: Optional[Literal['pending', 'approved', 'rejected']] = Query(None, description="审核状态筛选"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取待审核内容列表（支持分页和筛选）
    - 管理员可查看所有待审核内容
    - 支持按类型、状态筛选
    - 按创建时间倒序排列
    """
    results = []

    # 查询文章
    if content_type is None or content_type == 'article':
        query = db.query(Article).filter(Article.is_deleted == False)
        if status:
            query = query.filter(Article.review_status == status)
        articles = query.order_by(Article.created_at.desc()).offset(skip).limit(limit).all()
        results.extend([map_article_to_review_item(a) for a in articles])

    # 查询视频
    if content_type is None or content_type == 'video':
        query = db.query(Video)
        if status and hasattr(Video, 'review_status'):
            query = query.filter(Video.review_status == status)
        videos = query.order_by(Video.created_at.desc()).offset(skip).limit(limit).all()
        results.extend([map_video_to_review_item(v) for v in videos])

    # 查询行程
    if content_type is None or content_type == 'schedule':
        query = db.query(Schedule)
        if status:
            query = query.filter(Schedule.review_status == status)
        schedules = query.order_by(Schedule.created_at.desc()).offset(skip).limit(limit).all()
        results.extend([map_schedule_to_review_item(s) for s in schedules])

    # 查询图片组
    if content_type is None or content_type == 'gallery':
        query = db.query(PhotoGroup).filter(PhotoGroup.is_deleted == False)
        if status and hasattr(PhotoGroup, 'review_status'):
            query = query.filter(PhotoGroup.review_status == status)
        galleries = query.order_by(PhotoGroup.created_at.desc()).offset(skip).limit(limit).all()
        results.extend([map_gallery_to_review_item(g) for g in galleries])

    # 按创建时间倒序排序
    results.sort(key=lambda x: x['createdAt'], reverse=True)

    return results[:limit]


@router.get("/statistics", response_model=ReviewStatisticsResponse)
async def get_review_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取审核统计数据"""
    stats = {
        "total": 0,
        "pending": 0,
        "approved": 0,
        "rejected": 0,
        "by_type": {
            "article": {"total": 0, "pending": 0, "approved": 0, "rejected": 0},
            "video": {"total": 0, "pending": 0, "approved": 0, "rejected": 0},
            "schedule": {"total": 0, "pending": 0, "approved": 0, "rejected": 0},
            "gallery": {"total": 0, "pending": 0, "approved": 0, "rejected": 0},
        }
    }

    # 统计文章
    for status in ['pending', 'approved', 'rejected']:
        count = db.query(Article).filter(
            Article.is_deleted == False,
            Article.review_status == status
        ).count()
        stats['by_type']['article'][status] = count
        stats[status] += count
        stats['by_type']['article']['total'] += count
        stats['total'] += count

    # 统计视频（如果有review_status字段）
    if hasattr(Video, 'review_status'):
        for status in ['pending', 'approved', 'rejected']:
            count = db.query(Video).filter(Video.review_status == status).count()
            stats['by_type']['video'][status] = count
            stats[status] += count
            stats['by_type']['video']['total'] += count
            stats['total'] += count

    # 统计行程
    for status in ['pending', 'approved', 'rejected']:
        count = db.query(Schedule).filter(Schedule.review_status == status).count()
        stats['by_type']['schedule'][status] = count
        stats[status] += count
        stats['by_type']['schedule']['total'] += count
        stats['total'] += count

    # 统计图片组（如果有review_status字段）
    if hasattr(PhotoGroup, 'review_status'):
        for status in ['pending', 'approved', 'rejected']:
            count = db.query(PhotoGroup).filter(
                PhotoGroup.is_deleted == False,
                PhotoGroup.review_status == status
            ).count()
            stats['by_type']['gallery'][status] = count
            stats[status] += count
            stats['by_type']['gallery']['total'] += count
            stats['total'] += count

    return stats


@router.post("/{content_type}/{content_id}/approve")
async def approve_content(
    content_type: Literal['article', 'video', 'schedule', 'gallery'],
    content_id: str,
    request: ReviewActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """批准内容"""
    content = None

    if content_type == 'article':
        content = db.query(Article).filter(Article.id == content_id).first()
    elif content_type == 'video':
        content = db.query(Video).filter(Video.id == content_id).first()
    elif content_type == 'schedule':
        content = db.query(Schedule).filter(Schedule.id == int(content_id)).first()
    elif content_type == 'gallery':
        content = db.query(PhotoGroup).filter(PhotoGroup.id == content_id).first()

    if not content:
        raise HTTPException(status_code=404, detail="内容不存在")

    # 更新审核状态
    content.review_status = 'approved'
    content.reviewer_id = current_user.id
    content.review_notes = request.reviewNotes
    content.reviewed_at = datetime.utcnow()

    # 自动发布
    if hasattr(content, 'is_published'):
        if isinstance(content.is_published, bool):
            content.is_published = True
        else:
            content.is_published = 1

    db.commit()
    db.refresh(content)

    return {"message": "审核通过", "content_type": content_type, "content_id": content_id}


@router.post("/{content_type}/{content_id}/reject")
async def reject_content(
    content_type: Literal['article', 'video', 'schedule', 'gallery'],
    content_id: str,
    request: ReviewActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """拒绝内容"""
    if not request.reviewNotes:
        raise HTTPException(status_code=400, detail="拒绝时必须填写审核意见")

    content = None

    if content_type == 'article':
        content = db.query(Article).filter(Article.id == content_id).first()
    elif content_type == 'video':
        content = db.query(Video).filter(Video.id == content_id).first()
    elif content_type == 'schedule':
        content = db.query(Schedule).filter(Schedule.id == int(content_id)).first()
    elif content_type == 'gallery':
        content = db.query(PhotoGroup).filter(PhotoGroup.id == content_id).first()

    if not content:
        raise HTTPException(status_code=404, detail="内容不存在")

    # 更新审核状态
    content.review_status = 'rejected'
    content.reviewer_id = current_user.id
    content.review_notes = request.reviewNotes
    content.reviewed_at = datetime.utcnow()

    # 取消发布
    if hasattr(content, 'is_published'):
        if isinstance(content.is_published, bool):
            content.is_published = False
        else:
            content.is_published = 0

    db.commit()
    db.refresh(content)

    return {"message": "已拒绝", "content_type": content_type, "content_id": content_id, "reason": request.review_notes}


@router.get("/{content_type}/{content_id}/detail")
async def get_review_detail(
    content_type: Literal['article', 'video', 'schedule', 'gallery'],
    content_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取审核详情"""
    content = None

    if content_type == 'article':
        content = db.query(Article).filter(Article.id == content_id).first()
        if content:
            return map_article_to_review_item(content)
    elif content_type == 'video':
        content = db.query(Video).filter(Video.id == content_id).first()
        if content:
            return map_video_to_review_item(content)
    elif content_type == 'schedule':
        content = db.query(Schedule).filter(Schedule.id == int(content_id)).first()
        if content:
            return map_schedule_to_review_item(content)
    elif content_type == 'gallery':
        content = db.query(PhotoGroup).filter(PhotoGroup.id == content_id).first()
        if content:
            return map_gallery_to_review_item(content)

    if not content:
        raise HTTPException(status_code=404, detail="内容不存在")

    return content
