from enum import Enum
from typing import Literal, Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class ScheduleCategory(str, Enum):
    concert = '演唱会'
    festival = '音乐节'
    commercial = '商演'
    variety = '综艺活动'
    other = '其他'


class ScheduleBase(BaseModel):
    category: ScheduleCategory = Field(..., description='行程分类')
    date: str = Field(..., description='行程日期，格式 YYYY-MM-DD')
    city: str = Field(..., description='城市')
    venue: Optional[str] = Field(default=None, description='具体地点')
    theme: str = Field(..., description='行程主题或具体事项')
    description: Optional[str] = Field(default=None, description='补充说明')
    tags: Optional[List[str]] = Field(default=None, description='标签列表')


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleResponse(ScheduleBase):
    id: int
    image: Optional[str] = None
    tags: Optional[List[str]] = None
    source: Literal['legacy', 'custom']
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
