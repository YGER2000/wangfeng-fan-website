#!/bin/bash

# 汪峰粉丝网站 - 一键启动脚本
# 同时启动前端和后端服务

set -e  # 遇到错误立即退出

echo "🚀 汪峰粉丝网站 - 一键启动"
echo "================================"

# 检查必要的命令
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ 错误: $1 未安装"
        echo "请先安装 $1"
        exit 1
    fi
}

echo "📋 检查依赖..."
check_command pnpm

# 初始化 conda
if [ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
    source "$HOME/miniconda3/etc/profile.d/conda.sh"
    echo "✅ Conda 已初始化"
else
    echo "❌ 错误: Conda 未安装或未找到"
    echo "请先安装 Miniconda"
    exit 1
fi

# 检查 MySQL
echo ""
echo "🔍 检查 MySQL 连接..."
if ! nc -z localhost 3306 2>/dev/null; then
    echo "⚠️  警告: MySQL 似乎没有运行在 localhost:3306"
    echo ""
    echo "请选择操作："
    echo "1) 启动 Docker MySQL (推荐)"
    echo "2) 我已经手动启动了 MySQL，继续"
    echo "3) 取消启动"
    read -p "请输入选项 (1-3): " choice

    case $choice in
        1)
            echo "🐳 启动 Docker MySQL..."
            docker run -d \
                --name mysql-wangfeng \
                -p 3306:3306 \
                -e MYSQL_ROOT_PASSWORD=123456 \
                -e MYSQL_DATABASE=wangfeng_fan_website \
                mysql:8.0
            echo "✅ MySQL 已启动"
            sleep 5  # 等待 MySQL 完全启动
            ;;
        2)
            echo "继续启动..."
            ;;
        3)
            echo "取消启动"
            exit 0
            ;;
        *)
            echo "无效选项，取消启动"
            exit 1
            ;;
    esac
else
    echo "✅ MySQL 已运行"
fi

# 创建日志目录
mkdir -p logs

echo ""
echo "================================"
echo "🎨 启动前端服务 (端口 1997)..."
echo "================================"

# 检查并杀掉占用 1997 端口的进程
if lsof -ti:1997 > /dev/null 2>&1; then
    echo "⚠️  端口 1997 已被占用，正在停止旧进程..."
    lsof -ti:1997 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

cd frontend

# 检查是否需要安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    pnpm install
fi

# 启动前端（后台运行）
echo "🚀 启动前端开发服务器..."
pnpm dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"
echo "   访问地址: http://localhost:1997"
echo "   日志文件: logs/frontend.log"

cd ..

echo ""
echo "================================"
echo "⚙️  启动后端服务 (端口 1994)..."
echo "================================"

# 检查并杀掉占用 1994 端口的进程
if lsof -ti:1994 > /dev/null 2>&1; then
    echo "⚠️  端口 1994 已被占用，正在停止旧进程..."
    lsof -ti:1994 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

cd backend

# 激活 conda 环境
echo "🐍 激活 conda 环境 (wangfeng-fan-website)..."
conda activate wangfeng-fan-website

# 检查是否需要安装依赖
if ! python -c "import fastapi" 2>/dev/null; then
    echo "📦 安装后端依赖..."
    pip install -r requirements.txt
else
    echo "✅ 后端依赖已安装"
fi

# 启动后端（后台运行）
echo "🚀 启动后端 API 服务器..."
python start.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
echo "   API 地址: http://localhost:1994"
echo "   API 文档: http://localhost:1994/docs"
echo "   日志文件: logs/backend.log"

cd ..

# 保存 PID 到文件
echo $FRONTEND_PID > .frontend.pid
echo $BACKEND_PID > .backend.pid

echo ""
echo "================================"
echo "✅ 所有服务已成功启动！"
echo "================================"
echo ""
echo "📍 服务地址："
echo "   前端: http://localhost:1997"
echo "   后端: http://localhost:1994"
echo "   API文档: http://localhost:1994/docs"
echo ""
echo "📋 管理命令："
echo "   查看前端日志: tail -f logs/frontend.log"
echo "   查看后端日志: tail -f logs/backend.log"
echo "   停止所有服务: ./stop.sh 或 ./clean.sh"
echo ""
echo "💡 提示: 按 Ctrl+C 不会停止后台服务，请使用 ./stop.sh 停止"
echo ""
