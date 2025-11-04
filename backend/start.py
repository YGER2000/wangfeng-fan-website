#!/usr/bin/env python3
"""
启动脚本 - 汪峰粉丝网站 FastAPI 后端服务
"""

from dotenv import load_dotenv
import os
import uvicorn
from app.main import app

# 加载 .env 文件 - 使用绝对路径，确保从 backend/ 目录加载
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=1994,
        reload=True,
        log_level="info"
    )