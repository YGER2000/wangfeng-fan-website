# -*- coding: utf-8 -*-
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class GameBase(BaseModel):
    title: str
    description: str
    difficulty: str = "medium"
    icon_emoji: Optional[str] = None
    route_path: Optional[str] = None
    is_active: bool = True


class GameCreate(GameBase):
    pass


class GameResponse(GameBase):
    id: str
    play_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PollOptionBase(BaseModel):
    label: str
    image_url: Optional[str] = None
    sort_order: int = 0


class PollOptionCreate(PollOptionBase):
    pass


class PollOptionResponse(PollOptionBase):
    id: str
    poll_id: str
    vote_count: int = 0

    class Config:
        from_attributes = True


class PollBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_published: bool = False


class PollCreate(PollBase):
    options: List[PollOptionCreate] = []


class PollUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_published: Optional[bool] = None


class PollResponse(PollBase):
    id: str
    status: str
    total_votes: int = 0
    options: List[PollOptionResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PollVoteRequest(BaseModel):
    poll_id: str
    option_id: str


class GameScoreRequest(BaseModel):
    game_id: str
    score: int
    total_questions: int
    correct_answers: int


class GameScoreResponse(BaseModel):
    id: str
    game_id: str
    score: int
    total_questions: int
    correct_answers: int
    created_at: datetime

    class Config:
        from_attributes = True
