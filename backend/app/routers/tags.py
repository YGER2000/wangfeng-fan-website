"""Tag API Routes"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.tag_service import TagService
from ..schemas.tag import (
    TagCreate, TagUpdate, TagResponse,
    ContentTagCreate, ContentType
)

router = APIRouter(prefix="/api/tags", tags=["标签"])


def get_tag_service(db: Session = Depends(get_db)) -> TagService:
    """获取标签服务实例"""
    return TagService(db)


# ==================== 标签 CRUD ====================

@router.post("", response_model=TagResponse, summary="创建标签")
def create_tag(
    tag_data: TagCreate,
    tag_service: TagService = Depends(get_tag_service)
):
    """创建新标签"""
    tag = tag_service.create_tag(tag_data)
    return tag.to_dict()


@router.get("", response_model=List[TagResponse], summary="获取所有标签")
def list_tags(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    tag_service: TagService = Depends(get_tag_service)
):
    """获取所有标签列表"""
    tags = tag_service.list_tags(skip=skip, limit=limit)
    return [tag.to_dict() for tag in tags]


@router.get("/search", response_model=List[TagResponse], summary="搜索标签")
def search_tags(
    q: str = Query(..., min_length=1, description="搜索关键词"),
    limit: int = Query(20, ge=1, le=100),
    tag_service: TagService = Depends(get_tag_service)
):
    """
    搜索标签（模糊搜索）

    示例：
    - /api/tags/search?q=花火
    - /api/tags/search?q=花
    """
    tags = tag_service.search_tags(query=q, limit=limit)
    return [tag.to_dict() for tag in tags]


@router.get("/{tag_id}", response_model=TagResponse, summary="获取单个标签")
def get_tag(
    tag_id: int,
    tag_service: TagService = Depends(get_tag_service)
):
    """获取指定ID的标签"""
    tag = tag_service.get_tag(tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail=f"标签 ID {tag_id} 不存在")
    return tag.to_dict()


@router.put("/{tag_id}", response_model=TagResponse, summary="更新标签")
def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    tag_service: TagService = Depends(get_tag_service)
):
    """更新标签信息"""
    tag = tag_service.update_tag(tag_id, tag_data)
    if not tag:
        raise HTTPException(status_code=404, detail=f"标签 ID {tag_id} 不存在")
    return tag.to_dict()


@router.delete("/{tag_id}", summary="删除标签")
def delete_tag(
    tag_id: int,
    tag_service: TagService = Depends(get_tag_service)
):
    """删除标签（会级联删除所有内容关联）"""
    success = tag_service.delete_tag(tag_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"标签 ID {tag_id} 不存在")
    return {"message": "标签删除成功"}


# ==================== 内容-标签关联 ====================

@router.get("/{tag_id}/contents", summary="获取标签关联的所有内容ID")
def get_tag_contents(
    tag_id: int,
    tag_service: TagService = Depends(get_tag_service)
):
    """
    获取标签关联的所有内容ID（按类型分组）

    返回格式：
    {
        "videos": [1, 2, 3],
        "articles": [4, 5],
        "galleries": [6],
        "schedules": [],
        "music": []
    }
    """
    tag = tag_service.get_tag(tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail=f"标签 ID {tag_id} 不存在")

    return tag_service.get_contents_by_tag(tag_id)


@router.post("/content", summary="为内容添加标签")
def add_tag_to_content(
    data: ContentTagCreate,
    tag_service: TagService = Depends(get_tag_service)
):
    """为指定内容添加标签"""
    content_tag = tag_service.add_tag_to_content(
        tag_id=data.tag_id,
        content_type=data.content_type,
        content_id=data.content_id
    )
    return content_tag.to_dict()


@router.delete("/content", summary="从内容中移除标签")
def remove_tag_from_content(
    tag_id: int = Query(..., description="标签ID"),
    content_type: ContentType = Query(..., description="内容类型"),
    content_id: int = Query(..., description="内容ID"),
    tag_service: TagService = Depends(get_tag_service)
):
    """从指定内容中移除标签"""
    success = tag_service.remove_tag_from_content(
        tag_id=tag_id,
        content_type=content_type,
        content_id=content_id
    )
    if not success:
        raise HTTPException(status_code=404, detail="标签关联不存在")
    return {"message": "标签移除成功"}


@router.get("/content/{content_type}/{content_id}", response_model=List[TagResponse], summary="获取内容的标签")
def get_content_tags(
    content_type: ContentType,
    content_id: int,
    tag_service: TagService = Depends(get_tag_service)
):
    """获取指定内容的所有标签"""
    tags = tag_service.get_content_tags(content_type, content_id)
    return [tag.to_dict() for tag in tags]


@router.put("/content/{content_type}/{content_id}", response_model=List[TagResponse], summary="设置内容的标签")
def set_content_tags(
    content_type: ContentType,
    content_id: int,
    tag_ids: List[int],
    tag_service: TagService = Depends(get_tag_service)
):
    """设置内容的标签（替换所有现有标签）"""
    tags = tag_service.set_content_tags(content_type, content_id, tag_ids)
    return [tag.to_dict() for tag in tags]


# ==================== 批量操作 ====================

@router.post("/batch", response_model=List[TagResponse], summary="批量创建标签")
def batch_create_tags(
    tag_names: List[str],
    tag_service: TagService = Depends(get_tag_service)
):
    """
    批量创建标签（用于预构建标签库）

    示例：
    ```json
    ["单曲《花火》", "专辑《花火》", "单曲《向阳花》"]
    ```
    """
    tags = tag_service.batch_create_tags(tag_names)
    return [tag.to_dict() for tag in tags]
