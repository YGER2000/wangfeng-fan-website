# 🐳 Docker 完整部署指南

## 📋 项目架构

整个项目已完全 Docker 化，包含：

```
┌─────────────────────────────────────────────────────┐
│                   用户访问                          │
│                     ↓                               │
│              前端 (Nginx + React)                   │
│                  端口: 80                           │
│                     ↓                               │
│              后端 (FastAPI)                         │
│                  端口: 1994                         │
│                     ↓                               │
│   ┌─────────────────┴──────────────────┐           │
│   ↓                                     ↓           │
│ MySQL 数据库                      阿里云 OSS        │
│ 端口: 3306                        (图片存储)        │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 1. 配置环境变量

```bash
# 在项目根目录
cp .env.example .env

# 编辑 .env，填入你的真实配置
vim .env
```

**必须配置的项目**：
```bash
# OSS 配置（从阿里云控制台获取）
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_ACCESS_KEY=LTAI5tXXXXXXXXXXXXXX
OSS_SECRET_KEY=YourSecretKeyXXXXXXXXXX
OSS_BUCKET=wangfeng-fan-website

# JWT 密钥（随机生成，至少 32 字符）
SECRET_KEY=your-super-secret-key-min-32-chars

# MySQL 密码（建议修改）
MYSQL_ROOT_PASSWORD=your-strong-password
```

### 2. 启动所有服务

```bash
# 第一次启动（构建镜像）
docker-compose up -d --build

# 后续启动（使用已构建的镜像）
docker-compose up -d
```

**启动过程**（约 3-5 分钟）：
1. ⏳ 下载 MySQL、Node、Python 基础镜像
2. 🏗️ 构建前端和后端镜像
3. 🗄️ 初始化 MySQL 数据库
4. ✅ 启动所有服务

### 3. 验证部署

```bash
# 查看所有容器状态
docker-compose ps

# 应该看到 3 个服务都是 Up (healthy)
NAME                 STATUS
wangfeng-mysql       Up (healthy)
wangfeng-backend     Up (healthy)
wangfeng-frontend    Up (healthy)
```

### 4. 访问应用

- **前端**: http://localhost
- **备用端口**: http://localhost:1997
- **后端 API**: http://localhost:1994
- **健康检查**: http://localhost:1994/health

---

## 📝 常用命令

### 启动和停止

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务（保留数据）
docker-compose down

# 停止并删除所有数据（危险！）
docker-compose down -v

# 重启单个服务
docker-compose restart backend
docker-compose restart frontend
docker-compose restart mysql
```

### 查看日志

```bash
# 查看所有日志
docker-compose logs -f

# 查看单个服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# 查看最近 100 行日志
docker-compose logs --tail=100 backend
```

### 进入容器

```bash
# 进入后端容器
docker-compose exec backend bash

# 进入 MySQL 容器
docker-compose exec mysql bash

# 在后端容器执行命令
docker-compose exec backend python -c "print('Hello')"
```

### 数据库操作

```bash
# 连接 MySQL
docker-compose exec mysql mysql -u root -p

# 导出数据库
docker-compose exec mysql mysqldump -u root -p wangfeng_fan_db > backup.sql

# 导入数据库
docker-compose exec -T mysql mysql -u root -p wangfeng_fan_db < backup.sql
```

### 更新代码

```bash
# 修改代码后，重新构建并重启
docker-compose up -d --build

# 只重新构建某个服务
docker-compose build backend
docker-compose up -d backend
```

---

## 🔧 开发模式 vs 生产模式

### 开发模式（推荐本地使用）

如果需要热重载，可以挂载代码目录：

**修改 `docker-compose.yml`**：

```yaml
# 在 backend 服务下添加
volumes:
  - ./backend:/app
  - /app/.venv  # 排除虚拟环境

# 在 frontend 服务下改为开发服务器
command: pnpm run dev --host 0.0.0.0
```

这样修改代码后会自动重新加载。

### 生产模式（阿里云部署）

当前配置已经是生产模式：
- ✅ 前端使用 Nginx 提供静态文件
- ✅ 多阶段构建优化镜像大小
- ✅ 健康检查自动重启
- ✅ 数据持久化

---

## ☁️ 部署到阿里云 ECS

### 1. 购买阿里云 ECS

- **配置建议**: 2核4G（¥80/月起）
- **镜像**: CentOS 8 或 Ubuntu 22.04
- **带宽**: 5Mbps 以上

### 2. 安装 Docker

```bash
# 在 ECS 上执行
# CentOS
sudo yum install -y docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Ubuntu
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

### 3. 上传代码

```bash
# 方式一：使用 Git
ssh root@your-ecs-ip
git clone https://github.com/your-repo/wangfeng-fan-website.git
cd wangfeng-fan-website

# 方式二：使用 scp
scp -r ./wangfeng-fan-website root@your-ecs-ip:/root/
```

### 4. 配置环境变量

```bash
# 在 ECS 上
cd wangfeng-fan-website
cp .env.example .env
vim .env

# ⚠️ 重要：使用内网 Endpoint（更快更便宜）
OSS_ENDPOINT=oss-cn-hangzhou-internal.aliyuncs.com
```

### 5. 启动服务

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志确认启动成功
docker-compose logs -f
```

### 6. 配置域名（可选）

如果你有域名：

1. **添加 DNS 记录**：
   - A 记录：`yourdomain.com` → ECS 公网 IP

2. **配置 Nginx**：
   修改 `frontend/nginx.conf`，添加你的域名

3. **配置 HTTPS**（推荐）：
   ```bash
   # 使用 Let's Encrypt 免费证书
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 🔍 故障排查

### 问题 1: 后端无法连接 MySQL

**症状**: 后端日志显示 "Can't connect to MySQL server"

**解决**:
```bash
# 检查 MySQL 是否健康
docker-compose ps mysql

# 如果不健康，查看日志
docker-compose logs mysql

# 重启 MySQL
docker-compose restart mysql

# 等待 MySQL 完全启动（约 30 秒）
docker-compose logs -f mysql
```

### 问题 2: 前端无法访问后端 API

**症状**: 前端显示网络错误

**解决**:
```bash
# 检查后端是否运行
docker-compose logs backend

# 测试后端健康检查
curl http://localhost:1994/health

# 检查网络连接
docker-compose exec frontend ping backend
```

### 问题 3: OSS 上传失败

**症状**: 图片上传失败，403 错误

**解决**:
1. 检查 OSS 配置是否正确
2. 确认 Bucket 权限为"公共读"
3. 查看后端日志：
   ```bash
   docker-compose logs backend | grep OSS
   ```

### 问题 4: 镜像构建失败

**症状**: `docker-compose up` 报错

**解决**:
```bash
# 清理旧镜像和缓存
docker-compose down
docker system prune -a

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 监控和维护

### 资源使用情况

```bash
# 查看容器资源占用
docker stats

# 查看磁盘使用
docker system df
```

### 数据备份

```bash
# 备份 MySQL 数据
docker-compose exec mysql mysqldump -u root -p wangfeng_fan_db > backup_$(date +%Y%m%d).sql

# 定时备份（添加到 crontab）
0 2 * * * cd /root/wangfeng-fan-website && docker-compose exec -T mysql mysqldump -u root -pwangfeng123456 wangfeng_fan_db > /root/backups/backup_$(date +\%Y\%m\%d).sql
```

### 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并重启
docker-compose up -d --build

# 查看是否成功
docker-compose ps
```

---

## 💰 成本估算

### 阿里云 ECS + OSS 方案

| 项目 | 配置 | 费用 |
|------|------|------|
| ECS 云服务器 | 2核4G | ¥80/月 |
| 带宽 | 5Mbps | 包含在 ECS |
| OSS 存储 | 10GB 图片 | ¥1.2/月 |
| OSS 流量 | 100GB/月 | ¥12/月 |
| MySQL | 自建在 ECS | 免费 |
| **总计** | | **约 ¥95/月** |

**优化建议**：
- ✅ 开启 OSS CDN 加速（流量费用降低 50%）
- ✅ 使用内网 Endpoint（OSS 流量免费）
- ✅ 压缩图片到 1MB（代码已实现）

---

## 🎯 下一步

1. ✅ **本地测试**: 确保所有功能正常
2. ✅ **配置 OSS**: 在阿里云控制台创建 Bucket
3. ✅ **购买 ECS**: 选择合适的配置
4. ✅ **部署上线**: 使用 Docker Compose 一键部署
5. ⏭️ **配置域名和 HTTPS**（可选）
6. ⏭️ **配置 CDN 加速**（可选）
7. ⏭️ **设置自动备份**

---

## 📚 相关文档

- [Docker Compose 官方文档](https://docs.docker.com/compose/)
- [阿里云 ECS 文档](https://help.aliyun.com/product/25365.html)
- [阿里云 OSS 文档](https://help.aliyun.com/product/31815.html)
- [Nginx 配置指南](https://nginx.org/en/docs/)

## 🆘 需要帮助？

如果遇到问题，请提供以下信息：

```bash
# 容器状态
docker-compose ps

# 完整日志
docker-compose logs > logs.txt

# 系统信息
docker version
docker-compose version
uname -a
```
