# -*- coding: utf-8 -*-
"""
图片存储服务
使用阿里云 OSS (oss2) 官方 SDK
"""
import os
import io
import uuid
from datetime import datetime
from typing import Literal
from PIL import Image

# 尝试导入 oss2，如果不存在则使用 None
try:
    import oss2
except ImportError:
    oss2 = None

# 存储配置
STORAGE_TYPE: Literal["oss"] = os.getenv("STORAGE_TYPE", "oss")

# 阿里云 OSS 配置
OSS_ENDPOINT = os.getenv("OSS_ENDPOINT", "")  # 例如：oss-cn-hangzhou.aliyuncs.com
OSS_ACCESS_KEY = os.getenv("OSS_ACCESS_KEY", "")
OSS_SECRET_KEY = os.getenv("OSS_SECRET_KEY", "")
OSS_BUCKET = os.getenv("OSS_BUCKET", "wangfeng-images")
OSS_CUSTOM_DOMAIN = os.getenv("OSS_CUSTOM_DOMAIN", "")  # 可选：自定义域名


class ImageStorage:
    """图片存储类，仅支持阿里云 OSS"""

    def __init__(self):
        self.storage_type = STORAGE_TYPE
        self.client = None
        self._initialized = False

    def _ensure_initialized(self):
        """延迟初始化，避免启动时阻塞"""
        if self._initialized:
            return

        try:
            self._init_oss()
            self._initialized = True
        except Exception as e:
            print(f"⚠️ 存储初始化失败: {e}")
            print("💡 将在首次使用时重试...")
            raise

    def _init_minio(self):
        """已移除 MinIO 支持，请使用 oss 存储类型"""
        raise NotImplementedError("MinIO 已移除，请使用 STORAGE_TYPE=oss")

    def _init_r2(self):
        """已移除 Cloudflare R2 支持，请使用 oss 存储类型"""
        raise NotImplementedError("R2 已移除，请使用 STORAGE_TYPE=oss")

    def _init_oss(self):
        """初始化阿里云 OSS 客户端（使用官方 oss2 SDK）"""
        try:
            if not oss2:
                raise ImportError("oss2 library not installed. 请运行: pip install oss2")

            if not OSS_ENDPOINT or not OSS_ACCESS_KEY or not OSS_SECRET_KEY or not OSS_BUCKET:
                raise ValueError("⚠️ 阿里云 OSS 配置不完整。请检查环境变量: OSS_ENDPOINT, OSS_ACCESS_KEY, OSS_SECRET_KEY, OSS_BUCKET")

            # 创建 OSS 认证对象
            auth = oss2.Auth(OSS_ACCESS_KEY, OSS_SECRET_KEY)

            # 创建 Bucket 对象
            # endpoint 不包含 bucket 名称，oss2 会自动添加
            # 最终 URL 格式: https://{bucket}.{endpoint}/{object}
            oss_endpoint_url = f"https://{OSS_ENDPOINT}"
            self.client = oss2.Bucket(auth, oss_endpoint_url, OSS_BUCKET)

            # 测试连接 - 使用 get_bucket_info() 验证 bucket 是否可访问
            try:
                bucket_info = self.client.get_bucket_info()
                print(f"✅ 阿里云 OSS 已连接: {OSS_BUCKET} (存储类型: {bucket_info.storage_class})")
            except Exception as test_error:
                print(f"⚠️ OSS 连接测试警告: {test_error}")
                print(f"💡 将继续使用 OSS，首次上传时会验证连接")

        except Exception as e:
            print(f"❌ 阿里云 OSS 初始化失败: {e}")
            raise

    def compress_image(self, image_data: bytes, max_size_mb: float = 1.0) -> tuple[bytes, str]:
        """
        压缩图片到指定大小以内

        Args:
            image_data: 原始图片数据
            max_size_mb: 最大文件大小（MB）

        Returns:
            (压缩后的图片数据, 图片格式)
        """
        img = Image.open(io.BytesIO(image_data))

        # 转换 RGBA 为 RGB（JPEG 不支持透明度）
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background

        # 获取原始尺寸
        width, height = img.size
        max_dimension = 2048  # 最大边长

        # 如果尺寸过大，先缩放
        if width > max_dimension or height > max_dimension:
            if width > height:
                new_width = max_dimension
                new_height = int(height * (max_dimension / width))
            else:
                new_height = max_dimension
                new_width = int(width * (max_dimension / height))
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # 逐步降低质量直到满足大小要求
        quality = 90
        max_size_bytes = int(max_size_mb * 1024 * 1024)

        while quality > 20:
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=quality, optimize=True)
            size = output.tell()

            if size <= max_size_bytes:
                output.seek(0)
                return output.read(), 'jpg'

            quality -= 10

        # 如果还是太大，进一步缩小尺寸
        output = io.BytesIO()
        img = img.resize((int(img.width * 0.8), int(img.height * 0.8)), Image.Resampling.LANCZOS)
        img.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)
        return output.read(), 'jpg'

    def generate_filename(self, original_filename: str, extension: str) -> str:
        """
        生成唯一的文件名
        格式: article-images/general/YYYY/MM/DD/uuid_原始名称.ext

        Args:
            original_filename: 原始文件名
            extension: 文件扩展名

        Returns:
            完整的文件路径
        """
        now = datetime.now()
        year = now.strftime('%Y')
        month = now.strftime('%m')
        day = now.strftime('%d')

        # 生成 UUID
        file_uuid = str(uuid.uuid4())[:8]

        # 清理原始文件名（只保留字母数字和下划线）
        clean_name = ''.join(c if c.isalnum() or c in ('_', '-') else '_'
                            for c in original_filename.rsplit('.', 1)[0])
        clean_name = clean_name[:30]  # 限制长度

        # 组合路径
        filename = f"{file_uuid}_{clean_name}.{extension}"
        return f"article-images/general/{year}/{month}/{day}/{filename}"

    def _object_name_to_url(self, object_name: str) -> str:
        """将 OSS 对象键转换为可访问 URL"""
        if OSS_CUSTOM_DOMAIN:
            # 使用自定义域名（如果配置了）
            return f"https://{OSS_CUSTOM_DOMAIN}/{object_name}"
        # 使用虚拟主机式 URL（virtual hosted-style）
        return f"https://{OSS_BUCKET}.{OSS_ENDPOINT}/{object_name}"

    def upload_bytes(
        self,
        data: bytes,
        object_name: str,
        content_type: str = "image/jpeg",
    ) -> str:
        """
        使用指定的对象键上传原始二进制数据到 OSS

        Args:
            data: 文件二进制数据
            object_name: OSS 对象键（包含目录和文件名）
            content_type: Content-Type 头

        Returns:
            文件访问 URL
        """
        # 确保已初始化
        self._ensure_initialized()

        try:
            headers = {
                "Content-Type": content_type,
            }
            self.client.put_object(object_name, data, headers=headers)
            return self._object_name_to_url(object_name)
        except Exception as e:
            print(f"❌ 上传到 OSS 失败: {e}")
            raise

    def upload_image(self, image_data: bytes, filename: str) -> str:
        """
        上传图片到阿里云 OSS

        Args:
            image_data: 图片数据
            filename: 原始文件名

        Returns:
            图片的访问 URL
        """
        # 确保已初始化
        self._ensure_initialized()

        # 压缩图片
        compressed_data, extension = self.compress_image(image_data, max_size_mb=1.0)

        # 生成唯一文件名
        object_name = self.generate_filename(filename, extension)

        # 上传到 OSS
        return self._upload_to_oss(compressed_data, object_name)

    def _upload_to_oss(self, image_data: bytes, object_name: str) -> str:
        """上传到阿里云 OSS（使用官方 oss2 SDK）"""
        try:
            # 使用 oss2 的 put_object 方法上传
            self.client.put_object(object_name, image_data)

            # 生成访问 URL
            return self._object_name_to_url(object_name)

        except Exception as e:
            print(f"❌ 上传到 OSS 失败: {e}")
            raise

    def delete_image(self, url: str) -> bool:
        """
        删除图片（从阿里云 OSS）

        Args:
            url: 图片 URL

        Returns:
            是否删除成功
        """
        # 确保已初始化
        self._ensure_initialized()

        try:
            # 从 URL 提取 object_name
            # 支持两种 URL 格式：
            # 1. https://{bucket}.{endpoint}/{object_name}
            # 2. https://{custom_domain}/{object_name}
            from urllib.parse import urlparse
            parsed = urlparse(url)

            # 移除开头的 /
            object_name = parsed.path.lstrip('/')

            # 删除对象
            self.client.delete_object(object_name)
            return True

        except Exception as e:
            print(f"❌ 删除图片失败: {e}")
            return False


# 全局单例
_storage_instance = None

def get_storage() -> ImageStorage:
    """获取存储实例（单例模式）"""
    global _storage_instance
    if _storage_instance is None:
        _storage_instance = ImageStorage()
    return _storage_instance
