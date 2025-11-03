#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
重新上传单个失败的音乐文件
"""

import os
import sys
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
ACCESS_KEY_ID = os.getenv('OSS_ACCESS_KEY', '').strip()
ACCESS_KEY_SECRET = os.getenv('OSS_ACCESS_KEY_SECRET', '').strip()
BUCKET_NAME = os.getenv('OSS_BUCKET_NAME', '').strip()
ENDPOINT = os.getenv('OSS_ENDPOINT', '').strip()

# 失败的文件路径
FAILED_FILE = Path('frontend/public/music/live/2013-存在超级巡回上海演唱会/27.光明.flac')
OSS_PATH = 'music/live/2013-存在超级巡回上海演唱会/27.光明.flac'

def main():
    print("=" * 80)
    print("🎵 重新上传失败的音乐文件")
    print("=" * 80)
    print()

    # 验证配置
    if not all([ACCESS_KEY_ID, ACCESS_KEY_SECRET, BUCKET_NAME, ENDPOINT]):
        print("❌ OSS 配置不完整")
        sys.exit(1)

    # 验证文件存在
    if not FAILED_FILE.exists():
        print(f"❌ 文件不存在: {FAILED_FILE}")
        sys.exit(1)

    file_size = FAILED_FILE.stat().st_size / (1024 * 1024)
    print(f"📄 文件: {FAILED_FILE}")
    print(f"📊 大小: {file_size:.1f}MB")
    print(f"🪣 Bucket: {BUCKET_NAME}")
    print(f"📤 OSS 路径: {OSS_PATH}")
    print()

    # 初始化 OSS 客户端
    print("🔗 连接到 OSS...")
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
    print("📤 开始上传...")
    try:
        with open(FAILED_FILE, 'rb') as f:
            bucket.put_object(
                OSS_PATH,
                f,
                headers={'Content-Type': 'audio/flac'}
            )
        print("✅ 上传成功!")
        print()
        oss_base_url = f"https://{BUCKET_NAME}.{ENDPOINT.replace('oss-', '').replace('.aliyuncs.com', '')}.aliyuncs.com"
        print(f"🌐 访问地址:")
        print(f"   {oss_base_url}/{OSS_PATH}")
    except Exception as e:
        print(f"❌ 上传失败: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
