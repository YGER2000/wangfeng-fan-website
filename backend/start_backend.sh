#!/bin/bash

# 汪峰粉丝网站后端启动脚本

echo "正在启动汪峰粉丝网站后端服务..."

# 检查 Python 版本
python3 --version

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "创建 Python 虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "安装 Python 依赖..."
pip install -r requirements.txt

# 检查 MySQL 连接
echo "检查 MySQL 连接..."
if ! nc -z localhost 3306; then
    echo "警告: MySQL 似乎没有运行在 localhost:3306"
    echo "请确保 MySQL 正在运行，或使用以下命令启动 Docker MySQL:"
    echo "docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 -e MYSQL_DATABASE=wangfeng_fan_website --name mysql mysql:8.0"
fi

# 启动 FastAPI 服务器
echo "启动 FastAPI 服务器..."
echo "API 文档将在 http://localhost:1994/docs 可用"
echo "按 Ctrl+C 停止服务器"

python run.py