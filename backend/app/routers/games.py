# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from typing import List, Dict, Any, Optional

from ..database import get_db
from ..models.game import Game, Poll, PollOption, PollVote, GameScore
from ..schemas.game import (
    GameResponse, GameCreate,
    PollResponse, PollCreate, PollUpdate,
    GameScoreRequest, GameScoreResponse,
    PollVoteRequest
)
from ..services.game_service import lyrics_guesser, fill_lyrics, song_matcher

router = APIRouter(prefix="/api", tags=["games"])


# ==================== 游戏相关 API ====================

@router.get("/games", response_model=List[GameResponse])
def get_games(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取所有游戏列表"""
    games = db.query(Game).filter(Game.is_active == True).offset(skip).limit(limit).all()
    return games


@router.get("/games/{game_id}", response_model=GameResponse)
def get_game(game_id: str, db: Session = Depends(get_db)):
    """获取单个游戏详情"""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="游戏不存在")
    return game


@router.get("/games/{game_id}/question")
def get_game_question(game_id: str, db: Session = Depends(get_db)):
    """获取游戏问题

    game_id 支持:
    - "lyrics_guesser": 歌词猜歌名
    - "fill_lyrics": 填词游戏
    - "song_matcher": 歌曲配对
    """
    if game_id == "lyrics_guesser":
        question = lyrics_guesser.generate_question()
    elif game_id == "fill_lyrics":
        question = fill_lyrics.generate_question()
    elif game_id == "song_matcher":
        question = song_matcher.generate_question()
    else:
        raise HTTPException(status_code=404, detail="游戏不存在")

    if not question:
        raise HTTPException(status_code=500, detail="生成问题失败，请检查数据")

    return question


@router.post("/games/{game_id}/submit-answer")
def submit_game_answer(
    game_id: str,
    payload: Dict[str, Any],
    request: Request,
    db: Session = Depends(get_db)
):
    """提交游戏答案"""
    user_answer = payload.get("answer")
    correct_answer = payload.get("correct_answer")
    score = payload.get("score", 0)
    total_questions = payload.get("total_questions", 1)
    correct_answers = payload.get("correct_answers", 1 if user_answer == correct_answer else 0)

    # 获取用户IP
    user_ip = request.client.host if request.client else None

    # 记录成绩
    game_score = GameScore(
        id=str(uuid.uuid4()),
        game_id=game_id,
        user_ip=user_ip,
        score=score,
        total_questions=total_questions,
        correct_answers=correct_answers
    )
    db.add(game_score)
    db.commit()
    db.refresh(game_score)

    # 更新游戏的玩过次数
    game = db.query(Game).filter(Game.id == game_id).first()
    if game:
        game.play_count += 1
        db.commit()

    return {
        "is_correct": user_answer == correct_answer,
        "correct_answer": correct_answer,
        "score_id": game_score.id
    }


@router.post("/games/record-play")
def record_game_play(game_id: str, db: Session = Depends(get_db)):
    """记录游戏被玩过"""
    game = db.query(Game).filter(Game.id == game_id).first()
    if game:
        game.play_count += 1
        db.commit()
        return {"play_count": game.play_count}
    raise HTTPException(status_code=404, detail="游戏不存在")


# ==================== 投票相关 API ====================

@router.get("/polls")
def get_polls(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取所有投票"""
    polls = db.query(Poll).filter(Poll.is_published == True).offset(skip).limit(limit).all()

    # 为每个投票附加选项
    result = []
    for poll in polls:
        options = db.query(PollOption).filter(PollOption.poll_id == poll.id).order_by(PollOption.sort_order).all()
        poll_dict = {
            "id": poll.id,
            "title": poll.title,
            "description": poll.description,
            "start_date": poll.start_date,
            "end_date": poll.end_date,
            "status": poll.status,
            "total_votes": poll.total_votes,
            "is_published": poll.is_published,
            "options": [
                {
                    "id": opt.id,
                    "poll_id": opt.poll_id,
                    "label": opt.label,
                    "image_url": opt.image_url,
                    "vote_count": opt.vote_count,
                    "sort_order": opt.sort_order
                }
                for opt in options
            ],
            "created_at": poll.created_at,
            "updated_at": poll.updated_at
        }
        result.append(poll_dict)

    return result


@router.get("/polls/{poll_id}")
def get_poll(poll_id: str, db: Session = Depends(get_db)):
    """获取单个投票详情"""
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="投票不存在")

    options = db.query(PollOption).filter(PollOption.poll_id == poll_id).order_by(PollOption.sort_order).all()

    return {
        "id": poll.id,
        "title": poll.title,
        "description": poll.description,
        "start_date": poll.start_date,
        "end_date": poll.end_date,
        "status": poll.status,
        "total_votes": poll.total_votes,
        "is_published": poll.is_published,
        "options": [
            {
                "id": opt.id,
                "poll_id": opt.poll_id,
                "label": opt.label,
                "image_url": opt.image_url,
                "vote_count": opt.vote_count,
                "sort_order": opt.sort_order
            }
            for opt in options
        ],
        "created_at": poll.created_at,
        "updated_at": poll.updated_at
    }


@router.post("/polls/{poll_id}/vote")
def vote_poll(
    poll_id: str,
    vote_request: PollVoteRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """投票"""
    # 验证投票是否存在
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="投票不存在")

    option = db.query(PollOption).filter(PollOption.id == vote_request.option_id).first()
    if not option:
        raise HTTPException(status_code=404, detail="投票选项不存在")

    # 检查是否已投票（通过IP地址）
    user_ip = request.client.host if request.client else "unknown"

    existing_vote = db.query(PollVote).filter(
        PollVote.poll_id == poll_id,
        PollVote.user_ip == user_ip
    ).first()

    if existing_vote:
        raise HTTPException(status_code=400, detail="您已经投过票了")

    # 记录投票
    poll_vote = PollVote(
        id=str(uuid.uuid4()),
        poll_id=poll_id,
        option_id=vote_request.option_id,
        user_ip=user_ip
    )
    db.add(poll_vote)

    # 更新选项的投票数
    option.vote_count += 1
    poll.total_votes += 1

    db.commit()
    db.refresh(poll)
    db.refresh(option)

    # 返回更新后的投票数据
    options = db.query(PollOption).filter(PollOption.poll_id == poll_id).all()
    total_votes = sum(opt.vote_count for opt in options)

    return {
        "poll_id": poll_id,
        "option_id": vote_request.option_id,
        "vote_count": option.vote_count,
        "total_votes": total_votes,
        "options": [
            {
                "id": opt.id,
                "label": opt.label,
                "image_url": opt.image_url,
                "vote_count": opt.vote_count,
                "percentage": round((opt.vote_count / total_votes * 100) if total_votes > 0 else 0, 1)
            }
            for opt in sorted(options, key=lambda x: x.sort_order)
        ]
    }


# 计算投票百分比的辅助函数
def _calculate_percentages(options: List[PollOption]) -> List[Dict[str, Any]]:
    """计算投票选项的百分比"""
    total = sum(opt.vote_count for opt in options)
    return [
        {
            "id": opt.id,
            "label": opt.label,
            "image_url": opt.image_url,
            "vote_count": opt.vote_count,
            "percentage": round((opt.vote_count / total * 100) if total > 0 else 0, 1)
        }
        for opt in sorted(options, key=lambda x: x.sort_order)
    ]
