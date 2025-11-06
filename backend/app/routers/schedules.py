from typing import List, Optional
import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ..schemas.schedule import ScheduleCategory, ScheduleCreate, ScheduleResponse
from ..services.schedule_service_mysql import ScheduleServiceMySQL
from ..core.dependencies import get_schedule_service

router = APIRouter(prefix="/api/schedules", tags=["行程"])


@router.get("", response_model=List[ScheduleResponse])
def list_schedules(
    schedule_service: ScheduleServiceMySQL = Depends(get_schedule_service)
):
    """获取所有已发布的行程（前台展示）"""
    from ..models.schedule_db import Schedule
    from sqlalchemy.orm import Session

    # 只返回已发布的行程
    schedules = schedule_service.db.query(Schedule).filter(
        Schedule.is_published == 1
    ).order_by(Schedule.date.desc()).all()

    return [schedule.to_dict() for schedule in schedules]


@router.post("", response_model=ScheduleResponse)
async def create_schedule(
    category: ScheduleCategory = Form(...),
    date: str = Form(...),
    city: str = Form(...),
    venue: Optional[str] = Form(None),
    theme: str = Form(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    images: Optional[List[UploadFile]] = File(None),
    cover_index: Optional[int] = Form(None),
    schedule_service: ScheduleServiceMySQL = Depends(get_schedule_service)
):
    """创建新行程，支持多张海报"""
    try:
        # 将逗号分隔的标签字符串转换为列表
        tags_list = [tag.strip() for tag in tags.split(',')] if tags else None
        payload = ScheduleCreate(
            category=category,
            date=date,
            city=city,
            venue=venue,
            theme=theme,
            description=description,
            tags=tags_list,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # 用户提交时不保存文件，仅暂存数据
    created = schedule_service.create_entry(
        category=payload.category.value,
        date=payload.date,
        city=payload.city,
        venue=payload.venue,
        theme=payload.theme,
        description=payload.description,
        tags=','.join(payload.tags) if payload.tags else None,
        image_file=image,
        images_files=images or [],
        cover_index=cover_index,
        save_file=False,  # 不立即保存文件
    )
    return created
