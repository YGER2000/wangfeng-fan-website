# 本地数据迁移到 Docker 部署指南

本文档将指导您如何将现有的本地数据库数据迁移到 Docker 环境，并使用 Docker Compose 部署整个应用。

---

## 📋 目录

1. [准备工作](#准备工作)
2. [备份本地数据](#备份本地数据)
3. [准备 Docker 环境](#准备-docker-环境)
4. [启动 Docker 服务](#启动-docker-服务)
5. [导入数据到 Docker MySQL](#导入数据到-docker-mysql)
6. [验证数据迁移](#验证数据迁移)
7. [切换到 Docker 部署](#切换到-docker-部署)
8. [常见问题](#常见问题)

---

## 准备工作

### 前置条件

- ✅ 本地 MySQL 数据库正常运行
- ✅ 已有数据需要迁移
- ✅ Docker 和 Docker Compose 已安装
- ✅ 项目代码在本地或服务器上

### 检查当前环境

```bash
# 检查本地 MySQL 是否运行
mysql --version

# 检查 Docker
docker --version
docker-compose --version

# 检查当前数据库
mysql -u root -p -e "SHOW DATABASES;"
```

---

## 备份本地数据

### 步骤 1: 导出完整数据库

```bash
# 进入项目目录
cd /Users/yger/WithFaith/wangfeng-fan-website

# 创建备份目录
mkdir -p backups

# 导出数据库（包括结构和数据）
mysqldump -u root -p wangfeng_fan_website > backups/wangfeng_backup_$(date +%Y%m%d_%H%M%S).sql

# 查看备份文件
ls -lh backups/
```

**重要提示：**
- 记住您的 MySQL root 密码
- 确保备份文件大小合理（不为 0）
- 建议保留多个备份副本

### 步骤 2: 验证备份文件

```bash
# 查看备份文件前 50 行，确认包含数据
head -n 50 backups/wangfeng_backup_*.sql

# 检查文件大小
du -h backups/wangfeng_backup_*.sql

# 压缩备份（可选，节省空间）
gzip -k backups/wangfeng_backup_*.sql
```

### 步骤 3: 备份 OSS 上传的图片路径（如果有）

如果您已经在本地上传了图片到 OSS，建议记录这些信息：

```bash
# 查询数据库中的 OSS 图片路径
mysql -u root -p wangfeng_fan_website -e "
SELECT id, title, cover_image FROM articles WHERE cover_image LIKE '%aliyuncs%' LIMIT 10;
SELECT id, name, images FROM gallery WHERE images LIKE '%aliyuncs%' LIMIT 10;
"
```

---

## 准备 Docker 环境

### 步骤 1: 检查 Docker Compose 配置

查看项目中的 Docker Compose 文件：

```bash
# 查看 Docker Compose 文件（可能是以下之一）
ls -la docker-compose*.yml

# 推荐使用 docker-compose.yml（如果存在）
cat docker-compose.yml

# 或使用 v3 版本
cat docker-compose.v3.yml
```

### 步骤 2: 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑后端环境变量
vim backend/.env
```

**关键配置项（backend/.env）：**

```env
# ==========================================
# 数据库配置（Docker 环境）
# ==========================================
DATABASE_URL=mysql+pymysql://root:YOUR_MYSQL_PASSWORD@mysql:3306/wangfeng_fan_website

# 注意：
# 1. 主机名使用 "mysql"（Docker Compose 服务名）
# 2. 密码需要与 docker-compose.yml 中的 MYSQL_ROOT_PASSWORD 一致

# ==========================================
# JWT 密钥（务必修改！）
# ==========================================
SECRET_KEY=your-super-secret-key-change-me-to-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ==========================================
# 阿里云 OSS 配置
# ==========================================
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET_NAME=wangfeng-fan-images
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_BASE_URL=https://wangfeng-fan-images.oss-cn-hangzhou.aliyuncs.com

# ==========================================
# 服务器配置
# ==========================================
HOST=0.0.0.0
PORT=1994
DEBUG=False
CORS_ORIGINS=["http://localhost:1997", "http://localhost", "http://your-domain.com"]
```

### 步骤 3: 配置 Docker Compose MySQL 密码

编辑 `docker-compose.yml`（或 `docker-compose.v3.yml`）：

```bash
vim docker-compose.yml
```

找到 MySQL 配置部分，设置与 `.env` 文件一致的密码：

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: wangfeng-mysql
    environment:
      MYSQL_ROOT_PASSWORD: YOUR_MYSQL_PASSWORD  # 改成与 .env 一致的密码
      MYSQL_DATABASE: wangfeng_fan_website
      MYSQL_CHARACTER_SET_SERVER: utf8mb4
      MYSQL_COLLATION_SERVER: utf8mb4_unicode_ci
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backups:/backups  # 挂载备份目录，方便导入数据
    ports:
      - "3306:3306"  # 可选：暴露端口便于外部访问
    networks:
      - wangfeng-network
    restart: unless-stopped

volumes:
  mysql_data:

networks:
  wangfeng-network:
    driver: bridge
```

**重要修改：**
1. `MYSQL_ROOT_PASSWORD` 改为您的强密码
2. 添加 `./backups:/backups` 卷挂载（方便导入数据）
3. 确保 `MYSQL_DATABASE` 为 `wangfeng_fan_website`

---

## 启动 Docker 服务

### 步骤 1: 停止本地 MySQL（避免端口冲突）

```bash
# macOS
brew services stop mysql

# Linux (systemd)
sudo systemctl stop mysql

# 或直接杀掉进程
sudo pkill mysqld

# 确认 3306 端口已释放
lsof -i :3306
# 应该没有输出
```

### 步骤 2: 启动 Docker Compose

```bash
# 进入项目目录
cd /Users/yger/WithFaith/wangfeng-fan-website

# 启动所有服务（首次启动会拉取镜像）
docker-compose up -d

# 或使用 v3 版本
docker-compose -f docker-compose.v3.yml up -d

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

**预期输出：**
```
NAME                COMMAND                  SERVICE   STATUS    PORTS
wangfeng-mysql      "docker-entrypoint.s…"   mysql     running   0.0.0.0:3306->3306/tcp
wangfeng-backend    "python3 start.py"       backend   running   0.0.0.0:1994->1994/tcp
```

### 步骤 3: 等待 MySQL 完全启动

```bash
# 查看 MySQL 日志，等待 "ready for connections" 出现
docker-compose logs mysql | grep "ready for connections"

# 或持续监控日志
docker-compose logs -f mysql
```

看到类似输出表示启动完成：
```
[Server] /usr/sbin/mysqld: ready for connections. Version: '8.0.xx'  socket: '/var/run/mysqld/mysqld.sock'  port: 3306
```

---

## 导入数据到 Docker MySQL

### 方式一：从宿主机导入（推荐）

```bash
# 1. 确认备份文件路径
ls -lh backups/wangfeng_backup_*.sql

# 2. 导入数据到 Docker MySQL
docker-compose exec -T mysql mysql -u root -pYOUR_MYSQL_PASSWORD wangfeng_fan_website < backups/wangfeng_backup_20250102_120000.sql

# 注意：
# - 替换 YOUR_MYSQL_PASSWORD 为实际密码
# - 替换备份文件名为实际文件名
# - -p 和密码之间没有空格

# 3. 查看导入进度（如果文件很大）
docker-compose exec mysql mysql -u root -pYOUR_MYSQL_PASSWORD -e "SHOW PROCESSLIST;"
```

### 方式二：进入容器内导入

```bash
# 1. 进入 MySQL 容器
docker-compose exec mysql bash

# 2. 在容器内导入（备份文件在 /backups 目录）
mysql -u root -p wangfeng_fan_website < /backups/wangfeng_backup_20250102_120000.sql
# 输入密码后等待导入完成

# 3. 退出容器
exit
```

### 方式三：使用 Docker cp（如果没有挂载 backups 目录）

```bash
# 1. 复制备份文件到容器内
docker cp backups/wangfeng_backup_20250102_120000.sql wangfeng-mysql:/tmp/backup.sql

# 2. 进入容器
docker-compose exec mysql bash

# 3. 导入数据
mysql -u root -p wangfeng_fan_website < /tmp/backup.sql

# 4. 退出容器
exit
```

---

## 验证数据迁移

### 步骤 1: 检查数据库表和数据

```bash
# 连接到 Docker MySQL
docker-compose exec mysql mysql -u root -pYOUR_MYSQL_PASSWORD wangfeng_fan_website

# 或不加密码参数，会提示输入
docker-compose exec mysql mysql -u root -p wangfeng_fan_website
```

在 MySQL 中执行：

```sql
-- 1. 查看所有表
SHOW TABLES;

-- 2. 检查表数据量
SELECT
    'articles' as table_name, COUNT(*) as count FROM articles
UNION ALL
SELECT 'schedules', COUNT(*) FROM schedules
UNION ALL
SELECT 'videos', COUNT(*) FROM videos
UNION ALL
SELECT 'gallery', COUNT(*) FROM gallery
UNION ALL
SELECT 'admins', COUNT(*) FROM admins
UNION ALL
SELECT 'tags', COUNT(*) FROM tags;

-- 3. 检查文章数据（前 5 条）
SELECT id, title, author, status, created_at FROM articles LIMIT 5;

-- 4. 检查管理员账号（确保可登录）
SELECT id, username, role, created_at FROM admins;

-- 5. 退出 MySQL
EXIT;
```

### 步骤 2: 测试后端 API

```bash
# 1. 检查后端容器日志
docker-compose logs backend

# 2. 测试健康检查端点
curl http://localhost:1994/health
curl http://localhost:1994/api/health

# 3. 测试数据接口
curl http://localhost:1994/api/articles | jq
curl http://localhost:1994/api/schedules | jq
curl http://localhost:1994/api/videos | jq

# 4. 测试管理员登录（替换为实际账号密码）
curl -X POST http://localhost:1994/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}'
```

### 步骤 3: 启动前端测试完整功能

```bash
# 进入前端目录
cd frontend

# 确保依赖已安装
pnpm install

# 启动开发服务器
pnpm dev

# 访问 http://localhost:1997
# 测试：
# - 前台页面显示（文章、视频、图廊、行程等）
# - 后台登录（http://localhost:1997/#/admin）
# - 后台功能（创建、编辑、审核等）
```

---

## 切换到 Docker 部署

### 方式一：开发环境（本地）

如果您在本地开发，可以保持以下配置：

```bash
# 1. Docker 运行后端和数据库
docker-compose up -d mysql backend

# 2. 本地运行前端（支持热重载）
cd frontend
pnpm dev

# 访问 http://localhost:1997
```

**优点：**
- 前端支持热重载，开发体验好
- 后端和数据库容器化，环境隔离

### 方式二：生产环境（服务器）

#### A. 构建前端并使用 Nginx

```bash
# 1. 构建前端
cd frontend
pnpm install
pnpm build

# 构建产物在 frontend/dist/

# 2. 配置 Nginx（参考 DEPLOYMENT_GUIDE.md）
sudo vim /etc/nginx/sites-available/wangfeng-fan-website

# 3. 启动 Docker 后端和数据库
docker-compose up -d mysql backend

# 4. 重启 Nginx
sudo systemctl reload nginx
```

#### B. 将前端也容器化（可选）

修改 `docker-compose.yml` 添加前端服务：

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: wangfeng-frontend
    ports:
      - "1997:80"
    depends_on:
      - backend
    networks:
      - wangfeng-network
    restart: unless-stopped
```

创建 `frontend/Dockerfile`：

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

# 生产阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

创建 `frontend/nginx.conf`：

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:1994/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

然后启动所有服务：

```bash
docker-compose up -d --build
```

---

## 常见问题

### 1. 导入数据时出现字符集错误

**错误信息：**
```
ERROR 1366: Incorrect string value: '\xE6\x96\x87\xE7\xAB\xA0' for column 'title'
```

**解决方法：**
```bash
# 方式 1: 导入时指定字符集
docker-compose exec -T mysql mysql -u root -p --default-character-set=utf8mb4 wangfeng_fan_website < backups/backup.sql

# 方式 2: 修改 MySQL 配置
docker-compose exec mysql mysql -u root -p -e "
ALTER DATABASE wangfeng_fan_website CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
"

# 然后重新导入
```

### 2. 容器启动后立即退出

**检查步骤：**
```bash
# 查看容器状态
docker-compose ps

# 查看容器日志
docker-compose logs backend
docker-compose logs mysql

# 常见原因：
# - 环境变量配置错误（.env 文件）
# - 数据库连接失败
# - 端口被占用
```

### 3. 数据导入后表为空

**检查步骤：**
```bash
# 1. 检查备份文件是否有数据
grep -i "INSERT INTO" backups/backup.sql | head -5

# 2. 检查导入时是否有错误
docker-compose logs mysql | grep ERROR

# 3. 重新导入并查看详细输出
docker-compose exec mysql mysql -u root -p wangfeng_fan_website < backups/backup.sql 2>&1 | tee import.log
```

### 4. 本地 MySQL 和 Docker MySQL 端口冲突

**解决方法：**
```bash
# 方式 1: 停止本地 MySQL（推荐）
brew services stop mysql  # macOS
sudo systemctl stop mysql  # Linux

# 方式 2: 修改 Docker MySQL 端口
# 在 docker-compose.yml 中修改：
ports:
  - "3307:3306"  # 改为 3307

# 然后修改 .env 中的 DATABASE_URL：
DATABASE_URL=mysql+pymysql://root:password@mysql:3306/wangfeng_fan_website
# 注意：容器内仍然是 3306，只是宿主机映射到 3307
```

### 5. 后端连接不到 MySQL

**错误信息：**
```
Can't connect to MySQL server on 'mysql'
```

**解决方法：**
```bash
# 1. 确认 MySQL 容器已启动
docker-compose ps mysql

# 2. 确认网络配置
docker network ls
docker network inspect wangfeng-fan-website_default

# 3. 检查 .env 配置
cat backend/.env | grep DATABASE_URL
# 确保主机名是 "mysql"（Docker Compose 服务名）

# 4. 重启后端容器
docker-compose restart backend
```

### 6. 图片路径问题（OSS）

如果数据库中有本地图片路径，需要迁移到 OSS：

```bash
# 1. 查询本地路径的图片
docker-compose exec mysql mysql -u root -p wangfeng_fan_website -e "
SELECT id, title, cover_image FROM articles WHERE cover_image NOT LIKE 'http%';
"

# 2. 手动上传图片到 OSS，然后更新数据库
# 3. 或使用脚本批量迁移（参考 IMAGE_UPLOAD_PLAN_A_IMPLEMENTATION.md）
```

### 7. Docker 容器数据持久化

**确保数据不丢失：**

```bash
# 1. 查看 Docker 卷
docker volume ls

# 2. 备份 Docker 卷数据
docker run --rm \
  -v wangfeng-fan-website_mysql_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/mysql_volume_backup.tar.gz /data

# 3. 恢复 Docker 卷数据
docker run --rm \
  -v wangfeng-fan-website_mysql_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/mysql_volume_backup.tar.gz -C /
```

---

## 部署检查清单

完成迁移后，请确认：

- [ ] 本地数据已成功导出备份（.sql 文件）
- [ ] Docker Compose 配置正确（环境变量、密码等）
- [ ] Docker 容器全部启动（`docker-compose ps` 查看）
- [ ] 数据已成功导入 Docker MySQL
- [ ] 数据库表和数据量正确
- [ ] 后端 API 正常响应（`curl http://localhost:1994/api/health`）
- [ ] 管理员账号可登录
- [ ] 前台页面显示正常（文章、视频、图廊等）
- [ ] 后台功能正常（创建、编辑、审核等）
- [ ] OSS 图片上传功能正常
- [ ] 数据库备份策略已设置

---

## 下一步：部署到阿里云

完成本地 Docker 迁移后，参考 `DEPLOYMENT_GUIDE.md` 部署到阿里云服务器：

1. 购买阿里云 ECS 和 OSS
2. 将代码和 Docker Compose 配置上传到服务器
3. 将备份文件上传到服务器
4. 按照本文档步骤在服务器上导入数据
5. 配置 Nginx 和 SSL 证书
6. 配置域名解析

---

## 总结

通过以上步骤，您已经成功将本地数据迁移到 Docker 环境。Docker 部署的优势：

✅ **环境隔离**：避免依赖冲突
✅ **易于迁移**：一键部署到任何服务器
✅ **易于维护**：统一的配置管理
✅ **易于扩展**：可随时添加新服务（Redis、Nginx 等）
✅ **数据持久化**：使用 Docker 卷保证数据安全

如有问题，请查看日志：
```bash
docker-compose logs -f
```

**祝迁移顺利！** 🚀
