# 使用 Docker 迁移 MySQL 数据并部署项目

本文档指导你将本地 MySQL 中的数据迁移到 Docker 容器里的 MySQL，再使用仓库根目录的 `Dockerfile` 构建并运行后端服务。

---

## 1. 前置条件

- 已安装 Docker（推荐同时安装 Docker Compose，虽然本指南用 `docker` 命令示范）
- 能够在本地通过 `mysqldump` 访问当前的 MySQL 数据库
- 仓库代码已更新到最新，并位于项目根目录（`/Users/yger/WithFaith/wangfeng-fan-website`）

建议先确认版本：

```bash
docker --version
docker compose version   # 如果已安装，可选
mysql --version
```

---

## 2. 备份本地 MySQL 数据库

1. 创建备份目录：

   ```bash
   cd /Users/yger/WithFaith/wangfeng-fan-website
   mkdir -p backups
   ```

2. 使用 `mysqldump` 导出现有数据库（以 `wangfeng_fan_website` 为例，根据实际库名调整）：

   ```bash
   mysqldump -u root -p wangfeng_fan_website > backups/wangfeng_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

   运行命令后输入本地 MySQL 的 root 密码。备份文件会生成在 `backups/` 目录。

3. 快速校验备份文件：

   ```bash
   ls -lh backups/
   head -n 20 backups/wangfeng_backup_*.sql
   ```

   **可选**：压缩备份节省空间。

   ```bash
   gzip -k backups/wangfeng_backup_*.sql
   ```

---

## 3. 在 Docker 中准备 MySQL 并导入数据

1. 创建 Docker 网络，方便后端容器与数据库互联：

   ```bash
   docker network create wangfeng-net
   ```

   若命令提示网络已存在，可忽略。

2. 准备数据持久化目录并启动 MySQL 容器：

   ```bash
   mkdir -p docker/mysql-data
   docker run -d \
     --name wangfeng-mysql \
     --hostname wangfeng-mysql \
     --network wangfeng-net \
     -p 3306:3306 \
     -v $(pwd)/docker/mysql-data:/var/lib/mysql \
     -e MYSQL_ROOT_PASSWORD=你的强密码 \
     -e MYSQL_DATABASE=wangfeng_fan_website \
     -e MYSQL_CHARACTER_SET_SERVER=utf8mb4 \
     -e MYSQL_COLLATION_SERVER=utf8mb4_general_ci \
     mysql:8.0 --default-authentication-plugin=mysql_native_password
   ```

   > 将 `你的强密码` 替换为真实密码，后续还要写入 `.env`。

3. 等待 MySQL 容器初始化，可以通过日志确认：

   ```bash
   docker logs -f wangfeng-mysql
   ```

   看到 `ready for connections` 后按 `Ctrl+C` 退出日志跟踪。

4. 导入刚才的备份（任选一种方式）：

   **方法 A：通过管道直接导入**

   ```bash
   cat backups/wangfeng_backup_*.sql | docker exec -i wangfeng-mysql \
     mysql -u root -p wangfeng_fan_website
   ```

   终端提示输入密码，输入启动容器时设置的 `MYSQL_ROOT_PASSWORD`。

   **方法 B：先复制文件再导入**

   ```bash
   docker cp backups/wangfeng_backup_*.sql wangfeng-mysql:/tmp/wangfeng_backup.sql
   docker exec -i wangfeng-mysql mysql -u root -p wangfeng_fan_website < /tmp/wangfeng_backup.sql
   ```

5. 验证数据是否导入成功：

   ```bash
   docker exec -it wangfeng-mysql mysql -u root -p -e "USE wangfeng_fan_website; SHOW TABLES;"
   ```

---

## 4. 准备后端环境变量

1. 复制环境变量模板并修改：

   ```bash
   cp backend/.env.example backend/.env
   ```

2. 编辑 `backend/.env`，至少修改以下关键项（确保指向容器里的 MySQL）：

   ```ini
   DATABASE_HOST=wangfeng-mysql
   DATABASE_PORT=3306
   DATABASE_USER=root
   DATABASE_PASSWORD=你的强密码       # 与 MYSQL_ROOT_PASSWORD 保持一致
   DATABASE_NAME=wangfeng_fan_website
   DEBUG=False
   BACKEND_PORT=1994
   ```

   根据需要补充 OSS、邮件等其他配置。

---

## 5. 使用仓库根目录 Dockerfile 构建并运行后端

1. 确保项目根目录存在 `Dockerfile`（本次已经生成）。

2. 构建镜像（在项目根目录执行）：

   ```bash
   docker build -t wangfeng-backend:latest .
   ```

3. 为静态资源和上传内容准备宿主机目录，以便持久化：

   ```bash
   mkdir -p docker/frontend-public-images
   mkdir -p docker/backend-uploads
   cp -R frontend/public/images/. docker/frontend-public-images/     # 保留现有图片
   cp -R backend/uploads/. docker/backend-uploads/                   # 如有历史上传文件
   ```

4. 启动后端容器并加入同一网络：

   ```bash
   docker run -d \
     --name wangfeng-backend \
     --network wangfeng-net \
     --env-file backend/.env \
     -p 1994:1994 \
     -v $(pwd)/docker/frontend-public-images:/app/frontend/public/images \
     -v $(pwd)/docker/backend-uploads:/app/backend/uploads \
     wangfeng-backend:latest
   ```

   如需访问本地 `data/` 目录的脚本或其他资源，也可以额外挂载：`-v $(pwd)/data:/app/data`.

5. 查看容器日志确认启动成功：

   ```bash
   docker logs -f wangfeng-backend
   ```

   看到 `Application startup complete` 或 `Uvicorn running on` 表示服务已启动。

---

## 6. 验证服务与数据

1. 访问后端健康检查：

   ```
   http://localhost:1994/health
   ```

   应返回 `{"status": "healthy"}`。

2. 登录 MySQL 容器确认数据行数、编码等：

   ```bash
   docker exec -it wangfeng-mysql mysql -u root -p -e "SELECT COUNT(*) FROM wangfeng_fan_website.articles;"
   ```

3. 若有前端部署需求，可将 `frontend/dist` 上传到静态资源服务或额外制作 Nginx 容器。后端接口已可直接使用。

---

## 7. 常见问题与排查

- **容器无法连接数据库**：确认 `backend/.env` 中的 `DATABASE_HOST` 与 docker 网络名一致，并确保两个容器都加入 `wangfeng-net`。
- **数据缺失或乱码**：导入时务必设置 `utf8mb4`，且检查原库导出时的字符集。
- **图片上传后丢失**：请确认挂载了 `frontend/public/images` 与 `backend/uploads`，否则容器销毁后会丢失。
- **端口占用**：若本机已有 MySQL 或后端服务占用端口，可修改 `-p` 映射，比如 `-p 33060:3306` 或 `-p 81994:1994`，同时更新前端访问地址。

完成以上步骤后，你已经将本地数据库安全迁移到 Docker，并使用容器化的后端服务连接新数据库环境。后续可以根据需要编写 `docker-compose.yml` 将 MySQL、后端、前端统一编排。
