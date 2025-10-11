# -*- coding: utf-8 -*-
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, comments, likes, articles, schedules, admin, verification, profile
from .models.article import Base as ArticleBase
from .models.user_db import Base as UserBase
from .models.admin_log import Base as AdminLogBase
from .models.schedule_db import Base as ScheduleBase
from .models.verification_code import Base as VerificationCodeBase
from .database import engine

# 创建所有数据库表
ArticleBase.metadata.create_all(bind=engine)
UserBase.metadata.create_all(bind=engine)
AdminLogBase.metadata.create_all(bind=engine)
ScheduleBase.metadata.create_all(bind=engine)
VerificationCodeBase.metadata.create_all(bind=engine)

app = FastAPI(
    title="汪峰粉丝网站 API",
    description="汪峰粉丝网站后端API - MySQL版本",
    version="2.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1997", "http://127.0.0.1:1997",
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175"
    ],  # 前端地址 - 主要使用 1997 端口
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)
app.include_router(verification.router)  # 验证码路由
app.include_router(profile.router)  # 个人中心路由
app.include_router(comments.router)
app.include_router(likes.router)
app.include_router(articles.router)
app.include_router(schedules.router)
app.include_router(admin.router)  # 管理员路由


@app.get("/")
async def root():
    return {"message": "汪峰粉丝网站 API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
