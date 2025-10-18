"""Tag Service"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from ..models.tag_db import Tag, ContentTag
from ..schemas.tag import TagCreate, TagUpdate, ContentType


class TagService:
    """标签服务"""

    def __init__(self, db: Session):
        self.db = db

    def create_tag(self, tag_data: TagCreate) -> Tag:
        """创建标签"""
        # 检查标签是否已存在
        existing = self.db.query(Tag).filter(Tag.name == tag_data.name).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"标签 '{tag_data.name}' 已存在")

        tag = Tag(
            name=tag_data.name,
            description=tag_data.description
        )
        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)
        return tag

    def get_tag(self, tag_id: int) -> Optional[Tag]:
        """获取单个标签"""
        return self.db.query(Tag).filter(Tag.id == tag_id).first()

    def get_tag_by_name(self, name: str) -> Optional[Tag]:
        """根据名称获取标签"""
        return self.db.query(Tag).filter(Tag.name == name).first()

    def list_tags(self, skip: int = 0, limit: int = 100) -> List[Tag]:
        """获取所有标签"""
        return self.db.query(Tag).order_by(Tag.name).offset(skip).limit(limit).all()

    def search_tags(self, query: str, limit: int = 20) -> List[Tag]:
        """搜索标签（模糊搜索）"""
        search_pattern = f"%{query}%"
        return (
            self.db.query(Tag)
            .filter(Tag.name.like(search_pattern))
            .order_by(Tag.name)
            .limit(limit)
            .all()
        )

    def update_tag(self, tag_id: int, tag_data: TagUpdate) -> Optional[Tag]:
        """更新标签"""
        tag = self.get_tag(tag_id)
        if not tag:
            return None

        if tag_data.name is not None:
            # 检查新名称是否与其他标签冲突
            existing = self.db.query(Tag).filter(
                Tag.name == tag_data.name,
                Tag.id != tag_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"标签 '{tag_data.name}' 已存在")
            tag.name = tag_data.name

        if tag_data.description is not None:
            tag.description = tag_data.description

        self.db.commit()
        self.db.refresh(tag)
        return tag

    def delete_tag(self, tag_id: int) -> bool:
        """删除标签（级联删除所有关联）"""
        tag = self.get_tag(tag_id)
        if not tag:
            return False

        self.db.delete(tag)
        self.db.commit()
        return True

    # ==================== 内容-标签关联 ====================

    def add_tag_to_content(
        self,
        tag_id: int,
        content_type: ContentType,
        content_id: int
    ) -> ContentTag:
        """为内容添加标签"""
        # 检查标签是否存在
        tag = self.get_tag(tag_id)
        if not tag:
            raise HTTPException(status_code=404, detail=f"标签 ID {tag_id} 不存在")

        # 检查是否已关联
        existing = self.db.query(ContentTag).filter(
            ContentTag.tag_id == tag_id,
            ContentTag.content_type == content_type,
            ContentTag.content_id == content_id
        ).first()

        if existing:
            return existing  # 已存在则返回现有记录

        # 创建新关联
        content_tag = ContentTag(
            tag_id=tag_id,
            content_type=content_type,
            content_id=content_id
        )
        self.db.add(content_tag)
        self.db.commit()
        self.db.refresh(content_tag)
        return content_tag

    def remove_tag_from_content(
        self,
        tag_id: int,
        content_type: ContentType,
        content_id: int
    ) -> bool:
        """从内容中移除标签"""
        content_tag = self.db.query(ContentTag).filter(
            ContentTag.tag_id == tag_id,
            ContentTag.content_type == content_type,
            ContentTag.content_id == content_id
        ).first()

        if not content_tag:
            return False

        self.db.delete(content_tag)
        self.db.commit()
        return True

    def get_content_tags(
        self,
        content_type: ContentType,
        content_id: int
    ) -> List[Tag]:
        """获取内容的所有标签"""
        content_tags = self.db.query(ContentTag).filter(
            ContentTag.content_type == content_type,
            ContentTag.content_id == content_id
        ).all()

        tag_ids = [ct.tag_id for ct in content_tags]
        if not tag_ids:
            return []

        return self.db.query(Tag).filter(Tag.id.in_(tag_ids)).order_by(Tag.name).all()

    def set_content_tags(
        self,
        content_type: ContentType,
        content_id: int,
        tag_ids: List[int]
    ) -> List[Tag]:
        """设置内容的标签（替换所有标签）"""
        # 删除现有标签
        self.db.query(ContentTag).filter(
            ContentTag.content_type == content_type,
            ContentTag.content_id == content_id
        ).delete()

        # 添加新标签
        for tag_id in tag_ids:
            # 验证标签存在
            tag = self.get_tag(tag_id)
            if not tag:
                raise HTTPException(status_code=404, detail=f"标签 ID {tag_id} 不存在")

            content_tag = ContentTag(
                tag_id=tag_id,
                content_type=content_type,
                content_id=content_id
            )
            self.db.add(content_tag)

        self.db.commit()
        return self.get_content_tags(content_type, content_id)

    def get_contents_by_tag(
        self,
        tag_id: int
    ) -> Dict[str, List[int]]:
        """获取标签关联的所有内容ID（按类型分组）"""
        content_tags = self.db.query(ContentTag).filter(
            ContentTag.tag_id == tag_id
        ).all()

        result: Dict[str, List[int]] = {
            'videos': [],
            'articles': [],
            'galleries': [],
            'schedules': [],
            'music': []
        }

        for ct in content_tags:
            content_type = ct.content_type
            if content_type == 'video':
                result['videos'].append(ct.content_id)
            elif content_type == 'article':
                result['articles'].append(ct.content_id)
            elif content_type == 'gallery':
                result['galleries'].append(ct.content_id)
            elif content_type == 'schedule':
                result['schedules'].append(ct.content_id)
            elif content_type == 'music':
                result['music'].append(ct.content_id)

        return result

    def batch_create_tags(self, tag_names: List[str]) -> List[Tag]:
        """批量创建标签（用于预构建）"""
        created_tags = []
        for name in tag_names:
            # 检查是否已存在
            existing = self.get_tag_by_name(name)
            if existing:
                created_tags.append(existing)
            else:
                tag = Tag(name=name)
                self.db.add(tag)
                created_tags.append(tag)

        self.db.commit()
        for tag in created_tags:
            self.db.refresh(tag)

        return created_tags
