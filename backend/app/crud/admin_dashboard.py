# -*- coding: utf-8 -*-
"""仪表盘统计数据CRUD操作"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict
from datetime import datetime, timedelta

from ..models.user_db import User
from ..models.article import Article, ReviewStatus
from ..models.schedule_db import Schedule


def get_dashboard_stats(db: Session) -> Dict:
    """
    获取仪表盘统计数据

    Returns:
        包含各种统计数据的字典
    """
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)

    # 总数统计
    total_users = db.query(User).count()
    total_articles = db.query(Article).filter(Article.is_deleted == False).count()
    total_schedules = db.query(Schedule).count()

    # 待审核文章数量
    pending_articles = db.query(Article).filter(
        Article.is_deleted == False,
        Article.review_status == ReviewStatus.PENDING
    ).count()

    # 今日新增
    today_new_users = db.query(User).filter(User.created_at >= today_start).count()
    today_new_articles = db.query(Article).filter(
        Article.created_at >= today_start,
        Article.is_deleted == False
    ).count()

    # 本周新增
    week_new_users = db.query(User).filter(User.created_at >= week_start).count()
    week_new_articles = db.query(Article).filter(
        Article.created_at >= week_start,
        Article.is_deleted == False
    ).count()

    # 本月新增
    month_new_users = db.query(User).filter(User.created_at >= month_start).count()
    month_new_articles = db.query(Article).filter(
        Article.created_at >= month_start,
        Article.is_deleted == False
    ).count()

    return {
        "total_users": total_users,
        "total_articles": total_articles,
        "total_comments": 0,  # MongoDB评论数据，需要单独查询
        "total_schedules": total_schedules,
        "pending_articles": pending_articles,
        "today_new_users": today_new_users,
        "today_new_articles": today_new_articles,
        "today_new_comments": 0,
        "week_new_users": week_new_users,
        "week_new_articles": week_new_articles,
        "week_new_comments": 0,
        "month_new_users": month_new_users,
        "month_new_articles": month_new_articles,
        "month_new_comments": 0,
    }


def get_user_growth_data(db: Session, days: int = 30) -> List[Dict]:
    """
    获取用户增长数据

    Args:
        db: 数据库会话
        days: 获取最近多少天的数据

    Returns:
        用户增长数据列表
    """
    start_date = datetime.utcnow() - timedelta(days=days)

    # 按日期分组统计
    results = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).filter(
        User.created_at >= start_date
    ).group_by(
        func.date(User.created_at)
    ).order_by('date').all()

    return [{"date": str(row.date), "count": row.count} for row in results]


def get_article_stats_by_category(db: Session) -> List[Dict]:
    """
    按分类统计文章数量

    Returns:
        文章分类统计数据
    """
    results = db.query(
        Article.category_primary.label('category'),
        func.count(Article.id).label('count')
    ).filter(
        Article.is_deleted == False
    ).group_by(
        Article.category_primary
    ).all()

    return [{"category": row.category, "count": row.count} for row in results]


def get_article_stats_by_status(db: Session) -> Dict[str, int]:
    """
    按状态统计文章数量

    Returns:
        文章状态统计数据
    """
    results = db.query(
        Article.review_status.label('status'),
        func.count(Article.id).label('count')
    ).filter(
        Article.is_deleted == False
    ).group_by(
        Article.review_status
    ).all()

    return {row.status.value: row.count for row in results}
