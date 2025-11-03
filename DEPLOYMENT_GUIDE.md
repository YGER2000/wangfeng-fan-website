# 网站部署到阿里云服务器指南

本文档将指导您如何将汪峰粉丝网站部署到阿里云服务器上。

## 准备工作

### 1. 阿里云服务器准备
**推荐配置：**
- **实例规格**: 2核4GB（ecs.t6-c1m2.large 或以上）
- **操作系统**: Ubuntu 22.04 LTS（推荐，兼容性最好）
- **系统盘**: 40GB ESSD云盘
- **带宽**: 5Mbps 或以上（按使用流量计费更经济）
- **地域**: 选择离目标用户最近的区域（如华北/华东）

**安全组配置**（在ECS控制台 → 安全组 → 配置规则）：
| 协议 | 端口 | 授权对象 | 用途 |
|------|------|----------|------|
| TCP | 22 | 你的IP/0.0.0.0/0 | SSH远程连接 |
| TCP | 80 | 0.0.0.0/0 | HTTP访问 |
| TCP | 443 | 0.0.0.0/0 | HTTPS访问 |
| TCP | 3306 | 127.0.0.1/32 | MySQL（仅本机，不对外开放）|

**⚠️ 重要安全提示：**
- 不要开放 1994/1997 端口到公网（将通过 Nginx 反向代理访问）
- 不要开放 3306 端口到公网（数据库仅限本地访问）

### 2. 域名准备（推荐）
如果您有域名（推荐用于正式上线）：
1. 在阿里云购买域名或使用已有域名
2. 域名需要完成 ICP 备案（国内服务器强制要求）
3. 在阿里云 DNS 控制台添加解析记录：
   - 记录类型：A
   - 主机记录：`@` 或 `www`
   - 记录值：你的服务器公网 IP
   - TTL：10分钟

如果暂时没有域名：
- 可直接使用服务器公网 IP 访问（适合测试）
- 后续可随时添加域名

### 3. 阿里云 OSS 准备（必须）
本项目使用阿里云 OSS 存储图片：

1. **开通 OSS 服务**：
   - 访问 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
   - 创建 Bucket，配置如下：
     - 名称：如 `wangfeng-fan-images`
     - 地域：与 ECS 同地域（节省流量费用）
     - 读写权限：公共读（允许互联网匿名访问）
     - 存储类型：标准存储

2. **创建 AccessKey**：
   - 访问 [RAM 访问控制](https://ram.console.aliyun.com/users)
   - 创建子用户，勾选"编程访问"
   - 授予 `AliyunOSSFullAccess` 权限
   - 记录 `AccessKeyId` 和 `AccessKeySecret`（后续配置需要）

3. **配置跨域规则**（如需前端直传）：
   - OSS Bucket 设置 → 权限管理 → 跨域设置 → 创建规则
   - 允许来源：`*` 或你的域名
   - 允许方法：GET, POST, PUT, DELETE, HEAD
   - 允许 Headers：`*`

### 4. 本地环境准备（非必须）
如果需要在本地构建后上传：
- Git（用于克隆代码）
- Node.js 18+ 和 pnpm（用于构建前端）
- Python 3.11+（用于打包后端）

如果直接在服务器上构建，可跳过此步骤。

## 服务器环境搭建

### 1. 连接到服务器
使用阿里云提供的公网 IP 连接：
```bash
# 方式1: 使用密码登录（首次）
ssh root@你的服务器公网IP

# 方式2: 使用密钥登录（更安全，推荐）
ssh -i ~/.ssh/your-key.pem root@你的服务器公网IP
```

**首次登录建议**：
```bash
# 修改 root 密码
passwd

# 创建普通用户（推荐）
adduser deploy
usermod -aG sudo deploy
```

### 2. 更新系统并安装基础工具
```bash
# 更新软件包列表
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y git curl wget vim ufw
```

### 3. 配置防火墙（Ubuntu UFW）
```bash
# 启用防火墙
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# 检查状态
sudo ufw status
```

### 4. 安装 Docker 和 Docker Compose（推荐方式）
使用 Docker 可简化环境配置：

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | bash

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 5. 安装 Nginx
```bash
sudo apt install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

### 6. 安装 Node.js 和 pnpm（如需在服务器构建前端）
```bash
# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
sudo npm install -g pnpm

# 验证安装
node --version
pnpm --version
```

### 7. 安装 Python 3.11+
```bash
# Ubuntu 22.04 默认自带 Python 3.10，升级到 3.11
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# 设置默认 Python 版本（可选）
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# 验证安装
python3 --version
```

## 项目部署步骤

### 方式一：使用 Docker Compose 部署（推荐）

#### 1. 克隆项目代码
```bash
# 创建项目目录
sudo mkdir -p /opt/wangfeng-fan-website
cd /opt/wangfeng-fan-website

# 克隆代码（替换为你的仓库地址）
git clone https://github.com/你的用户名/wangfeng-fan-website.git .
```

#### 2. 配置环境变量
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑后端环境变量
sudo vim backend/.env
```

**后端 .env 配置示例：**
```env
# 数据库配置
DATABASE_URL=mysql+pymysql://root:你的MySQL密码@mysql:3306/wangfeng_fan_website

# JWT 密钥（用于管理员登录，务必修改为随机字符串）
SECRET_KEY=your-super-secret-key-change-me
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 阿里云 OSS 配置（从 OSS 控制台获取）
OSS_ACCESS_KEY_ID=你的AccessKeyId
OSS_ACCESS_KEY_SECRET=你的AccessKeySecret
OSS_BUCKET_NAME=wangfeng-fan-images
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com  # 改为你的地域
OSS_BASE_URL=https://wangfeng-fan-images.oss-cn-hangzhou.aliyuncs.com

# 服务器配置
HOST=0.0.0.0
PORT=1994
DEBUG=False
```

#### 3. 配置 MySQL 密码
编辑 `docker-compose.yml`（或 `docker-compose.v3.yml`）：
```bash
sudo vim docker-compose.yml
```

找到 MySQL 配置部分，修改密码：
```yaml
  mysql:
    environment:
      MYSQL_ROOT_PASSWORD: 你的强密码  # 修改这里
      MYSQL_DATABASE: wangfeng_fan_website
```

#### 4. 构建并启动容器
```bash
# 使用 Docker Compose 启动所有服务
docker-compose up -d

# 或者使用 v3 版本（如果存在）
docker-compose -f docker-compose.v3.yml up -d

# 查看日志
docker-compose logs -f

# 检查容器状态
docker-compose ps
```

#### 5. 初始化数据库
```bash
# 进入后端容器
docker-compose exec backend bash

# 运行数据库迁移（如果有 Alembic）
alembic upgrade head

# 或者直接运行 Python 脚本初始化
python3 -c "from app.database import init_db; init_db()"

# 退出容器
exit
```

#### 6. 创建管理员账号
```bash
# 进入后端容器
docker-compose exec backend bash

# 运行创建管理员脚本（根据项目实际情况）
python3 scripts/create_admin.py

# 或手动通过 API 创建
exit
```

---

### 方式二：传统方式部署（不使用 Docker）

#### 1. 克隆项目代码
```bash
sudo mkdir -p /opt/wangfeng-fan-website
cd /opt/wangfeng-fan-website
git clone https://github.com/你的用户名/wangfeng-fan-website.git .
```

#### 2. 安装和配置 MySQL
```bash
# 安装 MySQL
sudo apt install -y mysql-server

# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 运行安全配置（设置 root 密码等）
sudo mysql_secure_installation

# 创建数据库
sudo mysql -u root -p
```

在 MySQL 中执行：
```sql
CREATE DATABASE wangfeng_fan_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wangfeng_user'@'localhost' IDENTIFIED BY '你的数据库密码';
GRANT ALL PRIVILEGES ON wangfeng_fan_website.* TO 'wangfeng_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. 配置后端环境
```bash
cd /opt/wangfeng-fan-website/backend

# 创建 Python 虚拟环境
python3.11 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install --upgrade pip
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
vim .env  # 参考 Docker 方式的配置
```

#### 4. 初始化数据库
```bash
# 在虚拟环境中
python3 start.py  # 或运行迁移脚本
```

#### 5. 构建前端
```bash
cd /opt/wangfeng-fan-website/frontend

# 安装依赖
pnpm install

# 构建生产版本
pnpm build

# 构建产物在 frontend/dist/ 目录
```

---

## Nginx 配置（两种方式都需要）

### 6. 配置 Nginx 反向代理
创建 Nginx 站点配置文件：
```bash
sudo vim /etc/nginx/sites-available/wangfeng-fan-website
```

**配置内容：**
```nginx
# 前端和后端服务器配置
upstream backend_api {
    server 127.0.0.1:1994;  # Docker 方式用 localhost，传统方式也是 localhost
}

# HTTP 服务器（正式上线后可重定向到 HTTPS）
server {
    listen 80;
    server_name 你的域名.com www.你的域名.com;  # 或使用服务器 IP

    # 客户端上传文件大小限制（用于图片上传）
    client_max_body_size 50M;

    # 前端静态文件
    location / {
        root /opt/wangfeng-fan-website/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        # 静态资源缓存
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 7d;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://backend_api/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 后端管理员登录
    location /admin-api/ {
        proxy_pass http://backend_api/admin-api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 健康检查端点
    location /health {
        proxy_pass http://backend_api/health;
        access_log off;
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
}
```

**启用配置：**
```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/wangfeng-fan-website /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

### 7. 配置 SSL 证书（推荐，生产环境必须）
使用 Let's Encrypt 免费 SSL 证书：

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 自动配置 SSL（会自动修改 Nginx 配置）
sudo certbot --nginx -d 你的域名.com -d www.你的域名.com

# 测试自动续期
sudo certbot renew --dry-run
```

Certbot 会自动：
1. 申请 SSL 证书
2. 修改 Nginx 配置，添加 HTTPS (443 端口)
3. 设置 HTTP 到 HTTPS 的重定向
4. 配置自动续期任务

---

## 配置服务自启动（传统方式需要）

如果使用 Docker Compose，服务会自动随 Docker 启动。如果使用传统方式，需要配置 systemd 服务。

### 8. 创建后端 systemd 服务
```bash
sudo vim /etc/systemd/system/wangfeng-backend.service
```

**服务配置：**
```ini
[Unit]
Description=Wangfeng Fan Website Backend Service
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/wangfeng-fan-website/backend
Environment="PATH=/opt/wangfeng-fan-website/backend/venv/bin"
ExecStart=/opt/wangfeng-fan-website/backend/venv/bin/python3 start.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/wangfeng-backend.log
StandardError=append:/var/log/wangfeng-backend.log

[Install]
WantedBy=multi-user.target
```

**启动服务：**
```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动后端服务
sudo systemctl start wangfeng-backend

# 设置开机自启
sudo systemctl enable wangfeng-backend

# 查看服务状态
sudo systemctl status wangfeng-backend

# 查看日志
sudo tail -f /var/log/wangfeng-backend.log
```

---

## 验证部署

### 9. 测试服务是否正常
```bash
# 1. 测试后端 API
curl http://localhost:1994/api/health
# 应返回: {"status": "ok"} 或类似响应

# 2. 测试 Nginx 代理
curl http://localhost/api/health

# 3. 测试前端静态文件
curl -I http://localhost/
# 应返回 200 OK

# 4. 测试公网访问（如果配置了域名）
curl http://你的域名.com/
curl https://你的域名.com/  # 如果配置了 SSL
```

### 10. 访问管理后台
打开浏览器访问：
- 前台：`http://你的域名.com/` 或 `http://服务器IP/`
- 后台：`http://你的域名.com/#/admin` 或 `http://服务器IP/#/admin`

---

## 后续维护操作

### 更新代码
```bash
cd /opt/wangfeng-fan-website

# 拉取最新代码
git pull origin main

# Docker 方式：重新构建和启动
docker-compose down
docker-compose up -d --build

# 传统方式：
# 1. 更新后端
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart wangfeng-backend

# 2. 更新前端
cd ../frontend
pnpm install
pnpm build
sudo systemctl reload nginx
```

### 查看服务状态
```bash
# Docker 方式
docker-compose ps
docker-compose logs -f backend
docker-compose logs -f mysql

# 传统方式
sudo systemctl status wangfeng-backend
sudo systemctl status nginx
sudo systemctl status mysql

# 查看日志
sudo tail -f /var/log/wangfeng-backend.log
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 数据库备份
```bash
# Docker 方式
docker-compose exec mysql mysqldump -u root -p wangfeng_fan_website > backup-$(date +%Y%m%d-%H%M%S).sql

# 传统方式
mysqldump -u root -p wangfeng_fan_website > backup-$(date +%Y%m%d-%H%M%S).sql

# 压缩备份
gzip backup-*.sql

# 定期备份（添加到 crontab）
sudo crontab -e
# 添加：每天凌晨 3 点备份
0 3 * * * mysqldump -u root -p你的密码 wangfeng_fan_website | gzip > /opt/backups/db-$(date +\%Y\%m\%d).sql.gz
```

### 数据库恢复
```bash
# Docker 方式
docker-compose exec -T mysql mysql -u root -p wangfeng_fan_website < backup.sql

# 传统方式
mysql -u root -p wangfeng_fan_website < backup.sql

# 如果是压缩文件
gunzip < backup.sql.gz | mysql -u root -p wangfeng_fan_website
```

---

## 常见问题排查

### 1. 后端服务无法启动
```bash
# 检查端口占用
sudo lsof -i :1994
sudo netstat -tulpn | grep 1994

# 检查 Python 虚拟环境
source /opt/wangfeng-fan-website/backend/venv/bin/activate
python3 --version

# 检查环境变量
cat /opt/wangfeng-fan-website/backend/.env

# 手动启动查看错误
cd /opt/wangfeng-fan-website/backend
source venv/bin/activate
python3 start.py
```

### 2. 数据库连接失败
```bash
# 检查 MySQL 是否运行
sudo systemctl status mysql

# 测试数据库连接
mysql -u root -p
SHOW DATABASES;
USE wangfeng_fan_website;
SHOW TABLES;

# 检查用户权限
SELECT user, host FROM mysql.user;
```

### 3. Nginx 502 Bad Gateway
```bash
# 检查后端是否运行
sudo systemctl status wangfeng-backend
curl http://localhost:1994/api/health

# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 检查 SELinux（CentOS/RHEL）
sudo setenforce 0  # 临时关闭测试
```

### 4. 前端页面空白
```bash
# 检查前端构建产物
ls -la /opt/wangfeng-fan-website/frontend/dist/

# 检查 Nginx 配置的 root 路径
sudo cat /etc/nginx/sites-enabled/wangfeng-fan-website | grep root

# 检查文件权限
sudo chown -R www-data:www-data /opt/wangfeng-fan-website/frontend/dist/
sudo chmod -R 755 /opt/wangfeng-fan-website/frontend/dist/
```

### 5. OSS 图片上传失败
```bash
# 检查 OSS 配置
cat /opt/wangfeng-fan-website/backend/.env | grep OSS

# 测试 OSS 连接（Python）
python3 << 'EOF'
import oss2
auth = oss2.Auth('你的AccessKeyId', '你的AccessKeySecret')
bucket = oss2.Bucket(auth, '你的Endpoint', '你的BucketName')
print(bucket.list_objects().object_list)
EOF

# 检查网络连通性
ping oss-cn-hangzhou.aliyuncs.com
```

### 6. 权限问题
```bash
# 修改项目目录权限
sudo chown -R www-data:www-data /opt/wangfeng-fan-website
sudo chmod -R 755 /opt/wangfeng-fan-website

# 或使用特定用户（如 deploy）
sudo chown -R deploy:deploy /opt/wangfeng-fan-website
```

---

## 性能优化建议

### 1. 启用 Redis 缓存（可选）
```bash
# 安装 Redis
sudo apt install -y redis-server

# 启动 Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 在后端 .env 中配置
REDIS_URL=redis://localhost:6379/0
```

### 2. 配置 Nginx 缓存
在 Nginx 配置中添加：
```nginx
# 在 http 块中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

# 在 location /api/ 中添加
proxy_cache api_cache;
proxy_cache_valid 200 5m;
proxy_cache_key "$scheme$request_method$host$request_uri";
```

### 3. 开启 HTTP/2（需要 SSL）
在 Nginx HTTPS server 块中：
```nginx
listen 443 ssl http2;
```

### 4. 数据库优化
```sql
-- 添加索引（根据实际查询需求）
CREATE INDEX idx_article_status ON articles(status);
CREATE INDEX idx_article_created_at ON articles(created_at);
CREATE INDEX idx_schedule_date ON schedules(schedule_date);
```

---

## 安全加固建议

1. **SSH 安全**：
   ```bash
   # 禁用 root 登录（使用普通用户 + sudo）
   sudo vim /etc/ssh/sshd_config
   # PermitRootLogin no
   sudo systemctl restart sshd

   # 修改 SSH 端口（可选）
   # Port 2222
   ```

2. **数据库安全**：
   - 不要开放 3306 端口到公网
   - 使用强密码
   - 定期备份

3. **环境变量保护**：
   ```bash
   sudo chmod 600 /opt/wangfeng-fan-website/backend/.env
   ```

4. **定期更新**：
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

5. **日志监控**：
   - 定期检查 `/var/log/auth.log`（SSH 登录）
   - 监控 Nginx 日志异常请求
   - 使用 fail2ban 防止暴力破解

---

## 部署检查清单

部署完成后，请确认以下事项：

- [ ] 服务器安全组规则配置正确（仅开放 22/80/443）
- [ ] OSS Bucket 已创建并配置公共读权限
- [ ] 环境变量已正确配置（尤其是 OSS 和数据库）
- [ ] MySQL 数据库已创建并初始化
- [ ] 后端服务正常运行（`curl http://localhost:1994/api/health`）
- [ ] Nginx 配置正确并已重载
- [ ] 前端静态文件可访问（`curl http://localhost/`）
- [ ] SSL 证书已配置（生产环境）
- [ ] 管理员账号已创建
- [ ] 数据库备份策略已设置
- [ ] 日志轮转已配置
- [ ] 监控告警已配置（可选）

---

## 联系和支持

如有问题，请检查：
1. 项目 GitHub Issues
2. 后端日志：`/var/log/wangfeng-backend.log`
3. Nginx 日志：`/var/log/nginx/error.log`
4. 系统日志：`journalctl -u wangfeng-backend -f`

**祝部署顺利！** 🎉