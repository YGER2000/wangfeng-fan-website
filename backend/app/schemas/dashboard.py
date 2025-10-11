# -*- coding: utf-8 -*-
"""后台仪表盘统计数据Schema"""
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


class DashboardStats(BaseModel):
    """仪表盘统计数据"""
    # 总数统计
    total_users: int
    total_articles: int
    total_comments: int
    total_schedules: int

    # 待审核数量
    pending_articles: int

    # 今日统计
    today_new_users: int
    today_new_articles: int
    today_new_comments: int

    # 本周统计
    week_new_users: int
    week_new_articles: int
    week_new_comments: int

    # 本月统计
    month_new_users: int
    month_new_articles: int
    month_new_comments: int


class UserGrowthData(BaseModel):
    """用户增长数据"""
    date: str
    count: int


class ArticleStatsData(BaseModel):
    """文章统计数据"""
    category: str
    count: int


class DashboardChartData(BaseModel):
    """仪表盘图表数据"""
    user_growth: List[UserGrowthData]  # 用户增长趋势
    article_by_category: List[ArticleStatsData]  # 按分类统计文章
    article_by_status: Dict[str, int]  # 按状态统计文章


class SystemInfo(BaseModel):
    """系统信息"""
    version: str
    environment: str
    database_size: Optional[str] = None
    uptime: Optional[str] = None
    last_backup: Optional[datetime] = None


class RecentActivity(BaseModel):
    """最近活动记录"""
    id: str
    action: str
    resource_type: str
    operator_username: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True
