#!/bin/bash
# 启动 MinIO 和后端服务的快速脚本

echo "🚀 启动汪峰粉丝网站后端服务..."

# 检查 MinIO 是否在运行
if ! docker ps | grep -q minio; then
    echo "📦 启动 MinIO Docker 容器..."
    docker run -d \
        -p 9000:9000 \
        -p 9001:9001 \
        --name minio \
        -e "MINIO_ROOT_USER=minioadmin" \
        -e "MINIO_ROOT_PASSWORD=minioadmin" \
        minio/minio server /data --console-address ":9001"

    echo "⏳ 等待 MinIO 启动..."
    sleep 3
else
    echo "✅ MinIO 已在运行"
fi

echo "🔍 MinIO 控制台: http://localhost:9001"
echo "   用户名: minioadmin"
echo "   密码: minioadmin"
echo ""

# 启动 Python 后端
echo "🐍 启动 Python 后端..."
python3 start.py
