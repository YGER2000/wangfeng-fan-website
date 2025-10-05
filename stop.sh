#!/bin/bash

# 汪峰粉丝网站 - 停止服务脚本

echo "🛑 停止汪峰粉丝网站服务..."
echo "================================"

# 停止前端
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "🎨 停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ 前端服务已停止"
    else
        echo "ℹ️  前端服务未运行"
    fi
    rm .frontend.pid
else
    # 尝试通过端口查找并停止
    echo "🔍 查找前端进程 (端口 1997)..."
    FRONTEND_PID=$(lsof -ti:1997)
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "🎨 停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ 前端服务已停止"
    else
        echo "ℹ️  前端服务未运行"
    fi
fi

# 停止后端
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "⚙️  停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null
        echo "✅ 后端服务已停止"
    else
        echo "ℹ️  后端服务未运行"
    fi
    rm .backend.pid
else
    # 尝试通过端口查找并停止
    echo "🔍 查找后端进程 (端口 1994)..."
    BACKEND_PID=$(lsof -ti:1994)
    if [ ! -z "$BACKEND_PID" ]; then
        echo "⚙️  停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null
        echo "✅ 后端服务已停止"
    else
        echo "ℹ️  后端服务未运行"
    fi
fi

echo ""
echo "✅ 所有服务已停止"
