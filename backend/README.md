# 汪峰粉丝网站后端 API

FastAPI + MySQL 实现的认证系统后端服务。

## 功能特性

- ✅ 用户注册和登录
- ✅ JWT 令牌认证
- ✅ 密码加密存储 (bcrypt)
- ✅ MySQL 数据存储
- ✅ CORS 支持
- ✅ API 文档 (Swagger/OpenAPI)
- ✅ 文章管理（CRUD）
- ✅ 评论系统
- ✅ 点赞功能

## 技术栈

- **FastAPI** - 现代高性能 Web 框架
- **MySQL** - 关系型数据库
- **SQLAlchemy** - Python ORM
- **PyMySQL** - MySQL 驱动
- **JWT** - JSON Web Token 认证
- **Pydantic** - 数据验证和序列化
- **BCrypt** - 密码哈希算法

## 快速开始

### 前置要求

1. Python 3.8+
2. MySQL 8.0+ (本地安装或 Docker)

### 启动 MySQL (Docker)

```bash
docker run -d \
  --name mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=wangfeng_fan_website \
  mysql:8.0
```

### 启动后端服务

```bash
# 使用启动脚本
./start_backend.sh

# 或手动启动
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

### 访问 API 文档

服务启动后，可以通过以下地址访问 API 文档：

- Swagger UI: http://localhost:1994/docs
- ReDoc: http://localhost:1994/redoc

## API 端点

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/token` - OAuth2 兼容登录
- `GET /api/auth/me` - 获取当前用户信息

### 文章相关

- `GET /api/articles` - 获取文章列表
- `POST /api/articles` - 创建文章
- `GET /api/articles/{id}` - 获取文章详情
- `PUT /api/articles/{id}` - 更新文章
- `DELETE /api/articles/{id}` - 删除文章

### 评论相关

- `GET /api/comments` - 获取评论列表
- `POST /api/comments` - 创建评论
- `DELETE /api/comments/{id}` - 删除评论

### 点赞相关

- `POST /api/likes` - 点赞/取消点赞
- `GET /api/likes/{article_id}` - 获取文章点赞数

### 健康检查

- `GET /` - 根路径
- `GET /health` - 健康检查

## 配置说明

### 环境变量 (.env)

```env
# MySQL 数据库配置
DATABASE_USER=root
DATABASE_PASSWORD=123456
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=wangfeng_fan_website

# JWT 配置
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 数据库结构

项目使用 SQLAlchemy ORM，表结构会自动创建。

#### users 表

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### articles 表

```sql
CREATE TABLE articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author_id INT,
  slug VARCHAR(200) UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);
```

## 开发说明

### 项目结构

```
backend/
├── app/
│   ├── core/           # 核心配置和工具
│   │   ├── config.py   # 应用配置
│   │   ├── security.py # 安全工具
│   │   └── dependencies.py # 依赖注入
│   ├── models/         # SQLAlchemy 数据模型
│   │   ├── user_db.py  # 用户模型
│   │   └── article.py  # 文章模型
│   ├── schemas/        # Pydantic 模式
│   │   ├── user.py     # 用户模式
│   │   └── article.py  # 文章模式
│   ├── services/       # 业务逻辑
│   │   └── user_service_mysql.py # 用户服务
│   ├── routers/        # API 路由
│   │   ├── auth.py     # 认证路由
│   │   ├── articles.py # 文章路由
│   │   ├── comments.py # 评论路由
│   │   └── likes.py    # 点赞路由
│   ├── database.py     # MySQL 数据库连接
│   └── main.py         # FastAPI 应用入口
├── requirements.txt    # Python 依赖
├── .env               # 环境变量
├── run.py             # 启动脚本
└── start_backend.sh   # Shell 启动脚本
```

### 添加新功能

1. 在 `models/` 中定义 SQLAlchemy 数据模型
2. 在 `schemas/` 中定义 Pydantic API 模式
3. 在 `services/` 中实现业务逻辑
4. 在 `routers/` 中定义 API 端点
5. 在 `main.py` 中注册新路由

## 部署说明

### 生产环境配置

1. 修改 `.env` 文件中的 `SECRET_KEY`
2. 配置生产环境 MySQL
3. 设置合适的 CORS 策略
4. 使用 HTTPS

### Docker 部署

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 1994

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "1994"]
```

## 故障排除

### 常见问题

1. **MySQL 连接失败**
   - 确保 MySQL 正在运行
   - 检查连接字符串和密码
   - 确认防火墙设置
   - 检查 MySQL 用户权限

2. **认证失败**
   - 检查 JWT 密钥配置
   - 确认令牌有效期设置
   - 验证用户凭据

3. **CORS 错误**
   - 检查前端 URL 是否在 CORS 白名单中
   - 确认请求头设置正确

4. **数据库表未创建**
   - 确保 `main.py` 中有 `Base.metadata.create_all(bind=engine)`
   - 检查 MySQL 用户是否有建表权限

## 许可证

本项目仅供学习和演示使用。
