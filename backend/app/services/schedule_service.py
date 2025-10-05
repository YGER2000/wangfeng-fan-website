import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import UploadFile

ScheduleCategory = str


class ScheduleService:
    """处理行程数据的服务"""

    def __init__(self) -> None:
        self.backend_dir = Path(__file__).resolve().parents[2]
        self.project_root = self.backend_dir.parent
        self.custom_data_file = self.backend_dir / 'data' / 'schedule_entries.json'
        self.legacy_timeline_file = (
            self.project_root / 'frontend' / 'public' / 'data' / 'concerts_timeline.json'
        )
        self.upload_dir = self.project_root / 'frontend' / 'public' / 'uploads' / 'schedules'

        self.custom_data_file.parent.mkdir(parents=True, exist_ok=True)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

        if not self.custom_data_file.exists():
            self._save_custom_entries([])

    @staticmethod
    def _normalize_date_string(date_str: Optional[str]) -> Optional[str]:
        if not date_str:
            return None
        parts = date_str.split('-')
        if len(parts) == 3:
            year, month, day = parts
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        return date_str

    @staticmethod
    def _parse_date(date_str: Optional[str]) -> datetime:
        normalized = ScheduleService._normalize_date_string(date_str)
        if not normalized:
            return datetime.min
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            try:
                return datetime.strptime(normalized, '%Y-%m-%d')
            except ValueError:
                return datetime.min

    def _load_custom_entries(self) -> List[Dict[str, Any]]:
        try:
            with self.custom_data_file.open('r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def _save_custom_entries(self, entries: List[Dict[str, Any]]) -> None:
        with self.custom_data_file.open('w', encoding='utf-8') as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)

    def _load_legacy_entries(self) -> List[Dict[str, Any]]:
        if not self.legacy_timeline_file.exists():
            return []

        try:
            with self.legacy_timeline_file.open('r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError:
            return []

        concerts = data.get('concerts', [])
        legacy_entries: List[Dict[str, Any]] = []

        for concert in concerts:
            entry = {
                'id': concert.get('id'),
                'date': self._normalize_date_string(concert.get('date')),
                'city': concert.get('city'),
                'venue': concert.get('venue'),
                'theme': concert.get('theme'),
                'category': concert.get('category') or '演唱会',
                'description': concert.get('description'),
                'image': concert.get('image') or 'images/concerts/xiangxinweilai_poster.jpg',
                'source': 'legacy',
            }
            legacy_entries.append(entry)

        return legacy_entries

    def _generate_new_id(self, existing_entries: List[Dict[str, Any]]) -> int:
        existing_ids = [entry.get('id', 0) for entry in existing_entries if isinstance(entry.get('id'), int)]
        if not existing_ids:
            return 1
        return max(existing_ids) + 1

    def _save_image(self, upload: UploadFile, theme: str) -> str:
        """
        保存上传的海报图片
        Args:
            upload: 上传的文件
            theme: 行程主题，用于生成文件名
        Returns:
            相对路径字符串
        """
        extension = Path(upload.filename or '').suffix.lower() or '.jpg'
        # 清理主题文本，移除特殊字符，保留中文、英文、数字和空格
        safe_theme = ''.join(c for c in theme if c.isalnum() or c in (' ', '-', '_', '（', '）', '(', ')'))
        safe_theme = safe_theme.strip().replace(' ', '-')

        # 如果清理后的主题为空，使用时间戳
        if not safe_theme:
            safe_theme = datetime.utcnow().strftime('%Y%m%d%H%M%S')

        # 生成文件名：行程主题-海报.扩展名
        filename = f"{safe_theme}-海报{extension}"
        destination = self.upload_dir / filename

        # 如果文件已存在，添加时间戳后缀避免冲突
        if destination.exists():
            timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
            filename = f"{safe_theme}-海报-{timestamp}{extension}"
            destination = self.upload_dir / filename

        with destination.open('wb') as buffer:
            if hasattr(upload.file, 'seek'):
                upload.file.seek(0)
            content = upload.file.read()
            buffer.write(content)

        return f"uploads/schedules/{filename}"

    def get_all_entries(self) -> List[Dict[str, Any]]:
        legacy_entries = self._load_legacy_entries()
        custom_entries = self._load_custom_entries()
        combined = legacy_entries + custom_entries
        combined.sort(key=lambda item: self._parse_date(item.get('date')), reverse=True)
        return combined

    def create_entry(
        self,
        *,
        category: ScheduleCategory,
        date: str,
        city: str,
        venue: Optional[str] = None,
        theme: str,
        description: Optional[str] = None,
        image_file: Optional[UploadFile] = None,
    ) -> Dict[str, Any]:
        entries = self._load_custom_entries()
        legacy_entries = self._load_legacy_entries()
        all_entries = legacy_entries + entries
        new_id = self._generate_new_id(all_entries)

        image_path: Optional[str] = None
        if image_file is not None:
            image_path = self._save_image(image_file, theme)

        timestamp = datetime.utcnow().isoformat()

        new_entry = {
            'id': new_id,
            'category': category,
            'date': self._normalize_date_string(date),
            'city': city,
            'venue': venue,
            'theme': theme,
            'description': description,
            'image': image_path,
            'source': 'custom',
            'created_at': timestamp,
            'updated_at': timestamp,
        }

        entries.append(new_entry)
        entries.sort(key=lambda item: self._parse_date(item.get('date')), reverse=True)
        self._save_custom_entries(entries)

        return new_entry
