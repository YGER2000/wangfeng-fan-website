# -*- coding: utf-8 -*-
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class GameDifficulty(str, enum.Enum):
    """游戏难度枚举"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Game(Base):
    """游戏表"""
    __tablename__ = "games"

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String(20), default="medium", nullable=False)
    icon_emoji = Column(String(10), nullable=True)
    play_count = Column(Integer, default=0)
    route_path = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Poll(Base):
    """投票表"""
    __tablename__ = "polls"

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    status = Column(String(20), default="upcoming", nullable=False)  # upcoming/active/ended
    total_votes = Column(Integer, default=0)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PollOption(Base):
    """投票选项表"""
    __tablename__ = "poll_options"

    id = Column(String(36), primary_key=True, index=True)
    poll_id = Column(String(36), nullable=False, index=True)
    label = Column(String(255), nullable=False)
    image_url = Column(String(512), nullable=True)
    vote_count = Column(Integer, default=0)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class PollVote(Base):
    """投票记录表 - 用于防重复投票"""
    __tablename__ = "poll_votes"

    id = Column(String(36), primary_key=True, index=True)
    poll_id = Column(String(36), nullable=False, index=True)
    option_id = Column(String(36), nullable=False, index=True)
    user_ip = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_id = Column(String(36), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class GameScore(Base):
    """游戏成绩表"""
    __tablename__ = "game_scores"

    id = Column(String(36), primary_key=True, index=True)
    game_id = Column(String(36), nullable=False, index=True)
    user_ip = Column(String(45), nullable=True)
    user_id = Column(String(36), nullable=True, index=True)
    score = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
