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

# 构建产物
COPY frontend/ ./
RUN pnpm build


########################################
# 后端运行阶段
########################################
FROM python:3.12-slim AS backend-runtime

WORKDIR /app/backend

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

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
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# 复制后端代码
COPY backend/ /app/backend/

# 复制前端资源，确保后台服务能够访问到静态文件目录
COPY --from=frontend-builder /workspace/frontend/dist /app/frontend/dist

# 设置项目根目录环境变量，方便脚本使用
ENV PROJECT_ROOT=/app

# 暴露后端端口
EXPOSE 1994

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:1994/health || exit 1

# 启动后端服务
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "1994"]
