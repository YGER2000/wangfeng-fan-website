"""图片处理工具"""
from pathlib import Path
from PIL import Image
import io


def compress_image(source_path: Path, target_path: Path, max_size_kb: int = 200) -> bool:
    """
    压缩图片到指定文件大小以下

    Args:
        source_path: 源图片路径
        target_path: 目标图片路径
        max_size_kb: 最大文件大小（KB），默认200KB

    Returns:
        bool: 是否压缩成功
    """
    try:
        # 打开图片
        img = Image.open(source_path)

        # 如果是 RGBA 模式（有透明通道），转换为 RGB
        if img.mode in ('RGBA', 'LA', 'P'):
            # 创建白色背景
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # 获取原始EXIF信息（如果有）
        exif = img.info.get('exif', b'')

        # 二分法查找合适的质量参数
        quality = 85
        min_quality = 20
        max_quality = 95

        # 先尝试用85质量压缩
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=quality, optimize=True, exif=exif)
        size_kb = buffer.tell() / 1024

        # 如果已经小于目标大小，直接保存
        if size_kb <= max_size_kb:
            with open(target_path, 'wb') as f:
                f.write(buffer.getvalue())
            return True

        # 使用二分法找到合适的质量参数
        attempts = 0
        max_attempts = 10

        while attempts < max_attempts and abs(size_kb - max_size_kb) > 10:
            if size_kb > max_size_kb:
                max_quality = quality
            else:
                min_quality = quality

            quality = (min_quality + max_quality) // 2

            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=quality, optimize=True, exif=exif)
            size_kb = buffer.tell() / 1024

            attempts += 1

        # 如果还是太大，尝试缩小尺寸
        if size_kb > max_size_kb * 1.2:
            # 计算缩放比例
            scale = (max_size_kb / size_kb) ** 0.5
            new_width = int(img.width * scale)
            new_height = int(img.height * scale)
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # 重新压缩
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=quality, optimize=True, exif=exif)

        # 保存最终结果
        with open(target_path, 'wb') as f:
            f.write(buffer.getvalue())

        return True

    except Exception as e:
        print(f"图片压缩失败: {e}")
        return False
