#!/usr/bin/env python3
"""
启动脚本 - 汪峰粉丝网站 FastAPI 后端服务
"""

# ⚠️ 必须在导入任何应用模块前加载 .env，否则数据库连接会失败
from dotenv import load_dotenv
import os

# 加载 .env 文件 - 使用绝对路径，确保从 backend/ 目录加载
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

# 现在才导入应用模块，此时环境变量已加载
import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=1994,
        reload=True,
        log_level="info"
    )