# Nginx 反向代理配置文档

## 部署服务器: Alibaba Cloud ECS (47.111.177.153)
**配置日期**: 2025-11-04
**配置文件位置**: `/etc/nginx/sites-available/wfnb.cc`

---

## 完整配置

```nginx
server {
    listen 80;
    server_name wfnb.cc;
    client_max_body_size 50M;

    # 前端静态文件 - React 应用
    location / {
        root /opt/wangfeng-fan-website/frontend/dist;
        try_files $uri /index.html;
        expires 1d;
    }

    # 音乐文件目录 - 30天缓存
    location /music/ {
        alias /opt/wangfeng-fan-website/frontend/public/music/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 其他静态数据文件 - 7天缓存
    location /data/ {
        alias /opt/wangfeng-fan-website/frontend/public/data/;
        expires 7d;
    }

    # 图片目录 - 7天缓存
    location /images/ {
        alias /opt/wangfeng-fan-website/frontend/public/images/;
        expires 7d;
    }

    # 后端 API 反向代理
    # 关键: 使用 127.0.0.1 而非 localhost 以避免 IPv6 问题
    location /api/ {
        proxy_pass http://127.0.0.1:1994;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Gzip 压缩 - 加快加载速度
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss;
    gzip_min_length 1000;
}
```

---

## 关键配置详解

### 1. **后端代理配置** (最重要)
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:1994;
```

**为什么使用 `127.0.0.1` 而不是 `localhost`?**

- `localhost` 在现代 Linux 系统中会解析为 IPv6 地址 `[::1]`
- FastAPI 后端使用 `host="0.0.0.0"` 监听,默认只绑定 IPv4 (`0.0.0.0:1994`)
- 如果 Nginx 尝试连接到 IPv6 `[::1]:1994` 会失败,导致 502 Bad Gateway 错误
- **解决方案**: 明确指定 IPv4 地址 `127.0.0.1` 避免 DNS 解析歧义

### 2. **静态文件服务**
- **`/` (前端应用)**: React SPA 使用 `try_files $uri /index.html` 处理客户端路由
- **`/music/`**: 音乐文件设置 30 天过期,启用不可变缓存
- **`/data/`**: JSON 数据文件 7 天过期
- **`/images/`**: 图片资源 7 天过期

### 3. **代理头部设置**
```nginx
proxy_set_header Host $host;                     # 保持原始 Host
proxy_set_header X-Real-IP $remote_addr;        # 客户端真实 IP
proxy_set_header X-Forwarded-For ...;           # 代理链追踪
proxy_set_header X-Forwarded-Proto $scheme;     # 原始协议 (http/https)
```

### 4. **Gzip 压缩**
减少传输大小,提升加载速度:
- 文本、CSS、JSON、JavaScript 均启用压缩
- 最小压缩大小: 1000 字节

---

## 配置检查清单

### 启用新配置步骤:
```bash
# 1. 检查 Nginx 语法
sudo nginx -t

# 2. 重载配置 (不中断现有连接)
sudo systemctl reload nginx

# 3. 验证状态
sudo systemctl status nginx

# 4. 检查进程
ps aux | grep nginx | grep -v grep
```

### 验证配置是否生效:
```bash
# 直接测试后端
curl -s http://127.0.0.1:1994/api/articles/ | head -10

# 通过 Nginx 代理测试 (使用 Host header)
curl -s -H 'Host: wfnb.cc' http://127.0.0.1/api/articles/ | head -10

# 查看 Nginx 错误日志
tail -20 /var/log/nginx/error.log
```

---

## 常见问题排查

### 问题 1: 502 Bad Gateway
**原因**: Nginx 无法连接到后端
**检查**:
```bash
# 确认后端运行
ps aux | grep python3 | grep start.py

# 确认端口监听
ss -tlnp | grep 1994

# 测试直连
curl http://127.0.0.1:1994/api/articles/

# 查看错误日志
tail -20 /var/log/nginx/error.log
```

### 问题 2: 页面加载后 API 调用 502
**原因**: 浏览器缓存了旧配置
**解决**:
```bash
# 在浏览器: Ctrl+Shift+Delete (清除缓存)
# 或者 DevTools -> Application -> Clear storage

# 强制重载配置
sudo systemctl restart nginx
```

### 问题 3: IPv6 相关错误
**错误信息**: `connect() failed (111: Unknown error) while connecting to upstream, client: 127.0.0.1, upstream: "http://[::1]:1994..."`

**原因**: Nginx 尝试连接 IPv6 但后端仅监听 IPv4

**修复**: 确保 `proxy_pass http://127.0.0.1:1994;` (使用 IPv4)

---

## 后端服务相关信息

### FastAPI 启动配置 (`backend/start.py`)
```python
uvicorn.run(
    "app.main:app",
    host="0.0.0.0",        # 监听所有 IPv4 地址
    port=1994,             # 监听端口
    reload=True,           # 开发模式 (生产环境应为 False)
    log_level="info"
)
```

### 后端进程管理
```bash
# 启动
cd /opt/wangfeng-fan-website
nohup python3 backend/start.py > logs/backend.log 2>&1 &

# 停止
pkill -f 'python3.*start.py'

# 查看日志
tail -50 logs/backend.log
```

---

## 性能优化建议

### 1. HTTPS/SSL 配置 (生产环境必须)
```bash
# 使用 Let's Encrypt (免费)
sudo certbot --nginx -d wfnb.cc

# 自动更新证书
sudo systemctl enable certbot.timer
```

### 2. 连接数优化
```nginx
# 增加 worker 连接数
worker_connections 2048;

# HTTP 连接复用
keepalive_timeout 65;
```

### 3. 日志轮转
```bash
# 配置日志轮转 (/etc/logrotate.d/nginx)
/var/log/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
}
```

---

## 监控和维护

### 关键指标
- **Nginx 进程**: `ps aux | grep nginx`
- **端口状态**: `ss -tlnp | grep 80`
- **错误日志**: `tail -f /var/log/nginx/error.log`
- **访问日志**: `tail -f /var/log/nginx/access.log`

### 定期检查
```bash
# 每周检查
- 查看错误日志是否有异常
- 确认后端 API 响应正常
- 检查磁盘空间和日志大小

# 每月检查
- 更新 Nginx
- 审计安全配置
- 分析性能指标
```

---

## 相关文件位置

| 文件 | 位置 |
|-----|-----|
| Nginx 配置 | `/etc/nginx/sites-available/wfnb.cc` |
| 错误日志 | `/var/log/nginx/error.log` |
| 访问日志 | `/var/log/nginx/access.log` |
| 前端编译文件 | `/opt/wangfeng-fan-website/frontend/dist` |
| 后端代码 | `/opt/wangfeng-fan-website/backend` |
| 后端日志 | `/opt/wangfeng-fan-website/logs/backend.log` |

---

## 故障恢复步骤

若配置出现问题,按此步骤恢复:

1. **停止 Nginx**
   ```bash
   sudo systemctl stop nginx
   ```

2. **恢复备份配置** (如有)
   ```bash
   sudo cp /etc/nginx/sites-available/wfnb.cc.bak /etc/nginx/sites-available/wfnb.cc
   ```

3. **验证配置语法**
   ```bash
   sudo nginx -t
   ```

4. **启动 Nginx**
   ```bash
   sudo systemctl start nginx
   ```

5. **查看日志**
   ```bash
   sudo tail -50 /var/log/nginx/error.log
   ```

---

## 版本信息

- **Nginx**: 1.18+ (Ubuntu 22.04 LTS 内置)
- **后端**: FastAPI 0.104.1 (Python 3.10+)
- **前端**: React 18 + Vite
- **操作系统**: Ubuntu 22.04.5 LTS

---

---

## 最新诊断与解决方案 (2025-11-04)

### 用户报告: "还是502错误"

**诊断步骤**:
1. ✅ 后端进程检查 - 运行正常
2. ✅ 端口 1994 监听 - 确认监听
3. ✅ 直接 API 测试 - 返回数据正常
4. ✅ Nginx 配置审查 - proxy_pass 已使用 127.0.0.1
5. ⚠️ 用户报告仍有 502 - 可能是浏览器缓存

### 可能的原因与解决方案

**原因 1: 浏览器缓存 (最可能)**
- 浏览器缓存了之前的 502 错误页面
- **解决方案**:
  ```bash
  # Windows/Linux: Ctrl+Shift+Delete
  # Mac: Cmd+Shift+Delete
  # 选择"所有时间"，清除"缓存图片和文件"

  # 或强制刷新
  # Windows/Linux: Ctrl+F5
  # Mac: Cmd+Shift+R
  ```

**原因 2: Nginx 配置未重新加载**
- 修改了配置文件但未 reload
- **解决方案**:
  ```bash
  ssh root@47.111.177.153
  sudo nginx -t  # 验证配置语法
  sudo systemctl reload nginx  # 重新加载
  ```

**原因 3: DNS 缓存**
- 本地 DNS 缓存了旧的 IP 地址
- **解决方案**:
  ```bash
  # 清除系统 DNS 缓存
  ipconfig /flushdns  # Windows
  sudo dscacheutil -flushcache  # Mac
  sudo systemctl restart systemd-resolved  # Linux
  ```

**原因 4: 后端未正确启动**
- 数据库连接或其他错误导致后端无法运行
- **检查方法**:
  ```bash
  ssh root@47.111.177.153
  cd /opt/wangfeng-fan-website
  tail -50 logs/backend.log  # 查看完整错误
  ps aux | grep 'python3.*start.py'  # 确认进程
  ```

### 完整验证检查清单

```bash
# 1. 连接到服务器
ssh root@47.111.177.153

# 2. 检查后端进程
ps aux | grep 'python3.*start.py'

# 3. 测试后端直连
curl -s http://127.0.0.1:1994/api/articles/ | head -10

# 4. 检查 Nginx 配置
cat /etc/nginx/sites-available/wfnb.cc | grep -A 3 'location /api'

# 5. 验证 Nginx 语法
sudo nginx -t

# 6. 重新加载 Nginx
sudo systemctl reload nginx

# 7. 测试通过 Nginx 代理
curl -s -H 'Host: wfnb.cc' http://127.0.0.1/api/articles/ | head -10

# 8. 检查 Nginx 错误日志
tail -20 /var/log/nginx/error.log

# 9. 检查后端日志
tail -50 logs/backend.log | grep -E "ERROR|Exception|Traceback"
```

### 如果以上都不解决

**可能是更深层的问题，需要执行**:

```bash
# 1. 完全重启后端
cd /opt/wangfeng-fan-website
pkill -f 'python3.*start.py'
sleep 2
nohup python3 backend/start.py > logs/backend.log 2>&1 &
sleep 10

# 2. 检查后端日志中的错误
tail -100 logs/backend.log

# 3. 检查 MySQL 连接
mysql -u appuser -p1q3.102w -e "SELECT COUNT(*) FROM wangfeng_fan_website.articles;"

# 4. 检查防火墙
sudo ufw status
sudo ufw allow 1994/tcp  # 如果需要

# 5. 完全重启 Nginx
sudo systemctl restart nginx
```

---

**最后更新**: 2025-11-04 23:30
**维护人员**: 开发团队
**下次审核**: 2025-12-04
