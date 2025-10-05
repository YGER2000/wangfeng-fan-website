from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ..schemas.schedule import ScheduleCategory, ScheduleCreate, ScheduleResponse
from ..services.schedule_service_mysql import ScheduleServiceMySQL
from ..core.dependencies import get_schedule_service

router = APIRouter(prefix="/api/schedules", tags=["行程"])


@router.get("", response_model=List[ScheduleResponse])
def list_schedules(
    schedule_service: ScheduleServiceMySQL = Depends(get_schedule_service)
):
    return schedule_service.get_all_entries()


@router.post("", response_model=ScheduleResponse)
async def create_schedule(
    category: ScheduleCategory = Form(...),
    date: str = Form(...),
    city: str = Form(...),
    venue: Optional[str] = Form(None),
    theme: str = Form(...),
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    schedule_service: ScheduleServiceMySQL = Depends(get_schedule_service)
):
    try:
        payload = ScheduleCreate(
            category=category,
            date=date,
            city=city,
            venue=venue,
            theme=theme,
            description=description,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    created = schedule_service.create_entry(
        category=payload.category.value,
        date=payload.date,
        city=payload.city,
        venue=payload.venue,
        theme=payload.theme,
        description=payload.description,
        image_file=image,
    )
    return created
