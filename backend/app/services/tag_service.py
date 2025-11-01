"""Tag Service"""
from typing import List, Optional, Dict, Tuple, Union

from fastapi import HTTPException
from sqlalchemy import or_, func
from sqlalchemy.orm import Session, joinedload

from ..models.tag_db import Tag, ContentTag, TagCategory
from ..schemas.tag import (
    TagCreate,
    TagUpdate,
    ContentType,
    TagCategoryCreate,
    TagCategoryUpdate,
)

DEFAULT_CATEGORY_NAME = "其他"


class TagService:
    """标签服务"""

    def __init__(self, db: Session):
        self.db = db

    # ==================== 标签种类 ====================

    def list_categories(self) -> List[TagCategory]:
        """获取所有标签种类"""
        return self.db.query(TagCategory).order_by(TagCategory.name).all()

    def get_category(self, category_id: int) -> Optional[TagCategory]:
        """获取标签种类"""
        return self.db.query(TagCategory).filter(TagCategory.id == category_id).first()

    def create_category(self, category_data: TagCategoryCreate) -> TagCategory:
        """创建标签种类"""
        name = category_data.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="标签种类名称不能为空")

        existing = (
            self.db.query(TagCategory)
            .filter(func.lower(TagCategory.name) == func.lower(name))
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail=f"标签种类 '{name}' 已存在")

        category = TagCategory(
            name=name,
            description=category_data.description,
        )
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def update_category(self, category_id: int, category_data: TagCategoryUpdate) -> Optional[TagCategory]:
        """更新标签种类"""
        category = self.get_category(category_id)
        if not category:
            return None

        name_changed = False

        if category_data.name is not None:
            name = category_data.name.strip()
            if not name:
                raise HTTPException(status_code=400, detail="标签种类名称不能为空")

            existing = (
                self.db.query(TagCategory)
                .filter(func.lower(TagCategory.name) == func.lower(name), TagCategory.id != category_id)
                .first()
            )
            if existing:
                raise HTTPException(status_code=400, detail=f"标签种类 '{name}' 已存在")

            category.name = name
            name_changed = True

        if category_data.description is not None:
            category.description = category_data.description

        if name_changed:
            self._sync_tags_display_names(category.id, category.name)

        self.db.commit()
        self.db.refresh(category)
        return category

    def delete_category(self, category_id: int) -> bool:
        """删除标签种类（若无标签关联）"""
        category = self.get_category(category_id)
        if not category:
            return False

        tag_count = self.db.query(Tag).filter(Tag.category_id == category_id).count()
        if tag_count > 0:
            raise HTTPException(status_code=400, detail="该标签种类下仍有关联的标签，请先处理这些标签")

        self.db.delete(category)
        self.db.commit()
        return True

    # ==================== 标签 ====================

    def create_tag(self, tag_data: TagCreate) -> Tag:
        """创建标签"""
        category = self._resolve_category(tag_data.category_id, tag_data.category_name)
        value = self._normalize_value(tag_data.value)

        existing = (
            self.db.query(Tag)
            .filter(
                Tag.category_id == category.id,
                func.lower(Tag.value) == func.lower(value),
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"标签 '{category.name}：{value}' 已存在",
            )

        tag = Tag(
            category_id=category.id,
            value=value,
            description=tag_data.description,
        )
        tag.category = category
        tag.sync_display_name(category.name)

        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)
        return tag

    def get_tag(self, tag_id: int) -> Optional[Tag]:
        """获取单个标签"""
        return (
            self.db.query(Tag)
            .options(joinedload(Tag.category))
            .filter(Tag.id == tag_id)
            .first()
        )

    def get_tag_by_name(self, name: str) -> Optional[Tag]:
        """根据显示名称获取标签"""
        return (
            self.db.query(Tag)
            .options(joinedload(Tag.category))
            .filter(Tag.name == name)
            .first()
        )

    def list_tags(self, skip: int = 0, limit: int = 100) -> List[Tag]:
        """获取所有标签"""
        return (
            self.db.query(Tag)
            .options(joinedload(Tag.category))
            .order_by(Tag.name)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def search_tags(self, query: str, limit: int = 20) -> List[Tag]:
        """搜索标签（模糊搜索）"""
        search = query.strip()
        if not search:
            return []

        search_pattern = f"%{search}%"
        return (
            self.db.query(Tag)
            .options(joinedload(Tag.category))
            .join(TagCategory, Tag.category_id == TagCategory.id)
            .filter(
                or_(
                    Tag.name.like(search_pattern),
                    Tag.value.like(search_pattern),
                    TagCategory.name.like(search_pattern),
                )
            )
            .order_by(Tag.name)
            .limit(limit)
            .all()
        )

    def update_tag(self, tag_id: int, tag_data: TagUpdate) -> Optional[Tag]:
        """更新标签"""
        tag = self.get_tag(tag_id)
        if not tag:
            return None

        category = tag.category if tag.category else self._require_category(tag.category_id)

        if tag_data.category_id is not None or tag_data.category_name is not None:
            category = self._resolve_category(tag_data.category_id, tag_data.category_name)
            tag.category_id = category.id
            tag.category = category

        if tag_data.value is not None:
            value = self._normalize_value(tag_data.value)
        else:
            value = tag.value

        # 检查新组合是否已存在
        existing = (
            self.db.query(Tag)
            .filter(
                Tag.category_id == category.id,
                func.lower(Tag.value) == func.lower(value),
                Tag.id != tag_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"标签 '{category.name}：{value}' 已存在",
            )

        tag.value = value

        if tag_data.description is not None:
            tag.description = tag_data.description

        tag.sync_display_name(category.name)

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
        content_id: int,
    ) -> ContentTag:
        """为内容添加标签"""
        tag = self.get_tag(tag_id)
        if not tag:
            raise HTTPException(status_code=404, detail=f"标签 ID {tag_id} 不存在")

        existing = self.db.query(ContentTag).filter(
            ContentTag.tag_id == tag_id,
            ContentTag.content_type == content_type,
            ContentTag.content_id == content_id,
        ).first()

        if existing:
            return existing

        content_tag = ContentTag(
            tag_id=tag_id,
            content_type=content_type,
            content_id=content_id,
        )
        self.db.add(content_tag)
        self.db.commit()
        self.db.refresh(content_tag)
        return content_tag

    def remove_tag_from_content(
        self,
        tag_id: int,
        content_type: ContentType,
        content_id: int,
    ) -> bool:
        """从内容中移除标签"""
        content_tag = self.db.query(ContentTag).filter(
            ContentTag.tag_id == tag_id,
            ContentTag.content_type == content_type,
            ContentTag.content_id == content_id,
        ).first()

        if not content_tag:
            return False

        self.db.delete(content_tag)
        self.db.commit()
        return True

    def get_content_tags(
        self,
        content_type: ContentType,
        content_id: Union[int, str],
    ) -> List[Tag]:
        """获取内容的所有标签"""
        content_tags = self.db.query(ContentTag).filter(
            ContentTag.content_type == content_type,
            ContentTag.content_id == str(content_id),
        ).all()

        tag_ids = [ct.tag_id for ct in content_tags]
        if not tag_ids:
            return []

        return (
            self.db.query(Tag)
            .options(joinedload(Tag.category))
            .filter(Tag.id.in_(tag_ids))
            .order_by(Tag.name)
            .all()
        )

    def set_content_tags(
        self,
        content_type: ContentType,
        content_id: Union[int, str],
        tag_ids: List[int],
    ) -> List[Tag]:
        """设置内容的标签（替换所有标签）"""
        self.db.query(ContentTag).filter(
            ContentTag.content_type == content_type,
            ContentTag.content_id == str(content_id),
        ).delete()

        for tag_id in tag_ids:
            tag = self.get_tag(tag_id)
            if not tag:
                raise HTTPException(status_code=404, detail=f"标签 ID {tag_id} 不存在")

            content_tag = ContentTag(
                tag_id=tag_id,
                content_type=content_type,
                content_id=str(content_id),
            )
            self.db.add(content_tag)

        self.db.commit()
        return self.get_content_tags(content_type, content_id)

    def get_contents_by_tag(
        self,
        tag_id: int,
    ) -> Dict[str, List[str]]:
        """获取标签关联的所有内容ID（按类型分组）"""
        content_tags = self.db.query(ContentTag).filter(
            ContentTag.tag_id == tag_id,
        ).all()

        result: Dict[str, List[str]] = {
            'videos': [],
            'articles': [],
            'galleries': [],
            'schedules': [],
            'music': [],
        }

        for ct in content_tags:
            if ct.content_type == 'video':
                result['videos'].append(ct.content_id)
            elif ct.content_type == 'article':
                result['articles'].append(ct.content_id)
            elif ct.content_type == 'gallery':
                result['galleries'].append(ct.content_id)
            elif ct.content_type == 'schedule':
                result['schedules'].append(ct.content_id)
            elif ct.content_type == 'music':
                result['music'].append(ct.content_id)

        return result

    def batch_create_tags(self, tag_entries: List[str]) -> List[Tag]:
        """批量创建标签（用于预构建）"""
        created_tags: List[Tag] = []

        for raw_entry in tag_entries:
            parsed = self._parse_batch_entry(raw_entry)
            if not parsed:
                continue

            category_name, value = parsed
            category = self._get_or_create_category_by_name(category_name)

            existing = (
                self.db.query(Tag)
                .filter(
                    Tag.category_id == category.id,
                    func.lower(Tag.value) == func.lower(value),
                )
                .first()
            )
            if existing:
                created_tags.append(existing)
                continue

            tag = Tag(
                category_id=category.id,
                value=value,
            )
            tag.category = category
            tag.sync_display_name(category.name)
            self.db.add(tag)
            self.db.flush()
            created_tags.append(tag)

        self.db.commit()

        for tag in created_tags:
            self.db.refresh(tag)

        return created_tags

    # ==================== 内部工具方法 ====================

    def _require_category(self, category_id: int) -> TagCategory:
        category = self.get_category(category_id)
        if not category:
            raise HTTPException(status_code=404, detail=f"标签种类 ID {category_id} 不存在")
        return category

    def _resolve_category(
        self,
        category_id: Optional[int],
        category_name: Optional[str],
    ) -> TagCategory:
        if category_id is not None:
            return self._require_category(category_id)

        if category_name is not None:
            cleaned = category_name.strip()
            if not cleaned:
                raise HTTPException(status_code=400, detail="标签种类名称不能为空")
            return self._get_or_create_category_by_name(cleaned)

        raise HTTPException(status_code=400, detail="必须提供标签种类信息")

    def _normalize_value(self, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise HTTPException(status_code=400, detail="标签值不能为空")
        return normalized

    def _sync_tags_display_names(self, category_id: int, category_name: str) -> None:
        """当种类名称变更时更新该种类下所有标签的显示名称"""
        tags = self.db.query(Tag).filter(Tag.category_id == category_id).all()
        for tag in tags:
            tag.sync_display_name(category_name)

    def _parse_batch_entry(self, raw_entry: str) -> Optional[Tuple[str, str]]:
        if not raw_entry:
            return None

        cleaned = raw_entry.strip()
        if not cleaned:
            return None

        for separator in ('：', ':'):
            if separator in cleaned:
                category_part, value_part = cleaned.split(separator, 1)
                category_name = category_part.strip()
                value = value_part.strip()
                if category_name and value:
                    return category_name, value

        return DEFAULT_CATEGORY_NAME, cleaned

    def _get_or_create_category_by_name(self, name: str) -> TagCategory:
        cleaned_name = name.strip()
        if not cleaned_name:
            raise HTTPException(status_code=400, detail="标签种类名称不能为空")

        category = (
            self.db.query(TagCategory)
            .filter(func.lower(TagCategory.name) == func.lower(cleaned_name))
            .first()
        )
        if category:
            return category

        category = TagCategory(name=cleaned_name)
        self.db.add(category)
        self.db.flush()
        return category
