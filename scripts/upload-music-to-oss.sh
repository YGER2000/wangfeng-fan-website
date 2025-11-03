#!/bin/bash

# OSS 音乐上传脚本
# 功能: 将 frontend/public/music 目录上传到阿里云 OSS
# 使用方式: ./scripts/upload-music-to-oss.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置信息
MUSIC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/frontend/public/music"

# 从 .env 文件读取 OSS 配置
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ 错误: 找不到 backend/.env 文件${NC}"
    echo "请先运行: cp backend/.env.example backend/.env"
    exit 1
fi

# 读取 .env 中的 OSS 配置
OSS_ACCESS_KEY_ID=$(grep "^OSS_ACCESS_KEY_ID=" backend/.env | cut -d '=' -f2)
OSS_ACCESS_KEY_SECRET=$(grep "^OSS_ACCESS_KEY_SECRET=" backend/.env | cut -d '=' -f2)
OSS_BUCKET_NAME=$(grep "^OSS_BUCKET_NAME=" backend/.env | cut -d '=' -f2)
OSS_ENDPOINT=$(grep "^OSS_ENDPOINT=" backend/.env | cut -d '=' -f2)

if [ -z "$OSS_ACCESS_KEY_ID" ] || [ -z "$OSS_ACCESS_KEY_SECRET" ] || [ -z "$OSS_BUCKET_NAME" ] || [ -z "$OSS_ENDPOINT" ]; then
    echo -e "${RED}❌ 错误: OSS 配置不完整${NC}"
    echo "请检查 backend/.env 中的以下配置:"
    echo "  - OSS_ACCESS_KEY_ID"
    echo "  - OSS_ACCESS_KEY_SECRET"
    echo "  - OSS_BUCKET_NAME"
    echo "  - OSS_ENDPOINT"
    exit 1
fi

echo -e "${GREEN}=== 阿里云 OSS 音乐上传工具 ===${NC}"
echo ""
echo "📁 音乐目录: $MUSIC_DIR"
echo "📊 目录大小: $(du -sh "$MUSIC_DIR" | cut -f1)"
echo ""
echo "🪣 OSS 配置:"
echo "  Bucket: $OSS_BUCKET_NAME"
echo "  Endpoint: $OSS_ENDPOINT"
echo ""

# 检查是否安装了 ossutil
if ! command -v ossutil64 &> /dev/null && ! command -v ossutil &> /dev/null; then
    echo -e "${YELLOW}⚠️   未检测到 ossutil，需要安装${NC}"
    echo ""
    echo "请选择安装方式:"
    echo "1. 自动安装 (macOS/Linux)"
    echo "2. 手动下载: https://github.com/aliyun/ossutil/releases"
    echo ""
    read -p "选择 [1/2]: " choice

    if [ "$choice" = "1" ]; then
        echo -e "${YELLOW}⏳ 下载 ossutil...${NC}"

        # 检测系统
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            curl -o /tmp/ossutil64 https://gosspublic.alicdn.com/ossutil/1.7.18/ossutilmac64
        else
            # Linux
            curl -o /tmp/ossutil64 https://gosspublic.alicdn.com/ossutil/1.7.18/ossutil64
        fi

        chmod +x /tmp/ossutil64
        OSSUTIL="/tmp/ossutil64"
    else
        echo -e "${RED}❌ 请先安装 ossutil${NC}"
        exit 1
    fi
else
    OSSUTIL=$(command -v ossutil64 || command -v ossutil)
fi

echo -e "${GREEN}✅ ossutil 已就绪${NC}"
echo ""

# 配置 ossutil
echo -e "${YELLOW}⏳ 配置 ossutil...${NC}"

# 创建临时配置
CONFIG_FILE="/tmp/ossutil-config-$$.txt"
cat > "$CONFIG_FILE" << EOF
$OSS_ENDPOINT
$OSS_ACCESS_KEY_ID
$OSS_ACCESS_KEY_SECRET
CN
false
EOF

# 设置配置
"$OSSUTIL" config -f "$CONFIG_FILE" -i "$OSS_ACCESS_KEY_ID" -k "$OSS_ACCESS_KEY_SECRET" -e "$OSS_ENDPOINT" -c /tmp/.ossutilconfig-$$ > /dev/null 2>&1 || true

echo -e "${GREEN}✅ 配置完成${NC}"
echo ""

# 上传文件
echo -e "${YELLOW}⏳ 开始上传音乐文件到 OSS...${NC}"
echo "📤 上传路径: oss://$OSS_BUCKET_NAME/music/"
echo ""

# 使用 Python 脚本执行上传 (更可靠)
python3 << 'PYTHON_UPLOAD_SCRIPT'
import os
import sys
import mimetypes
from pathlib import Path

try:
    import oss2
except ImportError:
    print("❌ 需要安装 oss2 库: pip install oss2")
    sys.exit(1)

# 从环境读取配置
access_key_id = os.environ.get('OSS_ACCESS_KEY_ID', '').strip()
access_key_secret = os.environ.get('OSS_ACCESS_KEY_SECRET', '').strip()
bucket_name = os.environ.get('OSS_BUCKET_NAME', '').strip()
endpoint = os.environ.get('OSS_ENDPOINT', '').strip()
music_dir = os.environ.get('MUSIC_DIR', '')

if not all([access_key_id, access_key_secret, bucket_name, endpoint, music_dir]):
    print("❌ 配置不完整")
    sys.exit(1)

# 初始化 OSS 客户端
auth = oss2.Auth(access_key_id, access_key_secret)
bucket = oss2.Bucket(auth, endpoint, bucket_name)

# 上传文件
music_path = Path(music_dir)
if not music_path.exists():
    print(f"❌ 音乐目录不存在: {music_dir}")
    sys.exit(1)

# 收集所有文件
files = []
for root, dirs, filenames in os.walk(music_dir):
    for filename in filenames:
        full_path = os.path.join(root, filename)
        rel_path = os.path.relpath(full_path, os.path.dirname(music_dir))
        files.append((full_path, rel_path))

total_files = len(files)
if total_files == 0:
    print("❌ 没有找到音乐文件")
    sys.exit(1)

print(f"📊 找到 {total_files} 个文件，开始上传...\n")

uploaded = 0
failed = []

for full_path, oss_path in files:
    try:
        # 确定 MIME 类型
        mime_type, _ = mimetypes.guess_type(full_path)
        if mime_type is None:
            mime_type = 'application/octet-stream'

        # 上传文件
        with open(full_path, 'rb') as f:
            bucket.put_object(oss_path, f, headers={'Content-Type': mime_type})

        uploaded += 1
        progress = f"[{uploaded}/{total_files}]"
        file_size = os.path.getsize(full_path) / (1024 * 1024)  # MB
        print(f"✅ {progress} {oss_path} ({file_size:.1f}MB)")

    except Exception as e:
        failed.append((oss_path, str(e)))
        print(f"❌ {oss_path}: {e}")

print(f"\n{'='*60}")
print(f"📊 上传结果:")
print(f"  ✅ 成功: {uploaded}/{total_files}")
print(f"  ❌ 失败: {len(failed)}/{total_files}")

if failed:
    print(f"\n失败的文件:")
    for path, error in failed:
        print(f"  - {path}: {error}")
    sys.exit(1)

print(f"\n🎉 所有文件上传成功!")
print(f"🌐 OSS 访问地址: https://{bucket_name}.{endpoint.replace('oss-', '').replace('.aliyuncs.com', '.aliyuncs.com')}/music/")

PYTHON_UPLOAD_SCRIPT
