# -*- coding: utf-8 -*-
"""图片画廊 CRUD 操作"""
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime

from ..models.gallery_db import PhotoGroup, Photo
from ..schemas.gallery import (
    PhotoGroupCreate,
    PhotoGroupUpdate,
    PhotoCreate,
    PhotoUpdate
)


# ========== PhotoGroup CRUD ==========

def create_photo_group(db: Session, photo_group: PhotoGroupCreate) -> PhotoGroup:
    """创建照片组"""
    db_photo_group = PhotoGroup(
        id=str(uuid.uuid4()),
        **photo_group.model_dump()
    )
    db.add(db_photo_group)
    db.commit()
    db.refresh(db_photo_group)
    return db_photo_group


def get_photo_group(db: Session, photo_group_id: str) -> Optional[PhotoGroup]:
    """获取单个照片组"""
    return db.query(PhotoGroup).filter(
        PhotoGroup.id == photo_group_id,
        PhotoGroup.is_deleted == False
    ).first()


def get_photo_groups(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    published_only: bool = True
) -> List[PhotoGroup]:
    """获取照片组列表（只返回云端存储，过滤掉 legacy）"""
    query = db.query(PhotoGroup).filter(
        PhotoGroup.is_deleted == False,
        PhotoGroup.storage_type != 'legacy'  # 只返回云端存储的照片组
    )

    if published_only:
        query = query.filter(
            PhotoGroup.is_published == True,
            PhotoGroup.review_status == 'approved'
        )

    if category:
        query = query.filter(PhotoGroup.category == category)

    return query.order_by(PhotoGroup.date.desc()).offset(skip).limit(limit).all()


def update_photo_group(
    db: Session,
    photo_group_id: str,
    photo_group_update: PhotoGroupUpdate
) -> Optional[PhotoGroup]:
    """更新照片组"""
    db_photo_group = get_photo_group(db, photo_group_id)
    if not db_photo_group:
        return None

    update_data = photo_group_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_photo_group, field, value)

    db_photo_group.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_photo_group)
    return db_photo_group


def delete_photo_group(db: Session, photo_group_id: str) -> bool:
    """删除照片组（软删除）"""
    db_photo_group = get_photo_group(db, photo_group_id)
    if not db_photo_group:
        return False

    db_photo_group.is_deleted = True
    db_photo_group.updated_at = datetime.utcnow()
    db.commit()
    return True


def get_photo_group_count(
    db: Session,
    category: Optional[str] = None,
    published_only: bool = True
) -> int:
    """获取照片组总数（只计算云端存储，过滤掉 legacy）"""
    query = db.query(PhotoGroup).filter(
        PhotoGroup.is_deleted == False,
        PhotoGroup.storage_type != 'legacy'  # 只计算云端存储的照片组
    )

    if published_only:
        query = query.filter(PhotoGroup.is_published == True)

    if category:
        query = query.filter(PhotoGroup.category == category)

    return query.count()


# ========== Photo CRUD ==========

def create_photo(db: Session, photo: PhotoCreate) -> Photo:
    """创建照片"""
    db_photo = Photo(
        id=str(uuid.uuid4()),
        **photo.model_dump()
    )
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    return db_photo


def get_photo(db: Session, photo_id: str) -> Optional[Photo]:
    """获取单张照片"""
    return db.query(Photo).filter(
        Photo.id == photo_id,
        Photo.is_deleted == False
    ).first()


def get_photos_by_group(
    db: Session,
    photo_group_id: str,
    skip: int = 0,
    limit: int = 100
) -> List[Photo]:
    """获取照片组的所有照片"""
    return db.query(Photo).filter(
        Photo.photo_group_id == photo_group_id,
        Photo.is_deleted == False
    ).order_by(Photo.sort_order.asc(), Photo.created_at.asc()).offset(skip).limit(limit).all()


def update_photo(
    db: Session,
    photo_id: str,
    photo_update: PhotoUpdate
) -> Optional[Photo]:
    """更新照片"""
    db_photo = get_photo(db, photo_id)
    if not db_photo:
        return None

    update_data = photo_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_photo, field, value)

    db_photo.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_photo)
    return db_photo


def delete_photo(db: Session, photo_id: str) -> bool:
    """删除照片（软删除）"""
    db_photo = get_photo(db, photo_id)
    if not db_photo:
        return False

    db_photo.is_deleted = True
    db_photo.updated_at = datetime.utcnow()
    db.commit()
    return True


def batch_create_photos(db: Session, photos: List[PhotoCreate]) -> List[Photo]:
    """批量创建照片"""
    db_photos = []
    for photo in photos:
        db_photo = Photo(
            id=str(uuid.uuid4()),
            **photo.model_dump()
        )
        db_photos.append(db_photo)

    db.add_all(db_photos)
    db.commit()

    for db_photo in db_photos:
        db.refresh(db_photo)

    return db_photos


def get_photo_groups_by_author(
    db: Session,
    author_id: str,
    skip: int = 0,
    limit: int = 500,
    category: Optional[str] = None
) -> List[PhotoGroup]:
    """获取指定作者的所有照片组（包含所有状态）"""
    query = db.query(PhotoGroup).filter(
        PhotoGroup.is_deleted == False,
        PhotoGroup.author_id == author_id
    )

    if category:
        query = query.filter(PhotoGroup.category == category)

    return query.order_by(PhotoGroup.updated_at.desc()).offset(skip).limit(limit).all()


def get_all_photo_groups_admin(
    db: Session,
    skip: int = 0,
    limit: int = 500,
    category: Optional[str] = None,
    review_status: Optional[str] = None
) -> List[PhotoGroup]:
    """获取所有照片组（管理员用,包含所有状态）"""
    query = db.query(PhotoGroup).filter(PhotoGroup.is_deleted == False)

    if category:
        query = query.filter(PhotoGroup.category == category)

    if review_status:
        query = query.filter(PhotoGroup.review_status == review_status)

    return query.order_by(PhotoGroup.updated_at.desc()).offset(skip).limit(limit).all()
