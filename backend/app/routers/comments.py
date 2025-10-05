from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from ..schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from ..services.comment_service import CommentService
from ..core.dependencies import get_comment_service, get_current_active_user, get_optional_current_user
from ..models.user import UserInDB

router = APIRouter(prefix="/api/comments", tags=["评论"])


@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    comment_data: CommentCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    comment_service: CommentService = Depends(get_comment_service)
):
    """创建评论（需要登录）"""
    try:
        comment = comment_service.create_comment(
            comment_data, 
            current_user.id, 
            current_user.username,
            current_user.full_name
        )
        return CommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            user_id=comment.user_id,
            username=comment.username,
            user_full_name=comment.user_full_name,
            content=comment.content,
            created_at=comment.created_at,
            updated_at=comment.updated_at
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/post/{post_id}", response_model=List[CommentResponse])
def get_comments_by_post_id(
    post_id: str,
    comment_service: CommentService = Depends(get_comment_service)
):
    """获取文章的评论列表（游客可访问）"""
    comments = comment_service.get_comments_by_post_id(post_id)
    return [
        CommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            user_id=comment.user_id,
            username=comment.username,
            user_full_name=comment.user_full_name,
            content=comment.content,
            created_at=comment.created_at,
            updated_at=comment.updated_at
        ) for comment in comments
    ]


@router.get("/{comment_id}", response_model=CommentResponse)
def get_comment(
    comment_id: str,
    comment_service: CommentService = Depends(get_comment_service)
):
    """获取单个评论"""
    comment = comment_service.get_comment_by_id(comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="评论不存在"
        )
    
    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        user_id=comment.user_id,
        username=comment.username,
        user_full_name=comment.user_full_name,
        content=comment.content,
        created_at=comment.created_at,
        updated_at=comment.updated_at
    )


@router.put("/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: str,
    comment_data: CommentUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    comment_service: CommentService = Depends(get_comment_service)
):
    """更新评论（只有作者可以更新）"""
    try:
        comment = comment_service.update_comment(comment_id, comment_data, current_user.id)
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="评论不存在"
            )
        
        return CommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            user_id=comment.user_id,
            username=comment.username,
            user_full_name=comment.user_full_name,
            content=comment.content,
            created_at=comment.created_at,
            updated_at=comment.updated_at
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    comment_service: CommentService = Depends(get_comment_service)
):
    """删除评论（作者或管理员可删除）"""
    try:
        success = comment_service.delete_comment(comment_id, current_user.id, current_user.role)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="评论不存在"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/post/{post_id}/count")
def get_comment_count(
    post_id: str,
    comment_service: CommentService = Depends(get_comment_service)
):
    """获取文章的评论数"""
    count = comment_service.get_comment_count_by_post_id(post_id)
    return {"post_id": post_id, "comment_count": count}