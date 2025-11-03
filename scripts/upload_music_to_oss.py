#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
阿里云 OSS 音乐上传工具
功能: 将 frontend/public/music 目录完整上传到 OSS
使用: python3 scripts/upload_music_to_oss.py
"""

import os
import sys
import mimetypes
from pathlib import Path
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv('backend/.env')

# 导入 oss2
try:
    import oss2
except ImportError:
    print("❌ 需要安装 oss2 库:")
    print("   pip install oss2")
    sys.exit(1)

# 从环境变量读取配置
ACCESS_KEY_ID = os.getenv('OSS_ACCESS_KEY_ID', '').strip()
ACCESS_KEY_SECRET = os.getenv('OSS_ACCESS_KEY_SECRET', '').strip()
BUCKET_NAME = os.getenv('OSS_BUCKET_NAME', '').strip()
ENDPOINT = os.getenv('OSS_ENDPOINT', '').strip()

# 音乐目录 (相对于脚本位置)
MUSIC_DIR = Path(__file__).parent.parent / 'frontend' / 'public' / 'music'

def validate_config():
    """验证 OSS 配置"""
    missing = []
    if not ACCESS_KEY_ID:
        missing.append('OSS_ACCESS_KEY_ID')
    if not ACCESS_KEY_SECRET:
        missing.append('OSS_ACCESS_KEY_SECRET')
    if not BUCKET_NAME:
        missing.append('OSS_BUCKET_NAME')
    if not ENDPOINT:
        missing.append('OSS_ENDPOINT')

    if missing:
        print("❌ OSS 配置不完整，请检查 backend/.env 中的以下字段:")
        for item in missing:
            print(f"   - {item}")
        return False

    if not MUSIC_DIR.exists():
        print(f"❌ 音乐目录不存在: {MUSIC_DIR}")
        return False

    return True

def get_all_music_files():
    """获取所有音乐文件"""
    files = []
    for root, dirs, filenames in os.walk(MUSIC_DIR):
        for filename in filenames:
            full_path = Path(root) / filename
            # 相对于 music 目录的相对路径
            rel_path = full_path.relative_to(MUSIC_DIR)
            files.append((full_path, f'music/{rel_path}'))
    return sorted(files)

def upload_files(bucket, files):
    """上传文件到 OSS"""
    total = len(files)
    success = 0
    failed = []

    print(f"\n📤 开始上传 {total} 个文件...\n")

    for idx, (local_path, oss_path) in enumerate(files, 1):
        try:
            # 转换为 Unix 路径格式 (OSS 要求)
            oss_path = str(oss_path).replace('\\', '/')

            # 获取文件大小
            file_size = local_path.stat().st_size
            file_size_mb = file_size / (1024 * 1024)

            # 获取 MIME 类型
            mime_type, _ = mimetypes.guess_type(str(local_path))
            if mime_type is None:
                # 根据扩展名手动设置
                ext = local_path.suffix.lower()
                mime_types_map = {
                    '.mp3': 'audio/mpeg',
                    '.flac': 'audio/flac',
                    '.wav': 'audio/wav',
                    '.m4a': 'audio/mp4',
                }
                mime_type = mime_types_map.get(ext, 'application/octet-stream')

            # 上传
            with open(local_path, 'rb') as f:
                bucket.put_object(
                    oss_path,
                    f,
                    headers={'Content-Type': mime_type}
                )

            success += 1
            percent = int((idx / total) * 100)
            print(f"[{percent:3d}%] ✅ {idx:4d}/{total} {oss_path:60s} {file_size_mb:8.1f}MB")

        except Exception as e:
            failed.append((oss_path, str(e)))
            print(f"[    ] ❌ {idx:4d}/{total} {oss_path:60s} 错误: {e}")

    return success, failed

def main():
    """主程序"""
    print("=" * 80)
    print("🎵 阿里云 OSS 音乐上传工具 v1.0")
    print("=" * 80)
    print()

    # 验证配置
    if not validate_config():
        sys.exit(1)

    # 显示配置信息
    print("📋 配置信息:")
    print(f"  Bucket: {BUCKET_NAME}")
    print(f"  Endpoint: {ENDPOINT}")
    print(f"  音乐目录: {MUSIC_DIR}")
    print(f"  目录大小: {sum(f.stat().st_size for f in MUSIC_DIR.rglob('*') if f.is_file()) / (1024**3):.2f}GB")
    print()

    # 获取文件列表
    files = get_all_music_files()
    if not files:
        print("❌ 未找到任何音乐文件")
        sys.exit(1)

    print(f"📊 找到 {len(files)} 个文件")
    print()

    # 确认上传
    response = input("👉 确认上传到 OSS 吗？(yes/no) [默认: no]: ").strip().lower()
    if response not in ['yes', 'y']:
        print("❌ 已取消")
        sys.exit(0)

    # 初始化 OSS 客户端
    print("\n🔗 连接到 OSS...")
    try:
        auth = oss2.Auth(ACCESS_KEY_ID, ACCESS_KEY_SECRET)
        bucket = oss2.Bucket(auth, ENDPOINT, BUCKET_NAME)
        # 测试连接
        bucket.list_objects(max_keys=1)
        print("✅ 连接成功\n")
    except Exception as e:
        print(f"❌ 连接失败: {e}")
        sys.exit(1)

    # 上传文件
    success, failed = upload_files(bucket, files)

    # 显示结果
    print(f"\n" + "=" * 80)
    print("📊 上传结果统计")
    print("=" * 80)
    print(f"  ✅ 成功: {success}/{len(files)}")
    print(f"  ❌ 失败: {len(failed)}/{len(files)}")

    if failed:
        print(f"\n❌ 失败的文件:")
        for path, error in failed:
            print(f"  - {path}")
            print(f"    错误: {error}")
        sys.exit(1)
    else:
        print(f"\n🎉 所有文件上传成功!")
        oss_base_url = f"https://{BUCKET_NAME}.{ENDPOINT.replace('oss-', '').replace('.aliyuncs.com', '')}.aliyuncs.com"
        print(f"\n🌐 OSS 访问地址:")
        print(f"   {oss_base_url}/music/")
        print(f"\n💡 提示: 更新 .env 中的 MUSIC_OSS_BASE_URL 为上述地址")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  用户中断")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
