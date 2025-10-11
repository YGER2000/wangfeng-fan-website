# -*- coding: utf-8 -*-
"""管理员功能路由"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from ..database import get_db
from ..core.permissions import require_admin, require_super_admin
from ..models.user_db import User, UserStatus
from ..models.roles import UserRole
from ..models.article import ReviewStatus
from ..models.admin_log import LogActionType, LogResourceType
from ..schemas.admin import (
    AdminLogResponse,
    AdminLogCreate,
    ArticleReviewAction,
    ArticleAdminResponse,
    UserAdminResponse,
    UserUpdateRole,
    UserBanAction,
    UserUnbanAction,
    ScheduleAdminResponse,
)
from ..schemas.dashboard import DashboardStats, DashboardChartData
from ..crud import admin_log, admin_articles, admin_users, admin_dashboard
from ..crud.article import get_article
from ..services.schedule_service_mysql import ScheduleServiceMySQL

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ============= 辅助函数 =============
def create_admin_log(
    db: Session,
    current_user: User,
    action: LogActionType,
    resource_type: LogResourceType,
    resource_id: Optional[str] = None,
    description: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None
):
    """创建管理员操作日志"""
    log_data = AdminLogCreate(
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        operator_id=str(current_user.id),
        operator_username=current_user.username,
        operator_role=current_user.role.value,
        description=description,
        details=json.dumps(details, ensure_ascii=False) if details else None,
        ip_address=ip_address,
        user_agent=None
    )
    return admin_log.create_log(db=db, log_data=log_data)


# ============= 仪表盘统计 =============
@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """获取仪表盘统计数据"""
    stats = admin_dashboard.get_dashboard_stats(db)
    return stats


@router.get("/dashboard/charts")
def get_dashboard_charts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """获取仪表盘图表数据"""
    user_growth = admin_dashboard.get_user_growth_data(db, days=30)
    article_by_category = admin_dashboard.get_article_stats_by_category(db)
    article_by_status = admin_dashboard.get_article_stats_by_status(db)

    return {
        "user_growth": user_growth,
        "article_by_category": article_by_category,
        "article_by_status": article_by_status
    }


# ============= 文章管理 =============
@router.get("/articles", response_model=List[ArticleAdminResponse])
def get_articles_for_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[ReviewStatus] = Query(None),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """获取文章列表（管理员）"""
    articles = admin_articles.get_articles_for_review(
        db=db,
        skip=skip,
        limit=limit,
        status=status,
        search=search,
        category_primary=category
    )
    return articles


@router.get("/articles/count")
def get_articles_count_admin(
    status: Optional[ReviewStatus] = Query(None),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """获取文章总数"""
    count = admin_articles.get_articles_count(
        db=db,
        status=status,
        search=search,
        category_primary=category
    )
    return {"count": count}


@router.get("/articles/{article_id}", response_model=ArticleAdminResponse)
def get_article_detail_admin(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """获取文章详情（管理员）"""
    article = admin_articles.get_article_with_details(db=db, article_id=article_id)
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")
    return article


@router.put("/articles/{article_id}/approve", response_model=ArticleAdminResponse)
def approve_article_endpoint(
    article_id: str,
    review_data: Optional[ArticleReviewAction] = None,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """批准文章"""
    article = admin_articles.approve_article(
        db=db,
        article_id=article_id,
        reviewer_id=str(current_user.id),
        review_data=review_data
    )

    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")

    # 记录日志
    create_admin_log(
        db=db,
        current_user=current_user,
        action=LogActionType.APPROVE,
        resource_type=LogResourceType.ARTICLE,
        resource_id=article_id,
        description=f"批准文章: {article.title}",
        details={"review_notes": review_data.review_notes if review_data else None},
        ip_address=request.client.host if request else None
    )

    return article


@router.put("/articles/{article_id}/reject", response_model=ArticleAdminResponse)
def reject_article_endpoint(
    article_id: str,
    review_data: ArticleReviewAction,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """拒绝文章"""
    if not review_data.review_notes:
        raise HTTPException(status_code=400, detail="拒绝文章时必须提供拒绝原因")

    article = admin_articles.reject_article(
        db=db,
        article_id=article_id,
        reviewer_id=str(current_user.id),
        review_data=review_data
    )

    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")

    # 记录日志
    create_admin_log(
        db=db,
        current_user=current_user,
        action=LogActionType.REJECT,
        resource_type=LogResourceType.ARTICLE,
        resource_id=article_id,
        description=f"拒绝文章: {article.title}",
        details={"review_notes": review_data.review_notes},
        ip_address=request.client.host if request else None
    )

    return article


@router.delete("/articles/{article_id}")
def delete_article_admin(
    article_id: str,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """删除文章（仅超级管理员）"""
    article = get_article(db=db, article_id=article_id)
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")

    success = admin_articles.force_delete_article(db=db, article_id=article_id)

    if not success:
        raise HTTPException(status_code=500, detail="删除失败")

    # 记录日志
    create_admin_log(
        db=db,
        current_user=current_user,
        action=LogActionType.DELETE,
        resource_type=LogResourceType.ARTICLE,
        resource_id=article_id,
        description=f"删除文章: {article.title}",
        ip_address=request.client.host if request else None
    )

    return {"message": "文章已删除", "article_id": article_id}


# ============= 用户管理 =============
@router.get("/users", response_model=List[UserAdminResponse])
def get_users_for_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    role: Optional[UserRole] = Query(None),
    status: Optional[UserStatus] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """获取用户列表（管理员）"""
    users = admin_users.get_users(
        db=db,
        skip=skip,
        limit=limit,
        role=role,
        status=status,
        search=search
    )
    return users


@router.get("/users/count")
def get_users_count_admin(
    role: Optional[UserRole] = Query(None),
    status: Optional[UserStatus] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """获取用户总数"""
    count = admin_users.get_users_count(
        db=db,
        role=role,
        status=status,
        search=search
    )
    return {"count": count}


@router.get("/users/{user_id}", response_model=UserAdminResponse)
def get_user_detail_admin(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """获取用户详情（管理员）"""
    user = admin_users.get_user_by_id(db=db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user


@router.put("/users/{user_id}/role", response_model=UserAdminResponse)
def update_user_role_endpoint(
    user_id: str,
    role_data: UserUpdateRole,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """更新用户角色（仅超级管理员）"""
    # 不能修改自己的角色
    if str(current_user.id) == user_id:
        raise HTTPException(status_code=403, detail="不能修改自己的角色")

    target_user = admin_users.get_user_by_id(db=db, user_id=user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="用户不存在")

    old_role = target_user.role

    user = admin_users.update_user_role(
        db=db,
        user_id=user_id,
        new_role=role_data.role
    )

    # 记录日志
    create_admin_log(
        db=db,
        current_user=current_user,
        action=LogActionType.ROLE_CHANGE,
        resource_type=LogResourceType.USER,
        resource_id=user_id,
        description=f"修改用户角色: {target_user.username} ({old_role.value} -> {role_data.role.value})",
        details={"old_role": old_role.value, "new_role": role_data.role.value},
        ip_address=request.client.host if request else None
    )

    return user


@router.put("/users/{user_id}/ban", response_model=UserAdminResponse)
def ban_user_endpoint(
    user_id: str,
    ban_data: Optional[UserBanAction] = None,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """封禁用户"""
    # 不能封禁自己
    if str(current_user.id) == user_id:
        raise HTTPException(status_code=403, detail="不能封禁自己")

    target_user = admin_users.get_user_by_id(db=db, user_id=user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 普通管理员不能封禁管理员
    if current_user.role == UserRole.ADMIN and target_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="权限不足：无法封禁管理员")

    user = admin_users.ban_user(db=db, user_id=user_id)

    # 记录日志
    create_admin_log(
        db=db,
        current_user=current_user,
        action=LogActionType.BAN,
        resource_type=LogResourceType.USER,
        resource_id=user_id,
        description=f"封禁用户: {target_user.username}",
        details={"reason": ban_data.reason if ban_data else None},
        ip_address=request.client.host if request else None
    )

    return user


@router.put("/users/{user_id}/unban", response_model=UserAdminResponse)
def unban_user_endpoint(
    user_id: str,
    unban_data: Optional[UserUnbanAction] = None,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """解封用户"""
    target_user = admin_users.get_user_by_id(db=db, user_id=user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="用户不存在")

    user = admin_users.unban_user(db=db, user_id=user_id)

    # 记录日志
    create_admin_log(
        db=db,
        current_user=current_user,
        action=LogActionType.UNBAN,
        resource_type=LogResourceType.USER,
        resource_id=user_id,
        description=f"解封用户: {target_user.username}",
        details={"reason": unban_data.reason if unban_data else None},
        ip_address=request.client.host if request else None
    )

    return user


# ============= 行程管理 =============
@router.get("/schedules")
def get_schedules_for_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """获取行程列表（管理员）"""
    from ..models.schedule_db import Schedule

    schedules = db.query(Schedule).order_by(
        Schedule.date.desc()
    ).offset(skip).limit(limit).all()

    return [schedule.to_dict() for schedule in schedules]


@router.get("/schedules/count")
def get_schedules_count_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """获取行程总数"""
    from ..models.schedule_db import Schedule

    count = db.query(Schedule).count()
    return {"count": count}


@router.put("/schedules/{schedule_id}/approve")
def approve_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """审核通过行程"""
    from ..models.schedule_db import Schedule

    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="行程不存在")

    schedule.review_status = "approved"
    db.commit()

    # 记录日志
    from ..schemas.admin import AdminLogCreate
    from ..models.admin_log import LogActionType, LogResourceType

    log_data = AdminLogCreate(
        action=LogActionType.APPROVE,
        resource_type=LogResourceType.SCHEDULE,
        resource_id=str(schedule_id),
        operator_id=str(current_user.id),
        operator_username=current_user.username,
        operator_role=current_user.role,
        description=f"审核通过行程：{schedule.theme}"
    )
    admin_log.create_log(db=db, log_data=log_data)

    return {"message": "行程审核通过", "schedule": schedule.to_dict()}


@router.put("/schedules/{schedule_id}/reject")
def reject_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """拒绝行程并删除"""
    from ..models.schedule_db import Schedule

    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="行程不存在")

    schedule_theme = schedule.theme

    # 记录日志
    from ..schemas.admin import AdminLogCreate
    from ..models.admin_log import LogActionType, LogResourceType

    log_data = AdminLogCreate(
        action=LogActionType.REJECT,
        resource_type=LogResourceType.SCHEDULE,
        resource_id=str(schedule_id),
        operator_id=str(current_user.id),
        operator_username=current_user.username,
        operator_role=current_user.role,
        description=f"拒绝行程：{schedule_theme}"
    )
    admin_log.create_log(db=db, log_data=log_data)

    # 直接删除被拒绝的行程
    db.delete(schedule)
    db.commit()

    return {"message": "行程已拒绝并删除"}


@router.put("/schedules/{schedule_id}")
async def update_schedule(
    schedule_id: int,
    category: Optional[str] = Form(None),
    date: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    venue: Optional[str] = Form(None),
    theme: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """更新行程信息"""
    schedule_service = ScheduleServiceMySQL(db)
    updated = schedule_service.update_entry(
        schedule_id,
        category=category,
        date=date,
        city=city,
        venue=venue,
        theme=theme,
        description=description,
        image_file=image,
    )

    if not updated:
        raise HTTPException(status_code=404, detail="行程不存在")

    create_admin_log(
        db=db,
        current_user=current_user,
        action=LogActionType.UPDATE,
        resource_type=LogResourceType.SCHEDULE,
        resource_id=str(schedule_id),
        description=f"更新行程：{updated.get('theme', '')}"
    )

    return {"message": "行程已更新", "schedule": updated}


@router.put("/schedules/{schedule_id}/publish")
def publish_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """发布行程 - 此时才创建文件夹和保存图片"""
    from ..models.schedule_db import Schedule

    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="行程不存在")

    if schedule.review_status != "approved":
        raise HTTPException(status_code=400, detail="只有已审核的行程才能发布")

    # 使用service的publish方法来处理文件保存
    schedule_service = ScheduleServiceMySQL(db)
    updated_schedule = schedule_service.publish_schedule(schedule_id)

    if not updated_schedule:
        raise HTTPException(status_code=404, detail="行程不存在")

    # 更新发布状态
    schedule.is_published = 1
    db.commit()

    # 记录日志
    from ..schemas.admin import AdminLogCreate
    from ..models.admin_log import LogActionType, LogResourceType

    log_data = AdminLogCreate(
        action=LogActionType.UPDATE,
        resource_type=LogResourceType.SCHEDULE,
        resource_id=str(schedule_id),
        operator_id=str(current_user.id),
        operator_username=current_user.username,
        operator_role=current_user.role,
        description=f"发布行程：{schedule.theme}"
    )
    admin_log.create_log(db=db, log_data=log_data)

    return {"message": "行程已发布", "schedule": schedule.to_dict()}


@router.put("/schedules/{schedule_id}/unpublish")
def unpublish_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """取消发布行程"""
    from ..models.schedule_db import Schedule

    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="行程不存在")

    schedule.is_published = 0
    db.commit()

    # 记录日志
    from ..schemas.admin import AdminLogCreate
    from ..models.admin_log import LogActionType, LogResourceType

    log_data = AdminLogCreate(
        action=LogActionType.UPDATE,
        resource_type=LogResourceType.SCHEDULE,
        resource_id=str(schedule_id),
        operator_id=str(current_user.id),
        operator_username=current_user.username,
        operator_role=current_user.role,
        description=f"取消发布行程：{schedule.theme}"
    )
    admin_log.create_log(db=db, log_data=log_data)

    return {"message": "行程已取消发布", "schedule": schedule.to_dict()}


@router.delete("/schedules/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """删除行程（仅超级管理员）"""
    schedule_service = ScheduleServiceMySQL(db)
    schedule = schedule_service.get_entry_by_id(schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="行程不存在")

    deleted = schedule_service.delete_entry(schedule_id)
    if not deleted:
        raise HTTPException(status_code=500, detail="删除行程失败")

    create_admin_log(
        db=db,
        current_user=current_user,
        action=LogActionType.DELETE,
        resource_type=LogResourceType.SCHEDULE,
        resource_id=str(schedule_id),
        description=f"删除行程：{schedule.get('theme', '')}"
    )

    return {"message": "行程已删除"}


# ============= 日志管理 =============
@router.get("/logs", response_model=List[AdminLogResponse])
def get_admin_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    action: Optional[LogActionType] = Query(None),
    resource_type: Optional[LogResourceType] = Query(None),
    operator_id: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """获取管理员操作日志"""
    logs = admin_log.get_logs(
        db=db,
        skip=skip,
        limit=limit,
        action=action,
        resource_type=resource_type,
        operator_id=operator_id,
        start_date=start_date,
        end_date=end_date
    )
    return logs


@router.get("/logs/count")
def get_logs_count_endpoint(
    action: Optional[LogActionType] = Query(None),
    resource_type: Optional[LogResourceType] = Query(None),
    operator_id: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """获取日志总数"""
    count = admin_log.get_logs_count(
        db=db,
        action=action,
        resource_type=resource_type,
        operator_id=operator_id,
        start_date=start_date,
        end_date=end_date
    )
    return {"count": count}


@router.get("/logs/recent", response_model=List[AdminLogResponse])
def get_recent_logs_endpoint(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """获取最近的操作日志"""
    logs = admin_log.get_recent_logs(db=db, limit=limit)
    return logs


@router.post("/logs", response_model=AdminLogResponse)
def create_log_endpoint(
    log_data: AdminLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """创建审计日志记录"""
    log = admin_log.create_log(db=db, log_data=log_data)
    return log
