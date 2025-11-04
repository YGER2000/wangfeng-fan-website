# Docker 部署指南 - 汪峰粉丝网站

本指南说明如何使用 Docker 和 docker-compose 部署汪峰粉丝网站，包括前端、后端和 MySQL 数据库。

## 优化要点

### 关键改进

1. **音乐文件优化** - 音乐文件（10G+）不再打包进 Docker 镜像，而是通过 volume 挂载，减少镜像大小至 ~500MB
2. **多容器编排** - 使用 docker-compose 管理前端、后端、MySQL 和 Nginx 容器
3. **环境变量管理** - 敏感信息通过 `.env` 文件管理，不提交到 git
4. **自动健康检查** - 容器启动和运行状态自动验证

## 前提要求

- Docker >= 20.10
- Docker Compose >= 1.29
- 4GB+ 内存
- 40GB+ 存储空间

## 快速开始

### 1. 准备环境变量

```bash
# 从模板复制
cp backend/.env.example backend/.env

# 编辑 .env，配置以下信息
# DATABASE_PASSWORD=你的密码
# SECRET_KEY=你的密钥
# OSS_ACCESS_KEY_ID=阿里云ID
# OSS_ACCESS_KEY_SECRET=阿里云密钥
# OSS_BUCKET_NAME=你的bucket名
# OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
```

### 2. 构建镜像

```bash
# 构建前后端集成镜像
docker-compose build

# 查看镜像大小（应该在 500MB 左右，不包含 10G 音乐文件）
docker images | grep wangfeng
```

**预期输出：**
```
REPOSITORY                        TAG       IMAGE ID       SIZE
wangfeng-fan-website-backend      latest    xxxxx          ~500MB
mysql                             8.0       xxxxx          ~345MB
nginx                             alpine    xxxxx          ~40MB
```

### 3. 启动容器

```bash
# 启动所有服务
docker-compose up -d

# 查看容器状态
docker-compose ps

# 查看启动日志
docker-compose logs -f backend
```

**预期输出：**
```
NAME                    COMMAND                  STATE         PORTS
wangfeng-mysql         docker-entrypoint.s ...  Up            3306/tcp
wangfeng-backend       python3 backend/st ...   Up (healthy) 0.0.0.0:1994->1994/tcp
wangfeng-nginx         nginx -g daemon of ...   Up            0.0.0.0:80->80/tcp
```

### 4. 验证部署

```bash
# 测试后端 API
curl -s http://localhost:1994/api/articles | jq '.' | head -20

# 测试 Nginx 代理
curl -s -H 'Host: your-domain.com' http://localhost/ | head -20

# 查看后端日志
docker-compose logs backend

# 查看 MySQL 日志
docker-compose logs mysql
```

## 文件说明

### Dockerfile

优化的多阶段构建：

1. **前端构建阶段** (`frontend-builder`)
   - Node.js 20
   - pnpm 包管理
   - Vite 构建
   - 音乐文件排除（通过 `.dockerignore`）

2. **后端运行阶段** (`backend-runtime`)
   - Python 3.12 slim
   - FastAPI + SQLAlchemy
   - 系统依赖（Pillow、bcrypt 等）
   - 挂载点：`/app/frontend/public/music`

### docker-compose.yml

四个服务：

```yaml
services:
  mysql:       # MySQL 8.0 数据库
  backend:     # FastAPI 后端 + Uvicorn
  nginx:       # Nginx 反向代理
```

**关键 volumes：**
```yaml
volumes:
  # 音乐文件挂载（只读）
  - ./frontend/public/music:/app/frontend/public/music:ro
  # 数据文件挂载
  - ./frontend/public/data:/app/frontend/public/data:ro
  # MySQL 数据持久化
  - mysql-data:/var/lib/mysql
```

### .dockerignore

```
frontend/public/music     # 排除 10G 音乐文件
```

## 生产部署

### 使用 systemd 管理

创建 `/etc/systemd/system/wangfeng-docker.service`:

```ini
[Unit]
Description=Wangfeng Fan Website Docker Services
After=docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=/opt/wangfeng-fan-website
ExecStart=/usr/bin/docker-compose up
ExecStop=/usr/bin/docker-compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable wangfeng-docker.service
sudo systemctl start wangfeng-docker.service
sudo systemctl status wangfeng-docker.service
```

### SSL/HTTPS 配置

编辑 `nginx.conf` 添加 HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name wfnb.cc;

    ssl_certificate /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... 其他配置
}

# 重定向 HTTP 到 HTTPS
server {
    listen 80;
    server_name wfnb.cc;
    return 301 https://$server_name$request_uri;
}
```

在 docker-compose.yml 中挂载证书：
```yaml
nginx:
  volumes:
    - ./certs:/etc/nginx/certs:ro
```

### 资源限制

在 docker-compose.yml 中添加资源限制：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M
  mysql:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## 维护命令

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f mysql

# 查看最后 100 行日志
docker-compose logs --tail 100 backend
```

### 备份数据库

```bash
# 备份 MySQL 数据
docker-compose exec mysql mysqldump -u root -p${DATABASE_PASSWORD} \
  wangfeng_fan_website > backup-$(date +%Y%m%d-%H%M%S).sql

# 压缩备份
gzip backup-*.sql
```

### 恢复数据库

```bash
# 解压备份
gunzip backup-*.sql.gz

# 恢复数据
docker-compose exec -T mysql mysql -u root -p${DATABASE_PASSWORD} \
  wangfeng_fan_website < backup-*.sql
```

### 更新代码

```bash
# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose build

# 重启服务（自动使用新镜像）
docker-compose down
docker-compose up -d

# 验证更新
curl -s http://localhost:1994/api/articles | jq '.' | head -5
```

### 查看容器内文件

```bash
# 进入后端容器
docker-compose exec backend bash

# 查看项目目录
ls -la /app

# 查看音乐挂载
ls -la /app/frontend/public/music

# 退出容器
exit
```

## 常见问题

### Q: 为什么镜像这么小（~500MB）？

A: 因为音乐文件通过 Docker volume 挂载，不打包进镜像。这样可以：
- 快速更新代码和依赖，无需重新打包音乐
- 减少镜像大小，加快部署速度
- 灵活管理大文件，支持多个存储位置

### Q: 如何修改音乐文件位置？

A: 编辑 `docker-compose.yml`，修改 volumes 部分：

```yaml
backend:
  volumes:
    # 将 ./frontend/public/music 修改为你的实际路径
    - /data/music:/app/frontend/public/music:ro
```

### Q: 如何在容器外也能访问音乐文件？

A: 音乐文件在容器内可通过以下路径访问：
- Nginx: `/app/frontend/public/music/`
- FastAPI: `/app/frontend/public/music/`

确保 Nginx 配置中有：
```nginx
location /music/ {
    alias /app/frontend/public/music/;
}
```

### Q: MySQL 连接失败怎么办？

A: 检查以下几点：

```bash
# 1. 检查容器状态
docker-compose ps

# 2. 查看 MySQL 日志
docker-compose logs mysql

# 3. 进入容器测试连接
docker-compose exec mysql mysql -u root -p${DATABASE_PASSWORD} -e "SELECT 1;"

# 4. 查看后端日志
docker-compose logs backend | grep -i error
```

### Q: 如何增加 MySQL 内存？

A: 编辑 docker-compose.yml，修改 MySQL 环境变量：

```yaml
mysql:
  environment:
    MYSQL_MAX_ALLOWED_PACKET: 256M
    INNODB_BUFFER_POOL_SIZE: 1G
```

## 监控和告警

### 容器健康检查

Docker-compose.yml 已配置健康检查：

```bash
# 查看容器健康状态
docker-compose ps

# 查看详细的健康检查日志
docker inspect --format='{{json .State.Health}}' wangfeng-backend | jq '.'
```

### 日志监控

使用以下脚本定期检查日志：

```bash
#!/bin/bash
LOGDIR="/var/log/wangfeng"
mkdir -p $LOGDIR

docker-compose logs --since 1h > $LOGDIR/docker-$(date +%Y%m%d).log
tail -20 $LOGDIR/docker-$(date +%Y%m%d).log | grep -i error
```

## 性能优化

### 1. 数据库优化

```sql
-- 进入容器执行
docker-compose exec mysql mysql -u root -p${DATABASE_PASSWORD}

-- 创建索引
CREATE INDEX idx_article_status ON articles(status);
CREATE INDEX idx_article_created_at ON articles(created_at);

-- 优化表
OPTIMIZE TABLE articles;
```

### 2. Nginx 缓存优化

```nginx
# 在 Nginx 配置中添加缓存
location / {
    # 缓存静态资源 1 天
    expires 1d;
    add_header Cache-Control "public, immutable";
}

location /api/ {
    # API 不缓存
    proxy_pass http://backend_api;
    add_header Cache-Control "no-cache";
}
```

### 3. 启用 Gzip 压缩

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

## 调试技巧

### 进入容器交互式 shell

```bash
# 进入后端容器
docker-compose exec backend bash

# 进入 MySQL 容器
docker-compose exec mysql bash

# 进入 Nginx 容器
docker-compose exec nginx sh
```

### 实时监控资源使用

```bash
# 查看 CPU 和内存使用
docker stats

# 查看容器网络
docker network ls
docker network inspect wangfeng-fan-website_wangfeng-network
```

### 查看容器配置

```bash
# 查看完整的容器启动配置
docker-compose config

# 查看容器网络连接
docker-compose exec backend netstat -tlnp
```

## 回滚和恢复

### 回滚到上个版本

```bash
# 查看镜像历史
docker image ls wangfeng-fan-website-backend

# 使用特定镜像启动
docker-compose down
docker-compose up -d --build
```

### 快速恢复

```bash
# 停止所有容器，保留数据
docker-compose down

# 重新启动（数据不丢失）
docker-compose up -d
```

## 安全建议

1. **不提交 `.env` 文件** - 包含敏感信息
2. **使用强密码** - DATABASE_PASSWORD 和 SECRET_KEY
3. **定期备份** - 至少每周备份一次
4. **启用 HTTPS** - 生产环境必须使用 SSL
5. **限制容器权限** - 使用非 root 用户运行
6. **定期更新** - 及时更新 Docker 镜像和依赖

## 相关文档

- [Dockerfile 详解](Dockerfile)
- [docker-compose.yml 详解](docker-compose.yml)
- [.dockerignore 详解](.dockerignore)
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 原始部署指南
- [NGINX_CONFIG.md](NGINX_CONFIG.md) - Nginx 配置指南

## 支持和反馈

如遇问题，请：
1. 查看容器日志：`docker-compose logs -f`
2. 检查环境变量：`docker-compose config`
3. 测试网络连接：`docker network inspect`
4. 提交 issue：https://github.com/your-repo/issues
