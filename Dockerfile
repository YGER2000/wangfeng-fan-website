# syntax=docker/dockerfile:1

########################################
# 前端构建阶段
########################################
FROM node:20-bullseye-slim AS frontend-builder

WORKDIR /workspace/frontend

# 安装构建依赖
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# 启用 pnpm 并安装依赖
COPY frontend/pnpm-lock.yaml frontend/package.json ./
RUN corepack enable \
    && corepack prepare pnpm@8.15.8 --activate \
    && pnpm install --frozen-lockfile

# 构建产物（排除 public/music，通过 .dockerignore 自动处理）
COPY frontend/ ./
RUN pnpm build


########################################
# 后端运行阶段
########################################
FROM python:3.12-slim AS backend-runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PROJECT_ROOT=/app

# 安装系统依赖（用于 Pillow、bcrypt、cryptography 等）
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libjpeg-dev \
        zlib1g-dev \
        libssl-dev \
        libffi-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码（不含 .env 文件）
COPY backend/ ./backend/

# 复制前端静态资源（不含 public/music - 通过 volume 挂载）
COPY --from=frontend-builder /workspace/frontend/dist ./frontend/dist

# 为 public/data 和 public/images 创建占位符目录
# 音乐文件通过 Docker volume 挂载，在启动时映射到这里
RUN mkdir -p frontend/public/data frontend/public/images

# 拷贝前端其他公共资源（不包括音乐）
COPY frontend/public/data ./frontend/public/data 2>/dev/null || true
COPY frontend/public/images ./frontend/public/images 2>/dev/null || true

# 暴露后端端口
EXPOSE 1994

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:1994/health || exit 1

# 启动后端服务
# 确保从正确的工作目录执行，使 .env 加载成功
CMD ["python3", "backend/start.py"]
