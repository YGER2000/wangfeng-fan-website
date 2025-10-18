# -*- coding: utf-8 -*-
"""图片处理服务 - 压缩、缩略图生成"""
from PIL import Image
from io import BytesIO
import os
from typing import Tuple, Optional
from pathlib import Path


class ImageProcessor:
    """图片处理器"""

    # 缩略图尺寸（用于瀑布流展示）
    THUMB_WIDTH = 400
    THUMB_HEIGHT = None  # 自动计算保持比例

    # 中等尺寸（用于灯箱预览）
    MEDIUM_WIDTH = 1200
    MEDIUM_HEIGHT = None  # 自动计算保持比例

    # JPEG质量
    THUMB_QUALITY = 75  # 缩略图质量
    MEDIUM_QUALITY = 85  # 中等尺寸质量
    ORIGINAL_QUALITY = 90  # 原图压缩质量（如果原图过大）

    # 最大原图尺寸
    MAX_ORIGINAL_WIDTH = 2400
    MAX_ORIGINAL_HEIGHT = 2400

    @staticmethod
    def get_image_info(image_path: str) -> Tuple[int, int, str]:
        """
        获取图片信息
        :return: (width, height, mime_type)
        """
        with Image.open(image_path) as img:
            width, height = img.size
            mime_type = f"image/{img.format.lower()}" if img.format else "image/jpeg"
            return width, height, mime_type

    @staticmethod
    def resize_image(
        image: Image.Image,
        target_width: Optional[int] = None,
        target_height: Optional[int] = None,
        quality: int = 85
    ) -> BytesIO:
        """
        调整图片大小并压缩
        :param image: PIL Image对象
        :param target_width: 目标宽度
        :param target_height: 目标高度
        :param quality: JPEG质量（1-95）
        :return: BytesIO对象
        """
        # 获取原始尺寸
        orig_width, orig_height = image.size

        # 计算新尺寸
        if target_width and not target_height:
            # 只指定宽度，按比例缩放
            ratio = target_width / orig_width
            new_width = target_width
            new_height = int(orig_height * ratio)
        elif target_height and not target_width:
            # 只指定高度，按比例缩放
            ratio = target_height / orig_height
            new_height = target_height
            new_width = int(orig_width * ratio)
        elif target_width and target_height:
            # 同时指定宽高
            new_width = target_width
            new_height = target_height
        else:
            # 都不指定，保持原尺寸
            new_width = orig_width
            new_height = orig_height

        # 如果新尺寸大于等于原尺寸，直接保存
        if new_width >= orig_width and new_height >= orig_height:
            output = BytesIO()
            # 转换为RGB模式（如果是RGBA）
            if image.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                rgb_img.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
                rgb_img.save(output, format='JPEG', quality=quality, optimize=True)
            else:
                image.save(output, format='JPEG', quality=quality, optimize=True)
            output.seek(0)
            return output

        # 缩放图片（使用高质量的LANCZOS算法）
        resized_image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # 保存为JPEG
        output = BytesIO()
        # 转换为RGB模式（JPEG不支持透明度）
        if resized_image.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', resized_image.size, (255, 255, 255))
            if resized_image.mode == 'P':
                resized_image = resized_image.convert('RGBA')
            rgb_img.paste(resized_image, mask=resized_image.split()[-1] if resized_image.mode in ('RGBA', 'LA') else None)
            rgb_img.save(output, format='JPEG', quality=quality, optimize=True)
        else:
            if resized_image.mode != 'RGB':
                resized_image = resized_image.convert('RGB')
            resized_image.save(output, format='JPEG', quality=quality, optimize=True)

        output.seek(0)
        return output

    @classmethod
    def process_image(
        cls,
        input_path: str,
        output_dir: str,
        filename_base: str
    ) -> Tuple[str, str, str, int, int]:
        """
        处理图片：生成原图（压缩）、中等尺寸、缩略图
        :param input_path: 输入图片路径
        :param output_dir: 输出目录
        :param filename_base: 文件名基础（不含扩展名）
        :return: (original_path, medium_path, thumb_path, width, height)
        """
        # 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)

        # 打开图片
        with Image.open(input_path) as img:
            # 获取原始尺寸
            orig_width, orig_height = img.size

            # 处理EXIF旋转信息
            try:
                from PIL import ImageOps
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass

            # 1. 处理原图（如果过大则压缩）
            original_path = os.path.join(output_dir, f"{filename_base}.jpg")
            if orig_width > cls.MAX_ORIGINAL_WIDTH or orig_height > cls.MAX_ORIGINAL_HEIGHT:
                # 原图过大，需要缩小
                original_data = cls.resize_image(
                    img,
                    target_width=cls.MAX_ORIGINAL_WIDTH,
                    quality=cls.ORIGINAL_QUALITY
                )
                with open(original_path, 'wb') as f:
                    f.write(original_data.getvalue())
            else:
                # 原图尺寸合适，只需要压缩
                original_data = cls.resize_image(
                    img,
                    target_width=orig_width,
                    target_height=orig_height,
                    quality=cls.ORIGINAL_QUALITY
                )
                with open(original_path, 'wb') as f:
                    f.write(original_data.getvalue())

            # 2. 生成中等尺寸
            medium_path = os.path.join(output_dir, f"{filename_base}_medium.jpg")
            medium_data = cls.resize_image(
                img,
                target_width=cls.MEDIUM_WIDTH,
                quality=cls.MEDIUM_QUALITY
            )
            with open(medium_path, 'wb') as f:
                f.write(medium_data.getvalue())

            # 3. 生成缩略图
            thumb_path = os.path.join(output_dir, f"{filename_base}_thumb.jpg")
            thumb_data = cls.resize_image(
                img,
                target_width=cls.THUMB_WIDTH,
                quality=cls.THUMB_QUALITY
            )
            with open(thumb_path, 'wb') as f:
                f.write(thumb_data.getvalue())

            return original_path, medium_path, thumb_path, orig_width, orig_height

    @staticmethod
    def get_file_size(file_path: str) -> int:
        """获取文件大小（字节）"""
        return os.path.getsize(file_path)
