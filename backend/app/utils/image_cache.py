# -*- coding: utf-8 -*-
"""
图片缓存工具
下载并缓存B站视频封面到本地
"""
import os
import requests
import hashlib
from PIL import Image
from io import BytesIO
from typing import Optional, Tuple
from pathlib import Path


# 配置
# 获取项目根目录（backend/app/utils -> 向上3级）
_project_root = Path(__file__).parent.parent.parent.parent
CACHE_DIR = _project_root / "frontend/public/images/video_covers"  # 封面缓存目录
THUMB_SIZE = (480, 270)  # 缩略图尺寸 16:9 比例 (适合视频卡片)
ORIGINAL_SIZE = (640, 360)  # 原图尺寸 16:9 比例


def ensure_cache_dir():
    """确保缓存目录存在"""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    thumb_dir = CACHE_DIR / "thumbnails"
    thumb_dir.mkdir(exist_ok=True)


def get_cache_filename(url: str, is_thumbnail: bool = False) -> str:
    """
    根据URL生成缓存文件名

    Args:
        url: 图片URL
        is_thumbnail: 是否为缩略图

    Returns:
        文件名 (不含路径)
    """
    # 使用URL的MD5作为文件名，避免特殊字符
    url_hash = hashlib.md5(url.encode()).hexdigest()
    suffix = "_thumb" if is_thumbnail else ""
    return f"{url_hash}{suffix}.jpg"


def download_image(url: str, timeout: int = 10) -> Optional[bytes]:
    """
    下载图片

    Args:
        url: 图片URL
        timeout: 超时时间(秒)

    Returns:
        图片二进制数据，失败返回None
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://www.bilibili.com/'
        }

        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()

        return response.content

    except Exception as e:
        print(f"下载图片失败 {url}: {e}")
        return None


def resize_image(image_data: bytes, max_size: Tuple[int, int]) -> Optional[bytes]:
    """
    调整图片大小（保持宽高比）

    Args:
        image_data: 原始图片二进制数据
        max_size: 最大尺寸 (宽, 高)

    Returns:
        调整后的图片二进制数据，失败返回None
    """
    try:
        img = Image.open(BytesIO(image_data))

        # 转换RGBA为RGB（如果需要）
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background

        # 计算缩放后的尺寸（保持宽高比）
        img.thumbnail(max_size, Image.Resampling.LANCZOS)

        # 保存到字节流
        output = BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        return output.getvalue()

    except Exception as e:
        print(f"调整图片大小失败: {e}")
        return None


def get_bilibili_resized_url(cover_url: str, width: int, height: int) -> str:
    """
    获取B站指定尺寸的封面URL

    Args:
        cover_url: 原始封面URL
        width: 目标宽度
        height: 目标高度

    Returns:
        添加尺寸参数后的URL
    """
    # B站封面尺寸参数格式: @{width}w_{height}h.jpg
    if not cover_url.endswith('.jpg'):
        return cover_url

    return f"{cover_url}@{width}w_{height}h.jpg"


def cache_cover_image(cover_url: str, bvid: str = "") -> Tuple[Optional[str], Optional[str]]:
    """
    下载并缓存视频封面图片（使用B站的16:9尺寸参数）

    Args:
        cover_url: B站封面URL
        bvid: 视频BV号（用于日志）

    Returns:
        (原图本地路径, 缩略图本地路径)，失败返回 (None, None)
        路径格式: /images/video_covers/xxx.jpg
    """
    ensure_cache_dir()

    # 生成文件名
    original_filename = get_cache_filename(cover_url, is_thumbnail=False)
    thumb_filename = get_cache_filename(cover_url, is_thumbnail=True)

    original_path = CACHE_DIR / original_filename
    thumb_path = CACHE_DIR / "thumbnails" / thumb_filename

    # 检查是否已缓存
    if original_path.exists() and thumb_path.exists():
        print(f"  ✓ 封面已缓存: {bvid}")
        # 返回相对于public目录的路径
        return (
            f"/images/video_covers/{original_filename}",
            f"/images/video_covers/thumbnails/{thumb_filename}"
        )

    print(f"  → 正在下载封面: {bvid}")

    try:
        # 使用B站的尺寸参数直接获取16:9比例的图片
        # 640x360 原图
        original_url = get_bilibili_resized_url(cover_url, 640, 360)
        original_data = download_image(original_url)

        if not original_data:
            return None, None

        # 保存原图
        with open(original_path, 'wb') as f:
            f.write(original_data)

        # 480x270 缩略图
        thumb_url = get_bilibili_resized_url(cover_url, 480, 270)
        thumb_data = download_image(thumb_url)

        if not thumb_data:
            # 如果缩略图下载失败，从原图生成
            thumb_data = resize_image(original_data, THUMB_SIZE)

        if thumb_data:
            with open(thumb_path, 'wb') as f:
                f.write(thumb_data)

        print(f"  ✓ 封面缓存成功: {bvid}")
        print(f"    原图(640x360): {len(original_data) / 1024:.1f}KB")
        print(f"    缩略图(480x270): {len(thumb_data) / 1024:.1f}KB")

        return (
            f"/images/video_covers/{original_filename}",
            f"/images/video_covers/thumbnails/{thumb_filename}"
        )

    except Exception as e:
        print(f"  ✗ 保存封面失败 {bvid}: {e}")
        # 清理可能的部分文件
        if original_path.exists():
            original_path.unlink()
        if thumb_path.exists():
            thumb_path.unlink()
        return None, None


def get_cached_cover_paths(cover_url: str) -> Tuple[Optional[str], Optional[str]]:
    """
    获取已缓存的封面路径（不下载）

    Args:
        cover_url: B站封面URL

    Returns:
        (原图路径, 缩略图路径)，如果不存在返回 (None, None)
    """
    original_filename = get_cache_filename(cover_url, is_thumbnail=False)
    thumb_filename = get_cache_filename(cover_url, is_thumbnail=True)

    original_path = CACHE_DIR / original_filename
    thumb_path = CACHE_DIR / "thumbnails" / thumb_filename

    if original_path.exists() and thumb_path.exists():
        return (
            f"/images/video_covers/{original_filename}",
            f"/images/video_covers/thumbnails/{thumb_filename}"
        )

    return None, None


# 测试代码
if __name__ == "__main__":
    # 测试下载和缓存
    test_url = "http://i1.hdslb.com/bfs/archive/992a333982c608e4861df5da424a432bd596d6a9.jpg"

    print("=== 测试图片缓存 ===")
    original, thumb = cache_cover_image(test_url, "TEST_BV")

    if original and thumb:
        print(f"\n原图路径: {original}")
        print(f"缩略图路径: {thumb}")
    else:
        print("\n缓存失败")
