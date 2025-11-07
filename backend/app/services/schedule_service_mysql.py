"""Schedule Service with MySQL Storage (OSS-based)"""
import io
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import tempfile
import json

from fastapi import UploadFile
from PIL import Image
from sqlalchemy import or_
from sqlalchemy.orm import Session

try:
    from pillow_heif import register_heif_opener

    register_heif_opener()
except ImportError:
    register_heif_opener = None

from ..core.config import get_settings
from ..models.schedule_db import Schedule
from ..services.storage import get_storage
from ..utils.datetime_utils import get_beijing_now
from ..utils.image_utils import compress_image


class ScheduleServiceMySQL:
    """处理行程数据的服务（MySQL版本，使用 OSS 存储海报）"""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.storage = get_storage()
        settings = get_settings()
        self.default_poster_url = getattr(settings, "schedule_default_poster_url", None)
        self._auto_publish_existing_entries()

    def _auto_publish_existing_entries(self) -> None:
        """确保所有现有行程都标记为已审核且已发布"""
        outdated = self.db.query(Schedule).filter(
            or_(Schedule.review_status != 'approved', Schedule.is_published != 1)
        ).all()

        if not outdated:
            return

        now = get_beijing_now()
        updated = False

        for schedule in outdated:
            if schedule.review_status != 'approved':
                schedule.review_status = 'approved'
                schedule.reviewed_at = schedule.reviewed_at or now
                updated = True
            if schedule.is_published != 1:
                schedule.is_published = 1
                updated = True

        if updated:
            self.db.commit()

    @staticmethod
    def _normalize_date_string(date_str: Optional[str]) -> Optional[str]:
        """标准化日期字符串为 YYYY-MM-DD 格式"""
        if not date_str:
            return None
        parts = date_str.split('-')
        if len(parts) == 3:
            year, month, day = parts
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        return date_str

    @staticmethod
    def _parse_date(date_str: Optional[str]) -> datetime:
        """解析日期字符串为 datetime 对象"""
        normalized = ScheduleServiceMySQL._normalize_date_string(date_str)
        if not normalized:
            return datetime.min
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            try:
                return datetime.strptime(normalized, '%Y-%m-%d')
            except ValueError:
                return datetime.min

    @staticmethod
    def _sanitize_folder_name(name: str) -> str:
        """
        清理名称，移除不安全的字符
        保留中文、英文、数字、空格和常用符号
        """
        unsafe_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|', '\n', '\r', '\t']
        safe_name = name
        for char in unsafe_chars:
            safe_name = safe_name.replace(char, '')

        safe_name = safe_name.strip()

        if not safe_name:
            safe_name = get_beijing_now().strftime('%Y%m%d%H%M%S')

        return safe_name

    def _sanitize_for_object(self, value: str) -> str:
        """将路径组件转换为适合 OSS 的形式"""
        sanitized = self._sanitize_folder_name(value)
        return sanitized.replace(' ', '_')

    def _build_object_prefix(self, category: str, date: str, theme: str, schedule_id: int) -> str:
        """
        生成 OSS 对象名前缀，结构：
        schedules/{分类}/{日期-主题}/schedule-{id}
        """
        safe_category = self._sanitize_for_object(category)
        safe_date = date or get_beijing_now().strftime('%Y-%m-%d')
        folder_name = self._sanitize_for_object(f"{safe_date}-{theme}")
        return f"schedules/{safe_category}/{folder_name}/schedule-{schedule_id}"

    def _upload_schedule_images(
        self,
        upload: UploadFile,
        category: str,
        date: str,
        theme: str,
        schedule_id: int,
        index: int = 0
    ) -> Tuple[str, Optional[str]]:
        """上传行程海报到 OSS，返回(原图URL, 缩略图URL)

        Args:
            index: 海报索引（用于多张海报时区分不同文件）
        """
        try:
            file_bytes = upload.file.read()
        finally:
            if hasattr(upload.file, 'seek'):
                upload.file.seek(0)

        if not file_bytes:
            # 没有有效内容时返回默认海报
            return self.default_poster_url or "", self.default_poster_url

        extension = Path(upload.filename or '').suffix.lower() or '.jpg'
        heif_extensions = {'.heic', '.heif'}
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'}
        allowed_extensions |= heif_extensions
        if extension not in allowed_extensions:
            extension = '.jpg'

        if extension in heif_extensions and register_heif_opener is not None:
            try:
                image = Image.open(io.BytesIO(file_bytes))
                buffer = io.BytesIO()
                image.convert('RGB').save(buffer, format='JPEG', quality=95)
                file_bytes = buffer.getvalue()
                extension = '.jpg'
            except Exception as exc:
                print(f"⚠️ HEIC 转换失败: {exc}，将按原格式上传")

        mime_type = upload.content_type or 'image/jpeg'
        if extension in ('.jpg', '.jpeg'):
            mime_type = 'image/jpeg'
        elif extension == '.png':
            mime_type = 'image/png'
        elif extension == '.webp':
            mime_type = 'image/webp'
        elif extension == '.gif':
            mime_type = 'image/gif'
        elif extension == '.bmp':
            mime_type = 'image/bmp'
        elif extension in heif_extensions:
            mime_type = 'image/heic'

        object_prefix = self._build_object_prefix(category, date, theme, schedule_id)
        # 对于多张海报，在文件名中加上索引号 (poster-0, poster-1, poster-2, ...)
        original_object_name = f"{object_prefix}-poster-{index}{extension}"
        thumb_object_name = f"{object_prefix}-poster-{index}-thumb.jpg"

        thumb_bytes: bytes
        with tempfile.TemporaryDirectory() as tmp_dir:
            original_path = Path(tmp_dir) / f"original{extension}"
            original_path.write_bytes(file_bytes)

            thumb_path = Path(tmp_dir) / "thumb.jpg"
            if compress_image(original_path, thumb_path, max_size_kb=200):
                thumb_bytes = thumb_path.read_bytes()
            else:
                thumb_bytes = file_bytes

        original_url = self.storage.upload_bytes(file_bytes, original_object_name, content_type=mime_type)
        thumb_url = self.storage.upload_bytes(thumb_bytes, thumb_object_name, content_type="image/jpeg")

        return original_url, thumb_url

    def get_all_entries(self) -> List[Dict[str, Any]]:
        """获取所有行程记录"""
        schedules = self.db.query(Schedule).order_by(Schedule.date.desc()).all()
        return [schedule.to_dict() for schedule in schedules]

    def create_entry(
        self,
        *,
        category: str,
        date: str,
        city: str,
        venue: Optional[str] = None,
        theme: str,
        description: Optional[str] = None,
        tags: Optional[str] = None,
        image_file: Optional[UploadFile] = None,
        images_files: Optional[List[UploadFile]] = None,
        cover_index: Optional[int] = None,
        save_file: bool = False,  # 参数保留兼容性，现已统一上传到 OSS
    ) -> Dict[str, Any]:
        """
        创建新的行程记录，支持多张海报

        Args:
            image_file: 单张海报（向后兼容）
            images_files: 多张海报列表
            cover_index: 封面海报的索引（0表示第一张）
            save_file: 兼容旧参数，当前无实际作用（图片立即上传 OSS）
        """
        normalized_date = self._normalize_date_string(date) or get_beijing_now().strftime('%Y-%m-%d')

        now = get_beijing_now()
        new_schedule = Schedule(
            category=category,
            date=normalized_date,
            city=city,
            venue=venue,
            theme=theme,
            description=description,
            tags=tags,
            image=None,
            image_thumb=None,
            images=None,
            images_thumb=None,
            source='custom',
            review_status='approved',
            reviewed_at=now,
            is_published=1,
            created_at=now,
            updated_at=now,
        )

        self.db.add(new_schedule)
        self.db.flush()

        # 处理多张海报
        if images_files and len(images_files) > 0:
            images_urls = []
            images_thumb_urls = []

            for idx, image_file in enumerate(images_files):
                image_url, image_thumb_url = self._upload_schedule_images(
                    image_file,
                    category,
                    normalized_date,
                    theme,
                    new_schedule.id,
                    index=idx
                )
                images_urls.append(image_url)
                images_thumb_urls.append(image_thumb_url or image_url)

            # 存储为 JSON 数组
            new_schedule.images = json.dumps(images_urls)
            new_schedule.images_thumb = json.dumps(images_thumb_urls)

            # 设置封面海报（默认第一张，或指定 cover_index）
            cover_idx = cover_index or 0
            if 0 <= cover_idx < len(images_urls):
                new_schedule.image = images_urls[cover_idx]
                new_schedule.image_thumb = images_thumb_urls[cover_idx]
            else:
                new_schedule.image = images_urls[0]
                new_schedule.image_thumb = images_thumb_urls[0]

        # 处理单张海报（向后兼容）
        elif image_file is not None:
            image_url, image_thumb_url = self._upload_schedule_images(
                image_file,
                category,
                normalized_date,
                theme,
                new_schedule.id
            )
            new_schedule.image = image_url
            new_schedule.image_thumb = image_thumb_url or image_url
        elif self.default_poster_url:
            new_schedule.image = self.default_poster_url
            new_schedule.image_thumb = self.default_poster_url

        new_schedule.review_status = 'approved'
        new_schedule.reviewed_at = now
        new_schedule.is_published = 1
        self.db.commit()
        self.db.refresh(new_schedule)

        return new_schedule.to_dict()

    def get_entry_by_id(self, schedule_id: int) -> Optional[Dict[str, Any]]:
        """根据ID获取行程记录"""
        schedule = self.db.query(Schedule).filter(Schedule.id == schedule_id).first()
        return schedule.to_dict() if schedule else None

    def update_entry(
        self,
        schedule_id: int,
        *,
        category: Optional[str] = None,
        date: Optional[str] = None,
        city: Optional[str] = None,
        venue: Optional[str] = None,
        theme: Optional[str] = None,
        description: Optional[str] = None,
        image_file: Optional[UploadFile] = None,
    ) -> Optional[Dict[str, Any]]:
        """更新行程记录"""
        schedule = self.db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            return None

        if category is not None:
            schedule.category = category
        if date is not None:
            schedule.date = self._normalize_date_string(date)
        if city is not None:
            schedule.city = city
        if venue is not None:
            schedule.venue = venue
        if theme is not None:
            schedule.theme = theme
        if description is not None:
            schedule.description = description

        if image_file is not None:
            # 删除旧图（忽略失败）
            for url in {schedule.image, schedule.image_thumb}:
                if url:
                    try:
                        self.storage.delete_image(url)
                    except Exception:
                        pass

            current_category = category if category is not None else schedule.category
            current_date = schedule.date or get_beijing_now().strftime('%Y-%m-%d')
            current_theme = theme if theme is not None else schedule.theme
            image_url, image_thumb_url = self._upload_schedule_images(
                image_file,
                current_category,
                current_date,
                current_theme,
                schedule.id
            )
            schedule.image = image_url
            schedule.image_thumb = image_thumb_url or image_url

        schedule.updated_at = get_beijing_now()
        schedule.review_status = 'approved'
        schedule.is_published = 1
        if not schedule.reviewed_at:
            schedule.reviewed_at = get_beijing_now()
        self.db.commit()
        self.db.refresh(schedule)

        return schedule.to_dict()

    def publish_schedule(self, schedule_id: int, image_file: Optional[UploadFile] = None) -> Optional[Dict[str, Any]]:
        """
        发布行程（审核通过后）
        由于图片已存储在 OSS，此处仅确保存在可用海报
        """
        schedule = self.db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            return None

        if image_file is not None:
            image_url, image_thumb_url = self._upload_schedule_images(
                image_file,
                schedule.category,
                schedule.date or get_beijing_now().strftime('%Y-%m-%d'),
                schedule.theme,
                schedule.id
            )
            schedule.image = image_url
            schedule.image_thumb = image_thumb_url or image_url
        elif not schedule.image and self.default_poster_url:
            schedule.image = self.default_poster_url
            schedule.image_thumb = self.default_poster_url

        schedule.updated_at = get_beijing_now()
        self.db.commit()
        self.db.refresh(schedule)

        return schedule.to_dict()

    def delete_entry(self, schedule_id: int) -> bool:
        """删除行程记录"""
        schedule = self.db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            return False

        for url in {schedule.image, schedule.image_thumb}:
            if url:
                try:
                    self.storage.delete_image(url)
                except Exception:
                    pass

        self.db.delete(schedule)
        self.db.commit()
        return True
