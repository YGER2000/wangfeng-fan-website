# -*- coding: utf-8 -*-
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio

from .routers import auth, articles, schedules, admin, verification, profile, upload, videos, tags, gallery, games, reviews
from .models.article import Base as ArticleBase
from .models.user_db import Base as UserBase
from .models.admin_log import Base as AdminLogBase
from .models.schedule_db import Base as ScheduleBase
from .models.verification_code import Base as VerificationCodeBase
from .models.video import Base as VideoBase
from .models.tag_db import Base as TagBase
from .models.gallery_db import Base as GalleryBase
from .models.game import Base as GameBase
from .database import engine

# 创建所有数据库表
ArticleBase.metadata.create_all(bind=engine)
UserBase.metadata.create_all(bind=engine)
AdminLogBase.metadata.create_all(bind=engine)
ScheduleBase.metadata.create_all(bind=engine)
VerificationCodeBase.metadata.create_all(bind=engine)
VideoBase.metadata.create_all(bind=engine)
TagBase.metadata.create_all(bind=engine)
GalleryBase.metadata.create_all(bind=engine)
GameBase.metadata.create_all(bind=engine)

app = FastAPI(
    title="汪峰粉丝网站 API",
    description="汪峰粉丝网站后端API - MySQL版本",
    version="2.0.0"
)

# 增加请求体大小限制为 50MB（支持 Base64 图片）
@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    # 允许大请求体（50MB）
    max_size = 50 * 1024 * 1024  # 50 MB
    content_length = request.headers.get("content-length")

    if content_length and int(content_length) > max_size:
        return JSONResponse(
            status_code=413,
            content={"detail": f"请求体过大，最大允许 {max_size / 1024 / 1024} MB"}
        )

    response = await call_next(request)
    return response

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
app.include_router(articles.router)
app.include_router(schedules.router)
app.include_router(admin.router)  # 管理员路由
app.include_router(upload.router)  # 文件上传路由
app.include_router(videos.router)  # 视频管理路由
app.include_router(tags.router)  # 标签路由
app.include_router(gallery.router)  # 图片画廊路由
app.include_router(games.router)  # 游戏和投票路由
app.include_router(reviews.router)  # 审核路由


@app.get("/")
async def root():
    return {"message": "汪峰粉丝网站 API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
