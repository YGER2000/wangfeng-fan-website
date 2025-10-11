# -*- coding: utf-8 -*-
"""管理员操作日志CRUD操作"""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from ..models.admin_log import AdminLog, LogActionType, LogResourceType
from ..schemas.admin import AdminLogCreate


def create_log(db: Session, log_data: AdminLogCreate) -> AdminLog:
    """创建管理员操作日志"""
    db_log = AdminLog(
        id=str(uuid.uuid4()),
        action=log_data.action,
        resource_type=log_data.resource_type,
        resource_id=log_data.resource_id,
        operator_id=log_data.operator_id,
        operator_username=log_data.operator_username,
        operator_role=log_data.operator_role,
        description=log_data.description,
        details=log_data.details,
        ip_address=log_data.ip_address,
        user_agent=log_data.user_agent,
        created_at=datetime.utcnow()
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


def get_logs(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    action: Optional[LogActionType] = None,
    resource_type: Optional[LogResourceType] = None,
    operator_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[AdminLog]:
    """
    获取管理员操作日志列表

    Args:
        db: 数据库会话
        skip: 跳过的记录数
        limit: 返回的最大记录数
        action: 操作类型过滤
        resource_type: 资源类型过滤
        operator_id: 操作者ID过滤
        start_date: 开始时间
        end_date: 结束时间
    """
    query = db.query(AdminLog)

    if action:
        query = query.filter(AdminLog.action == action)

    if resource_type:
        query = query.filter(AdminLog.resource_type == resource_type)

    if operator_id:
        query = query.filter(AdminLog.operator_id == operator_id)

    if start_date:
        query = query.filter(AdminLog.created_at >= start_date)

    if end_date:
        query = query.filter(AdminLog.created_at <= end_date)

    return query.order_by(AdminLog.created_at.desc()).offset(skip).limit(limit).all()


def get_log_by_id(db: Session, log_id: str) -> Optional[AdminLog]:
    """根据ID获取日志"""
    return db.query(AdminLog).filter(AdminLog.id == log_id).first()


def get_logs_count(
    db: Session,
    action: Optional[LogActionType] = None,
    resource_type: Optional[LogResourceType] = None,
    operator_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> int:
    """获取日志总数"""
    query = db.query(AdminLog)

    if action:
        query = query.filter(AdminLog.action == action)

    if resource_type:
        query = query.filter(AdminLog.resource_type == resource_type)

    if operator_id:
        query = query.filter(AdminLog.operator_id == operator_id)

    if start_date:
        query = query.filter(AdminLog.created_at >= start_date)

    if end_date:
        query = query.filter(AdminLog.created_at <= end_date)

    return query.count()


def get_recent_logs(db: Session, limit: int = 10) -> List[AdminLog]:
    """获取最近的操作日志"""
    return db.query(AdminLog).order_by(AdminLog.created_at.desc()).limit(limit).all()


def get_user_logs(db: Session, user_id: str, limit: int = 50) -> List[AdminLog]:
    """获取指定用户的操作日志"""
    return db.query(AdminLog).filter(
        AdminLog.operator_id == user_id
    ).order_by(AdminLog.created_at.desc()).limit(limit).all()


def delete_old_logs(db: Session, days: int = 90) -> int:
    """删除指定天数之前的日志"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    deleted_count = db.query(AdminLog).filter(
        AdminLog.created_at < cutoff_date
    ).delete()
    db.commit()
    return deleted_count
