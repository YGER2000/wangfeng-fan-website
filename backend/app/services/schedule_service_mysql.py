"""Schedule Service with MySQL Storage"""
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import UploadFile
from sqlalchemy.orm import Session

from ..models.schedule_db import Schedule


class ScheduleServiceMySQL:
    """处理行程数据的服务（MySQL版本）"""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.backend_dir = Path(__file__).resolve().parents[2]
        self.project_root = self.backend_dir.parent
        # 基础上传目录：frontend/public/images/
        self.base_upload_dir = self.project_root / 'frontend' / 'public' / 'images'

        # 确保基础目录存在
        self.base_upload_dir.mkdir(parents=True, exist_ok=True)

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
        清理文件夹名称，移除不安全的字符
        保留中文、英文、数字、空格和常用符号
        """
        # 移除路径分隔符和其他不安全字符
        unsafe_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|', '\n', '\r', '\t']
        safe_name = name
        for char in unsafe_chars:
            safe_name = safe_name.replace(char, '')

        # 移除首尾空格
        safe_name = safe_name.strip()

        # 如果清理后为空，使用时间戳
        if not safe_name:
            safe_name = datetime.utcnow().strftime('%Y%m%d%H%M%S')

        return safe_name

    def _get_folder_name(self, date: str, theme: str) -> str:
        """
        生成文件夹名称：日期-主题
        例如：2023.04.30-UNFOLLOW长沙站

        Args:
            date: 日期 YYYY-MM-DD
            theme: 行程主题
        Returns:
            文件夹名称
        """
        # 将日期从 YYYY-MM-DD 转换为 YYYY.MM.DD
        formatted_date = date.replace('-', '.')
        # 清理主题名称
        safe_theme = self._sanitize_folder_name(theme)
        # 返回格式：日期-主题
        return f"{formatted_date}-{safe_theme}"

    def _ensure_schedule_folder(self, category: str, date: str, theme: str) -> Path:
        """
        确保行程文件夹存在
        文件夹路径：images/分类/日期-主题/

        Args:
            category: 行程分类
            date: 日期
            theme: 行程主题
        Returns:
            文件夹的完整路径
        """
        safe_category = self._sanitize_folder_name(category)
        folder_name = self._get_folder_name(date, theme)

        # 创建目录结构：images/分类/日期-主题/
        category_dir = self.base_upload_dir / safe_category
        schedule_dir = category_dir / folder_name

        # 确保目录存在
        schedule_dir.mkdir(parents=True, exist_ok=True)

        return schedule_dir

    def _save_image(self, upload: UploadFile, category: str, date: str, theme: str) -> str:
        """
        保存上传的海报图片
        存储路径：images/分类/日期-主题/日期-主题-海报.扩展名

        Args:
            upload: 上传的文件
            category: 行程分类（中文）
            date: 日期 YYYY-MM-DD
            theme: 行程主题（中文）
        Returns:
            相对于 public 目录的路径字符串
        """
        extension = Path(upload.filename or '').suffix.lower() or '.jpg'

        # 确保文件夹存在
        schedule_dir = self._ensure_schedule_folder(category, date, theme)

        # 获取文件夹名称（日期-主题）
        folder_name = self._get_folder_name(date, theme)

        # 生成文件名：日期-主题-海报.扩展名
        filename = f"{folder_name}-海报{extension}"
        destination = schedule_dir / filename

        # 如果文件已存在，添加时间戳后缀避免冲突
        if destination.exists():
            timestamp = datetime.utcnow().strftime('%H%M%S')
            filename = f"{folder_name}-海报-{timestamp}{extension}"
            destination = schedule_dir / filename

        # 保存文件
        with destination.open('wb') as buffer:
            if hasattr(upload.file, 'seek'):
                upload.file.seek(0)
            content = upload.file.read()
            buffer.write(content)

        # 返回相对于 public 目录的路径
        safe_category = self._sanitize_folder_name(category)
        return f"images/{safe_category}/{folder_name}/{filename}"

    def _get_default_poster_path(self, category: str, date: str, theme: str) -> str:
        """
        获取默认海报路径
        如果没有上传图片，返回默认海报的路径

        Args:
            category: 行程分类
            date: 日期
            theme: 行程主题
        Returns:
            默认海报的相对路径
        """
        # 确保文件夹存在
        self._ensure_schedule_folder(category, date, theme)
        # 返回默认海报路径
        return "images/默认海报.jpg"

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
        image_file: Optional[UploadFile] = None,
    ) -> Dict[str, Any]:
        """创建新的行程记录"""
        # 标准化日期
        normalized_date = self._normalize_date_string(date)

        # 无论是否有图片，都创建文件夹
        # 如果有图片则保存，没有图片则使用默认海报
        image_path: Optional[str] = None
        if image_file is not None:
            image_path = self._save_image(image_file, category, normalized_date, theme)
        else:
            # 没有上传图片时，创建文件夹并使用默认海报
            image_path = self._get_default_poster_path(category, normalized_date, theme)

        # 创建数据库记录
        new_schedule = Schedule(
            category=category,
            date=normalized_date,
            city=city,
            venue=venue,
            theme=theme,
            description=description,
            image=image_path,
            source='custom',
        )

        self.db.add(new_schedule)
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

        # 更新字段
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

        # 如果有新图片，保存并更新路径
        if image_file is not None:
            current_category = category if category else schedule.category
            current_date = date if date else schedule.date
            current_theme = theme if theme else schedule.theme
            image_path = self._save_image(image_file, current_category, current_date, current_theme)
            schedule.image = image_path

        schedule.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(schedule)

        return schedule.to_dict()

    def delete_entry(self, schedule_id: int) -> bool:
        """删除行程记录"""
        schedule = self.db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            return False

        self.db.delete(schedule)
        self.db.commit()
        return True
