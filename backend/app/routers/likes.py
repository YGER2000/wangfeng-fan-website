from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from ..models.like import LikeStats, Like
from ..services.like_service import LikeService
from ..core.dependencies import get_like_service, get_current_active_user, get_optional_current_user
from ..models.user import UserInDB

router = APIRouter(prefix="/api/likes", tags=["点赞"])


@router.post("/{post_id}")
def toggle_like(
    post_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    like_service: LikeService = Depends(get_like_service)
):
    """切换点赞状态（点赞/取消点赞）"""
    try:
        result = like_service.toggle_like(post_id, current_user.id, current_user.username)
        return {
            "message": f"已{'点赞' if result['action'] == 'liked' else '取消点赞'}",
            "action": result["action"],
            "stats": result["stats"]
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{post_id}", response_model=LikeStats)
def get_like_stats(
    post_id: str,
    current_user: UserInDB = Depends(get_optional_current_user),
    like_service: LikeService = Depends(get_like_service)
):
    """获取文章的点赞统计（游客可访问）"""
    user_id = current_user.id if current_user else None
    return like_service.get_like_stats(post_id, user_id)


@router.get("/{post_id}/users", response_model=List[dict])
def get_like_users(
    post_id: str,
    like_service: LikeService = Depends(get_like_service)
):
    """获取点赞用户列表"""
    likes = like_service.get_likes_by_post_id(post_id)
    return [
        {
            "id": like.id,
            "username": like.username,
            "created_at": like.created_at
        } for like in likes
    ]


@router.get("/{post_id}/count")
def get_like_count(
    post_id: str,
    like_service: LikeService = Depends(get_like_service)
):
    """获取文章的点赞数"""
    count = like_service.get_like_count_by_post_id(post_id)
    return {"post_id": post_id, "like_count": count}


@router.get("/{post_id}/check")
def check_user_liked(
    post_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    like_service: LikeService = Depends(get_like_service)
):
    """检查当前用户是否已点赞"""
    liked = like_service.check_user_liked(post_id, current_user.id)
    return {"post_id": post_id, "user_liked": liked}