# -*- coding: utf-8 -*-
"""存储服务 - 支持本地存储和阿里云OSS"""
from abc import ABC, abstractmethod
from typing import Tuple, Optional
import os
import uuid
from pathlib import Path
from datetime import datetime

from ..core.config import get_settings

settings = get_settings()


class StorageService(ABC):
    """存储服务抽象基类"""

    @abstractmethod
    def upload_file(self, file_path: str, destination_path: str) -> str:
        """
        上传文件
        :param file_path: 本地文件路径
        :param destination_path: 目标路径（相对路径）
        :return: 文件访问URL
        """
        pass

    @abstractmethod
    def delete_file(self, file_path: str) -> bool:
        """
        删除文件
        :param file_path: 文件路径
        :return: 是否成功
        """
        pass

    @abstractmethod
    def get_file_url(self, file_path: str) -> str:
        """
        获取文件访问URL
        :param file_path: 文件路径
        :return: 访问URL
        """
        pass


class LocalStorage(StorageService):
    """本地存储服务"""

    def __init__(self, base_path: str = None):
        self.base_path = base_path or settings.local_storage_path
        # 确保基础路径存在
        os.makedirs(self.base_path, exist_ok=True)

    def upload_file(self, file_path: str, destination_path: str) -> str:
        """
        上传文件到本地存储
        :param file_path: 源文件路径
        :param destination_path: 目标相对路径
        :return: 文件访问URL
        """
        # 构建完整的目标路径
        full_destination = os.path.join(self.base_path, destination_path)

        # 确保目标目录存在
        os.makedirs(os.path.dirname(full_destination), exist_ok=True)

        # 如果源文件和目标文件不同，则复制
        if os.path.abspath(file_path) != os.path.abspath(full_destination):
            import shutil
            shutil.copy2(file_path, full_destination)

        # 返回相对URL路径
        return f"/uploads/{destination_path}"

    def delete_file(self, file_path: str) -> bool:
        """删除本地文件"""
        try:
            full_path = os.path.join(self.base_path, file_path.replace('/uploads/', ''))
            if os.path.exists(full_path):
                os.remove(full_path)
                return True
            return False
        except Exception as e:
            print(f"删除文件失败: {e}")
            return False

    def get_file_url(self, file_path: str) -> str:
        """获取本地文件访问URL"""
        if file_path.startswith('/uploads/'):
            return file_path
        return f"/uploads/{file_path}"


class OSSStorage(StorageService):
    """阿里云OSS存储服务"""

    def __init__(self):
        raw_endpoint = (settings.oss_endpoint or "").strip()
        if not raw_endpoint:
            raise ValueError("OSS_ENDPOINT 未配置或为空")

        if raw_endpoint.startswith("http://") or raw_endpoint.startswith("https://"):
            self._endpoint_url = raw_endpoint
            endpoint_host = raw_endpoint.split("://", 1)[1].rstrip('/')
        else:
            self._endpoint_url = f"https://{raw_endpoint}"
            endpoint_host = raw_endpoint.rstrip('/')

        self.endpoint = endpoint_host
        self.access_key = settings.oss_access_key
        self.secret_key = settings.oss_secret_key
        self.bucket_name = settings.oss_bucket

        custom_domain = (settings.oss_custom_domain or "").strip()
        if custom_domain.startswith("http://") or custom_domain.startswith("https://"):
            custom_domain = custom_domain.split("://", 1)[1]
        self.custom_domain = custom_domain.rstrip('/')

        # 初始化OSS客户端
        try:
            import oss2
            auth = oss2.Auth(self.access_key, self.secret_key)
            self.bucket = oss2.Bucket(auth, self._endpoint_url, self.bucket_name)
        except ImportError:
            raise ImportError("请安装 oss2: pip install oss2")

    def upload_file(self, file_path: str, destination_path: str) -> str:
        """
        上传文件到阿里云OSS
        :param file_path: 本地文件路径
        :param destination_path: OSS对象key（路径）
        :return: 文件访问URL
        """
        try:
            # 上传文件
            with open(file_path, 'rb') as f:
                self.bucket.put_object(destination_path, f)

            # 返回访问URL
            return self.get_file_url(destination_path)
        except Exception as e:
            raise Exception(f"上传到OSS失败: {e}")

    def delete_file(self, file_path: str) -> bool:
        """从OSS删除文件"""
        try:
            self.bucket.delete_object(file_path)
            return True
        except Exception as e:
            print(f"从OSS删除文件失败: {e}")
            return False

    def get_file_url(self, file_path: str) -> str:
        """获取OSS文件访问URL"""
        if self.custom_domain:
            # 使用自定义域名
            return f"https://{self.custom_domain}/{file_path}"

        # 使用默认OSS域名
        return f"https://{self.bucket_name}.{self.endpoint}/{file_path}"


def get_storage_service(storage_type: str = None) -> StorageService:
    """
    获取存储服务实例
    :param storage_type: 存储类型 (local, oss)
    :return: 存储服务实例
    """
    storage_type = storage_type or settings.storage_type

    if storage_type == "oss":
        return OSSStorage()
    elif storage_type == "local":
        return LocalStorage()
    else:
        # 默认使用本地存储
        return LocalStorage()


def generate_unique_filename(original_filename: str) -> str:
    """
    生成唯一文件名
    :param original_filename: 原始文件名
    :return: 唯一文件名
    """
    # 获取文件扩展名
    ext = Path(original_filename).suffix
    # 生成UUID
    unique_id = str(uuid.uuid4())
    return f"{unique_id}{ext}"


def get_upload_path(category: str = "gallery") -> str:
    """
    获取上传路径（按日期组织）
    :param category: 分类（gallery, avatar等）
    :return: 相对路径
    """
    now = datetime.now()
    return f"{category}/{now.year}/{now.month:02d}/{now.day:02d}"


# ============ 新的可读性命名路径生成函数 (Plan A) ============

def generate_gallery_image_path(
    category: str,
    group_id: str,
    sequence: int,
    size: str
) -> str:
    """
    生成图廊图片的可读性路径

    :param category: 分类名 (e.g., "巡演返图")
    :param group_id: 图组ID (UUID)
    :param sequence: 图片序号 (从1开始)
    :param size: 尺寸 (original, medium, thumb)
    :return: OSS 对象路径

    例子: gallery/巡演返图/2025-11-02/f2b4969f-822b-487c-b945-c17fae378f54_001_original.jpg
    """
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    filename = f"{group_id}_{sequence:03d}_{size}.jpg"
    return f"gallery/{category}/{date_str}/{filename}"


def generate_article_cover_path(
    article_id: str,
    size: str
) -> str:
    """
    生成文章封面的可读性路径

    :param article_id: 文章ID (UUID)
    :param size: 尺寸 (original, medium, thumb)
    :return: OSS 对象路径

    例子: article-covers/2025-11-02/uuid-of-article_original.jpg
    """
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    filename = f"{article_id}_{size}.jpg"
    return f"article-covers/{date_str}/{filename}"


def generate_article_image_path(
    category_primary: str,
    article_id: str,
    sequence: int,
    size: str
) -> str:
    """
    生成文章配图的可读性路径

    :param category_primary: 一级分类 (e.g., "峰言峰语")
    :param article_id: 文章ID (UUID)
    :param sequence: 图片序号 (从1开始)
    :param size: 尺寸 (original, medium, thumb)
    :return: OSS 对象路径

    例子: article-images/峰言峰语/2025-11-02/uuid-of-article_001_original.jpg
    """
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    filename = f"{article_id}_{sequence:03d}_{size}.jpg"
    return f"article-images/{category_primary}/{date_str}/{filename}"


def generate_video_cover_path(
    video_id: str,
    size: str
) -> str:
    """
    生成视频封面的可读性路径

    :param video_id: 视频ID (UUID)
    :param size: 尺寸 (original, medium, thumb)
    :return: OSS 对象路径

    例子: video-covers/2025-11-02/uuid-of-video_original.jpg
    """
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    filename = f"{video_id}_{size}.jpg"
    return f"video-covers/{date_str}/{filename}"


def generate_avatar_keys(user_id: int, extension: str) -> Tuple[str, str]:
    """生成头像原图和缩略图的存储键"""
    now = datetime.now()
    date_path = f"{now.year}/{now.month:02d}/{now.day:02d}"
    token = uuid.uuid4().hex[:10]

    normalized_ext = extension.lower().lstrip('.') if extension else 'jpg'
    if not normalized_ext:
        normalized_ext = 'jpg'

    original_key = f"avatars/{date_path}/{user_id}_{token}_original.{normalized_ext}"
    thumb_key = f"avatars/{date_path}/{user_id}_{token}_thumb.jpg"

    return original_key, thumb_key
