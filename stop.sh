#!/bin/bash

# 汪峰粉丝网站 - 停止服务脚本

echo "🛑 停止汪峰粉丝网站服务..."
echo "================================"

# 停止前端
echo "🔍 查找前端进程 (端口 1997)..."
if lsof -ti:1997 > /dev/null 2>&1; then
    FRONTEND_PIDS=$(lsof -ti:1997)
    echo "🎨 停止前端服务 (PID: $FRONTEND_PIDS)..."
    lsof -ti:1997 | xargs kill -9 2>/dev/null
    echo "✅ 前端服务已停止"
else
    echo "ℹ️  前端服务未运行"
fi

# 清理 PID 文件
[ -f .frontend.pid ] && rm .frontend.pid

# 停止后端
echo "🔍 查找后端进程 (端口 1994)..."
if lsof -ti:1994 > /dev/null 2>&1; then
    BACKEND_PIDS=$(lsof -ti:1994)
    echo "⚙️  停止后端服务 (PID: $BACKEND_PIDS)..."
    lsof -ti:1994 | xargs kill -9 2>/dev/null
    echo "✅ 后端服务已停止"
else
    echo "ℹ️  后端服务未运行"
fi

# 清理 PID 文件
[ -f .backend.pid ] && rm .backend.pid

# 额外清理：查找所有相关的 Python 进程
echo ""
echo "🧹 清理遗留的 Python 后端进程..."
pkill -f "python.*start.py" 2>/dev/null && echo "✅ 已清理遗留进程" || echo "ℹ️  无遗留进程"

echo ""
echo "✅ 所有服务已停止"
