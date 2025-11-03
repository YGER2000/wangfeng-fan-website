# Docker Compose 数据迁移与部署全流程指南

本文档详细介绍如何将本地的 MySQL 数据迁移到使用 Docker Compose 管理的容器环境中，并通过一条命令完成后端服务与数据库的启动。请严格按顺序执行，以避免数据丢失。

---

## 1. 准备工作

- 已在当前机器安装 Docker 与 Docker Compose（`docker compose version` 可正常输出版本号）。
- 本地 MySQL 正常运行，且可以通过 `mysqldump` 访问。
- 项目代码位于 `/Users/yger/WithFaith/wangfeng-fan-website`。
- 确保仓库根目录存在 `Dockerfile`（用于构建后端镜像）。

建议先确认以下命令输出无误：

```bash
docker --version
docker compose version
mysql --version
```

---

## 2. 备份本地 MySQL 数据

> **重要：** 在开始迁移前务必做好备份。如有条件，可保留多份备份并同步到异地存储。

1. 创建备份目录：

   ```bash
   cd /Users/yger/WithFaith/wangfeng-fan-website
   mkdir -p backups
   ```

2. 通过 `mysqldump` 导出数据库（根据实际库名调整，这里假设为 `wangfeng_fan_website`）：

   ```bash
   mysqldump -u root -p wangfeng_fan_website > backups/wangfeng_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

   运行后输入本地 MySQL root 密码。备份文件会生成在 `backups` 目录下。

3. 校验备份文件：

   ```bash
   ls -lh backups/
   head -n 20 backups/wangfeng_backup_*.sql
   ```

4. **可选**：为节省空间可压缩备份文件：

   ```bash
   gzip -k backups/wangfeng_backup_*.sql
   ```

---

## 3. 创建 Docker Compose 配置

本节将创建 `docker-compose.yml`，实现一条命令启动后端与 MySQL。

1. 在项目根目录创建用于持久化的目录：

   ```bash
   mkdir -p docker/mysql-data
   mkdir -p docker/frontend-public-images
   mkdir -p docker/backend-uploads
   cp -R frontend/public/images/. docker/frontend-public-images/     # 同步现有前端图片
   cp -R backend/uploads/. docker/backend-uploads/                   # 同步历史上传内容（若有）
   ```

2. 新建或覆盖 `docker-compose.yml`，内容如下（可用你喜欢的编辑器）：

   ```yaml
   services:
     mysql:
       image: mysql:8.0
       container_name: wangfeng-mysql
       environment:
         MYSQL_ROOT_PASSWORD: REPLACE_WITH_STRONG_PASSWORD
         MYSQL_DATABASE: wangfeng_fan_website
         MYSQL_CHARACTER_SET_SERVER: utf8mb4
         MYSQL_COLLATION_SERVER: utf8mb4_general_ci
       command: --default-authentication-plugin=mysql_native_password
       volumes:
         - ./docker/mysql-data:/var/lib/mysql
         - ./backups:/backups
       ports:
          - "33060:3306"                # 如需避免冲突，可改为 33060:3306
       restart: unless-stopped
   
     backend:
       build:
         context: .
         dockerfile: Dockerfile
       container_name: wangfeng-backend
       depends_on:
         - mysql
       env_file:
         - backend/.env
       ports:
         - "1994:1994"
       volumes:
         - ./docker/frontend-public-images:/app/frontend/public/images
         - ./docker/backend-uploads:/app/backend/uploads
         - ./data:/app/data:ro
       restart: unless-stopped
   
   networks:
     default:
       name: wangfeng-net
       driver: bridge
   ```

   > **提示：**
   > - 文中的 `REPLACE_WITH_STRONG_PASSWORD` 只是占位符，请统一替换为你设置的真实强密码。
   > - 若本机已运行其它 MySQL，可把 `3306:3306` 改成 `33060:3306`，并在后端 `.env` 中同步端口。

---

## 4. 配置后端环境变量

1. 复制后端环境变量模板：

   ```bash
   cp backend/.env.example backend/.env
   ```

2. 打开 `backend/.env`，至少修改以下关键配置（示例）：

   ```ini
   DATABASE_HOST=mysql
   DATABASE_PORT=3306
   DATABASE_USER=root
   DATABASE_PASSWORD=REPLACE_WITH_STRONG_PASSWORD
   DATABASE_NAME=wangfeng_fan_website
   
   DEBUG=False
   BACKEND_PORT=1994
   ```

   其它诸如 OSS、邮件等配置按实际环境填写。

---

## 5. 构建镜像并启动服务

在项目根目录执行：

```bash
docker compose build        # 首次建议显式构建，便于查看日志
docker compose up -d        # 后台启动所有服务
docker compose ps           # 确认容器状态
```

若需要查看实时日志：

```bash
docker compose logs -f
```

出现以下状态说明启动成功：

```
NAME               COMMAND                  SERVICE   STATUS      PORTS
wangfeng-mysql     "docker-entrypoint.s…"   mysql     running     0.0.0.0:3306->3306/tcp
wangfeng-backend   "uvicorn app.main:ap…"   backend   running     0.0.0.0:1994->1994/tcp
```

---

## 6. 导入备份数据到容器 MySQL

### 方式一：直接管道导入（推荐）

```bash
cat backups/wangfeng_backup_*.sql | docker compose exec -T mysql \
  mysql -u root -pREPLACE_WITH_STRONG_PASSWORD wangfeng_fan_website
```

>- `-T` 选项可以避免终端特殊字符导致报错。
>- 输入密码时注意不要泄露。

### 方式二：容器内导入

```bash
docker compose exec mysql bash
mysql -u root -p wangfeng_fan_website < /backups/wangfeng_backup_*.sql
exit
```

> 若采用方式二，请确认备份文件已经通过卷挂载出现在容器 `/backups` 目录中。

导入完成后，可执行：

```bash
docker compose exec mysql mysql -u root -p -e "USE wangfeng_fan_website; SHOW TABLES;"
```

验证表是否存在。

---

## 7. 验证部署结果

1. 检查后端健康状态：

   ```bash
   curl http://localhost:1994/health
   ```

   返回 `{"status":"healthy"}` 代表后端服务已启动。

2. 登录数据库检查数据：

   ```bash
   docker compose exec mysql mysql -u root -p wangfeng_fan_website
   SELECT COUNT(*) FROM articles;
   EXIT;
   ```

3. 若仍需联调前端，可在宿主机启用前端开发服务器，让其请求 `http://localhost:1994`。

---

## 8. 常见问题与处理

- **端口被占用**：如果 `3306` 或 `1994` 已被占用，修改 `docker-compose.yml` 中对应的宿主端口映射，并在前端或其它客户端中使用新的端口。
- **后端无法连接数据库**：确认 `.env` 中的 `DATABASE_HOST` 与 Compose 服务名一致（即 `mysql`），并确保两个容器处于同一网络（默认 `wangfeng-net`）。
- **导入数据报编码错误**：备份时请使用 `mysqldump` 默认的 UTF-8 设置，Compose 中已指定 `utf8mb4`。
- **上传文件丢失**：务必挂载 `frontend/public/images` 与 `backend/uploads` 目录；如需自定义路径，请同步修改 Compose 与后端代码。

---

## 9. 停止与清理

- 停止服务但保留数据：

  ```bash
  docker compose down
  ```

- 停止并删除容器、网络与数据卷：

  ```bash
  docker compose down --volumes
  ```

  **注意**：删除卷会清空 MySQL 数据，请谨慎操作。

---

完成以上步骤后，你已经拥有一个“一键启动”的 Docker Compose 环境，后端和 MySQL 将协同运行，并共享迁移后的数据。后续如果需要在服务器部署，只需复制仓库、填写 `.env`、放入备份并按照本文档操作即可快速恢复完整环境。*** End Patch
