# -*- coding: utf-8 -*-
"""
图片存储服务
支持 MinIO、Cloudflare R2、阿里云 OSS（S3 兼容）
"""
import os
import io
import uuid
from datetime import datetime
from typing import Literal
from PIL import Image
from minio import Minio
from minio.error import S3Error

# 存储配置
STORAGE_TYPE: Literal["minio", "r2", "oss", "local"] = os.getenv("STORAGE_TYPE", "minio")

# MinIO 配置（默认本地）
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "wangfeng-images")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"

# Cloudflare R2 配置
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY", "")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY", "")
R2_BUCKET = os.getenv("R2_BUCKET", "wangfeng-images")

# 阿里云 OSS 配置
OSS_ENDPOINT = os.getenv("OSS_ENDPOINT", "")  # 例如：oss-cn-hangzhou.aliyuncs.com
OSS_ACCESS_KEY = os.getenv("OSS_ACCESS_KEY", "")
OSS_SECRET_KEY = os.getenv("OSS_SECRET_KEY", "")
OSS_BUCKET = os.getenv("OSS_BUCKET", "wangfeng-images")
OSS_CUSTOM_DOMAIN = os.getenv("OSS_CUSTOM_DOMAIN", "")  # 可选：自定义域名

# 本地存储配置
LOCAL_STORAGE_PATH = os.getenv("LOCAL_STORAGE_PATH", "./uploads")


class ImageStorage:
    """图片存储类，支持多种存储后端"""

    def __init__(self):
        self.storage_type = STORAGE_TYPE
        self.client = None
        self._initialized = False

    def _ensure_initialized(self):
        """延迟初始化，避免启动时阻塞"""
        if self._initialized:
            return

        try:
            if self.storage_type == "minio":
                self._init_minio()
            elif self.storage_type == "r2":
                self._init_r2()
            elif self.storage_type == "oss":
                self._init_oss()
            elif self.storage_type == "local":
                self._init_local()
            self._initialized = True
        except Exception as e:
            print(f"⚠️ 存储初始化失败: {e}")
            print("💡 将在首次使用时重试...")

    def _init_minio(self):
        """初始化 MinIO 客户端"""
        try:
            self.client = Minio(
                MINIO_ENDPOINT,
                access_key=MINIO_ACCESS_KEY,
                secret_key=MINIO_SECRET_KEY,
                secure=MINIO_SECURE
            )

            # 确保 bucket 存在
            if not self.client.bucket_exists(MINIO_BUCKET):
                self.client.make_bucket(MINIO_BUCKET)
                print(f"✅ 创建 MinIO bucket: {MINIO_BUCKET}")

            # 设置 bucket 为公开读取
            policy = f'''{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Principal": {{"AWS": ["*"]}},
                        "Action": ["s3:GetObject"],
                        "Resource": ["arn:aws:s3:::{MINIO_BUCKET}/*"]
                    }}
                ]
            }}'''
            self.client.set_bucket_policy(MINIO_BUCKET, policy)

        except Exception as e:
            print(f"❌ MinIO 初始化失败: {e}")
            raise

    def _init_r2(self):
        """初始化 Cloudflare R2 客户端（S3 兼容）"""
        try:
            # R2 使用 S3 兼容 API
            endpoint = f"{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
            self.client = Minio(
                endpoint,
                access_key=R2_ACCESS_KEY,
                secret_key=R2_SECRET_KEY,
                secure=True
            )

            # 确保 bucket 存在
            if not self.client.bucket_exists(R2_BUCKET):
                self.client.make_bucket(R2_BUCKET)
                print(f"✅ 创建 R2 bucket: {R2_BUCKET}")

        except Exception as e:
            print(f"❌ R2 初始化失败: {e}")
            raise

    def _init_oss(self):
        """初始化阿里云 OSS 客户端（S3 兼容）"""
        try:
            # 阿里云 OSS 使用 S3 兼容 API
            self.client = Minio(
                OSS_ENDPOINT,
                access_key=OSS_ACCESS_KEY,
                secret_key=OSS_SECRET_KEY,
                secure=True,  # 阿里云 OSS 强制使用 HTTPS
                region=None  # OSS endpoint 已包含区域信息
            )

            # 确保 bucket 存在（如果不存在会抛出异常，说明需要手动创建）
            if not self.client.bucket_exists(OSS_BUCKET):
                print(f"⚠️ Bucket {OSS_BUCKET} 不存在，请在阿里云控制台创建")
                raise Exception(f"Bucket {OSS_BUCKET} 不存在")

            print(f"✅ 阿里云 OSS 已连接: {OSS_BUCKET}")

        except Exception as e:
            print(f"❌ 阿里云 OSS 初始化失败: {e}")
            raise

    def _init_local(self):
        """初始化本地存储"""
        os.makedirs(LOCAL_STORAGE_PATH, exist_ok=True)
        print(f"✅ 本地存储目录: {LOCAL_STORAGE_PATH}")

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
        格式: articles/YYYY/MM/uuid_原始名称.ext

        Args:
            original_filename: 原始文件名
            extension: 文件扩展名

        Returns:
            完整的文件路径
        """
        now = datetime.now()
        year = now.strftime('%Y')
        month = now.strftime('%m')

        # 生成 UUID
        file_uuid = str(uuid.uuid4())[:8]

        # 清理原始文件名（只保留字母数字和下划线）
        clean_name = ''.join(c if c.isalnum() or c in ('_', '-') else '_'
                            for c in original_filename.rsplit('.', 1)[0])
        clean_name = clean_name[:30]  # 限制长度

        # 组合路径
        filename = f"{file_uuid}_{clean_name}.{extension}"
        return f"articles/{year}/{month}/{filename}"

    def upload_image(self, image_data: bytes, filename: str) -> str:
        """
        上传图片

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

        # 根据存储类型上传
        if self.storage_type in ["minio", "r2", "oss"]:
            return self._upload_to_s3(compressed_data, object_name)
        elif self.storage_type == "local":
            return self._upload_to_local(compressed_data, object_name)
        else:
            raise ValueError(f"不支持的存储类型: {self.storage_type}")

    def _upload_to_s3(self, image_data: bytes, object_name: str) -> str:
        """上传到 S3 兼容存储（MinIO/R2/OSS）"""
        try:
            # 根据存储类型选择 bucket
            if self.storage_type == "minio":
                bucket = MINIO_BUCKET
            elif self.storage_type == "r2":
                bucket = R2_BUCKET
            elif self.storage_type == "oss":
                bucket = OSS_BUCKET
            else:
                bucket = MINIO_BUCKET

            self.client.put_object(
                bucket,
                object_name,
                io.BytesIO(image_data),
                length=len(image_data),
                content_type='image/jpeg'
            )

            # 生成访问 URL
            if self.storage_type == "minio":
                protocol = "https" if MINIO_SECURE else "http"
                url = f"{protocol}://{MINIO_ENDPOINT}/{bucket}/{object_name}"
            elif self.storage_type == "r2":
                # R2 使用自定义域名或公共 URL
                url = f"https://pub-{R2_ACCOUNT_ID}.r2.dev/{object_name}"
            elif self.storage_type == "oss":
                # 阿里云 OSS URL
                if OSS_CUSTOM_DOMAIN:
                    # 使用自定义域名（如果配置了）
                    url = f"https://{OSS_CUSTOM_DOMAIN}/{object_name}"
                else:
                    # 使用默认 OSS 域名
                    url = f"https://{bucket}.{OSS_ENDPOINT}/{object_name}"
            else:
                url = ""

            return url

        except S3Error as e:
            print(f"❌ 上传失败: {e}")
            raise

    def _upload_to_local(self, image_data: bytes, object_name: str) -> str:
        """上传到本地存储"""
        file_path = os.path.join(LOCAL_STORAGE_PATH, object_name)

        # 创建目录
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # 保存文件
        with open(file_path, 'wb') as f:
            f.write(image_data)

        # 返回相对 URL（需要配合静态文件服务）
        return f"/uploads/{object_name}"

    def delete_image(self, url: str) -> bool:
        """
        删除图片

        Args:
            url: 图片 URL

        Returns:
            是否删除成功
        """
        # 确保已初始化
        self._ensure_initialized()

        try:
            if self.storage_type in ["minio", "r2", "oss"]:
                # 根据存储类型选择 bucket
                if self.storage_type == "minio":
                    bucket = MINIO_BUCKET
                elif self.storage_type == "r2":
                    bucket = R2_BUCKET
                elif self.storage_type == "oss":
                    bucket = OSS_BUCKET
                else:
                    bucket = MINIO_BUCKET

                # 从 URL 提取 object_name
                # 支持多种 URL 格式
                if f"/{bucket}/" in url:
                    object_name = url.split(f"/{bucket}/")[-1]
                else:
                    # 对于自定义域名，提取路径部分
                    from urllib.parse import urlparse
                    parsed = urlparse(url)
                    object_name = parsed.path.lstrip('/')

                self.client.remove_object(bucket, object_name)
            elif self.storage_type == "local":
                # 从 URL 提取文件路径
                file_path = url.replace("/uploads/", "")
                full_path = os.path.join(LOCAL_STORAGE_PATH, file_path)
                if os.path.exists(full_path):
                    os.remove(full_path)

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
