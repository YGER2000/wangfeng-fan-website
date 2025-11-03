# CLAUDE.md

此文件为 Claude Code 在本仓库工作时提供指导。

**重要提示**: 永远用中文和用户交流。Always communicate with the user in Chinese.

## ⚠️ 重要：采取行动前必读

**采取任何修改前必须先检查 `docs/` 文件夹**：
- `docs/行程信息实现方案.md` - Schedule/Tour dates system implementation
- `docs/TAG_SYSTEM_GUIDE.md` - Tag system implementation guide
- `docs/用户登录系统方案.md` - User login system design
- `docs/LIGHT_MODE_DESIGN_GUIDE.md` - Light mode design specifications

这些文档包含了**权威的实现细节**，以下情况必须先查看：
1. 做出架构决策前
2. 实现新功能前
3. 修改现有系统前
4. 理解数据结构和 API 前

**最佳实践**: 遇到陌生代码或系统时，先阅读相关文档，理解设计理由，避免引入不一致。

## 项目概览

汪峰粉丝网站 - 基于 React + FastAPI 的粉丝网站，展示汪峰音乐、唱片目录、巡演日期和个人介绍。

## 项目结构

```
wangfeng-fan-website/
├── docs/                  # 📚 项目文档 (务必先阅读！)
│   ├── 行程信息实现方案.md  # Schedule/Tour system architecture
│   ├── TAG_SYSTEM_GUIDE.md # Tag system implementation
│   ├── 用户登录系统方案.md  # User login system design
│   └── LIGHT_MODE_DESIGN_GUIDE.md # UI light mode specs
├── frontend/              # 前端应用 (React 18 + Vite)
│   ├── src/              # React 源代码
│   │   ├── components/   # 页面和 UI 组件
│   │   ├── contexts/     # React Context (MusicContext)
│   │   ├── utils/        # API 调用和工具函数
│   │   └── services/     # 后端 API 集成
│   ├── public/           # 静态资源
│   │   ├── data/         # JSON 数据文件 (albums.json 等)
│   │   ├── music/        # 音乐文件目录
│   │   └── images/       # 图片资源
│   └── package.json      # 前端依赖
├── backend/              # 后端应用 (FastAPI + MySQL)
│   ├── app/             # 后端代码
│   │   ├── models/      # SQLAlchemy 数据库模型
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── routers/     # API 路由
│   │   ├── services/    # 业务逻辑层
│   │   └── main.py      # FastAPI 应用入口
│   ├── requirements.txt  # Python 依赖
│   ├── start.py         # 启动脚本
│   ├── .env.example     # 环境变量模板
│   └── Dockerfile       # 后端 Docker 配置 (已集成到根目录 Dockerfile)
├── Dockerfile           # 前后端集成 Docker 配置
├── DEPLOYMENT_GUIDE.md  # 部署指南 (Ubuntu + Docker)
└── .dockerignore        # Docker 构建忽略文件
```

## 开发命令

### 前端开发
**重要**: 所有前端命令必须从 `frontend/` 目录运行：
```bash
cd frontend
pnpm dev          # 启动开发服务器 (port 1997)
pnpm build        # 构建生产版本
pnpm lint         # 运行 ESLint
pnpm preview      # 预览生产版本
npx tsc --noEmit  # TypeScript 类型检查
```

### 后端开发
```bash
cd backend
python3 start.py  # 启动 FastAPI 服务器 (port 1994)
```

**后端技术栈:**
- **框架**: FastAPI 0.104.1
- **数据库**: MySQL (SQLAlchemy 2.0 ORM)
- **存储**: Minio/S3 兼容 API (支持阿里云 OSS、MinIO、Cloudflare R2)
- **图片处理**: Pillow 11.0
- **认证**: JWT (bcrypt 密码加密)
- **API 基础 URL**: `http://localhost:1994/api`

### 开发服务器配置
- 前端: Vite + React 18
- 前端开发服务器: `http://localhost:1997`
- 后端开发服务器: `http://localhost:1994`
- 热重载启用，Host 配置为 `0.0.0.0` 允许外部连接

## 架构

### 核心技术栈

**前端:**
- **React 18** with TypeScript
- **Vite** 构建工具
- **React Router** (HashRouter) 客户端路由
- **Tailwind CSS** + 自定义汪峰紫色主题
- **Framer Motion** 动画库

**后端:**
- **FastAPI** 轻量级 REST API 框架
- **SQLAlchemy 2.0** ORM
- **MySQL 8.0** 数据持久化
- **Pydantic** 数据验证
- **JWT** 管理员认证
- **Minio SDK** 对象存储集成
- **Pillow** 图片处理

### 数据库架构

**核心表:**
- `articles` - 文章和资讯
- `schedules` - 巡演日期和活动信息
- `videos` - 视频档案元数据
- `admins` - 管理员账户
- `tags` - 内容标签
- `article_tags` - 文章-标签多对多关系
- `galleries` - 图组信息
- `photos` - 图片
- `games` - 游戏和投票

**设计原则:**
1. **Schedule System**: 完全 MySQL 存储，包含审核发布流程
2. **Tag System**: 规范化标签存储，支持多对多关系
3. **Category System**: 双层分类 (主类 + 子类)
4. **Slug Generation**: 自动生成 URL 友好的 slug

### 音乐系统 (核心功能)

**MusicContext** (`frontend/src/contexts/MusicContext.tsx`):
- 全局音乐播放状态管理
- 4 种播放模式: 顺序播放、全部循环、随机、单曲循环
- 歌单管理与 Fisher-Yates 随机算法
- Web Audio API 集成及错误处理
- 歌曲富化系统 (自动添加专辑封面)

**MusicPlayer** (`frontend/src/components/ui/MusicPlayer.tsx`):
- 持久化音乐播放器 (固定底部)
- 可折叠/可展开界面
- 进度条、音量控制、播放模式切换

**数据结构** (`frontend/public/data/albums.json`):
```typescript
interface Song {
  id: string;
  title: string;
  album: string;
  filePath: string;  // 相对于 /public/music/
  duration?: number;
  coverImage?: string;
}

interface Album {
  id: string;
  name: string;
  coverImage?: string;
  songs: Song[];
  year?: string;
  type?: 'album' | 'live' | 'remaster' | 'other';
}
```

### 页面组件

**前台页面** (`frontend/src/components/pages/`):
- **Home**: 首页 + 精选内容
- **Discography**: 专辑浏览 (分类: 专辑/Live/新编/其他)
- **TourDates**: 演唱会时间表 (分类过滤 + 时间线 + 详情模态框)
- **Gallery**: 图片画廊
- **Biography**: 艺人传记 + 职业生涯时间线
- **Awards**: 奖项展示
- **News**: 新闻和资讯
- **ActingCareer**: 电影/电视作品
- **Contact**: 联系方式和社交链接
- **Quotes**: 语录和歌词

**后台页面** (`frontend/src/components/admin/pages/`):
- **Dashboard**: 管理员仪表板
- **ArticleList/Create/Edit**: 文章管理
- **ScheduleList/Create/Edit**: 行程管理
- **VideoList/Edit**: 视频管理
- **GalleryList/Edit**: 图组管理
- **ReviewCenter**: 内容审核中心
- **ProfileAdmin**: 个人资料管理

### UI 系统

- **Shadcn/ui** 组件库 + 自定义汪峰主题
- 主色系: `#8B5CF6` (汪峰紫)
- 自定义动画: pulse-glow, text-flicker, float
- 响应式设计，移动端优先

## 部署指南 (V4)

### 推荐配置
```
操作系统: Ubuntu 22.04 LTS 64位
CPU: 2核+
内存: 4GB+
存储: 40GB+
```

### Docker 部署方式 (推荐)

**特点：** 前后端集成在单一 Docker 镜像中，部署简单

**快速开始：**
```bash
# 1. 克隆项目
git clone https://github.com/你的用户名/wangfeng-fan-website.git
cd wangfeng-fan-website

# 2. 配置环境变量
cp backend/.env.example backend/.env
# 编辑 .env，配置以下内容：
# - DATABASE_URL=mysql+pymysql://root:密码@localhost:3306/wangfeng_fan_website
# - SECRET_KEY=你的密钥
# - OSS_ACCESS_KEY_ID=阿里云ID
# - OSS_ACCESS_KEY_SECRET=阿里云密钥
# - OSS_BUCKET_NAME=你的bucket名
# - OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com

# 3. 构建 Docker 镜像
docker build -t wangfeng-fan-website:latest .

# 4. 运行容器
docker run -d \
  -p 1994:1994 \
  --env-file backend/.env \
  -v mysql-data:/var/lib/mysql \
  --name wangfeng-app \
  wangfeng-fan-website:latest

# 5. 查看日志
docker logs -f wangfeng-app
```

### Nginx 反向代理配置

```nginx
upstream backend_api {
    server 127.0.0.1:1994;
}

server {
    listen 80;
    server_name 你的域名.com;
    client_max_body_size 50M;

    # 前端静态文件
    location / {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
```

### SSL 配置 (生产环境)

```bash
# 使用 Let's Encrypt 自动配置
sudo certbot --nginx -d 你的域名.com
```

详细部署步骤请参考 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 开发流程

### 数据流

**静态数据** (音乐, 专辑):
- JSON 文件存储在 `frontend/public/data/`
- 前端直接加载，无需后端支持

**动态数据** (文章, 行程, 视频, 图片):
- 通过 `http://localhost:1994/api` 调用后端 API
- API 函数定义在 `frontend/src/utils/api.ts`
- TypeScript 接口确保类型安全

**API 集成模式:**
```typescript
// 示例来自 api.ts
export const scheduleAPI = {
  list: async (): Promise<ScheduleItemResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/schedules`);
    return response.json();
  },
  create: async (data: ScheduleCreateRequest) => {
    // POST 请求
  }
};
```

### 音乐播放集成

1. 在组件中使用 `useMusic()` hook
2. 调用 `playSong(song, album)` 开始播放
3. album 参数自动设置歌单
4. 尊重当前播放模式设置

### 样式约定

- Tailwind CSS 工具类
- 汪峰紫色主题配色
- 统一动画类 (custom.css)
- 移动响应式模式

## 关键文件索引

### 后端核心文件
- `backend/app/main.py` - FastAPI 应用入口
- `backend/app/routers/` - API 路由模块
- `backend/app/models/` - SQLAlchemy 数据库模型
- `backend/app/services/` - 业务逻辑层
- `backend/requirements.txt` - Python 依赖
- `backend/.env.example` - 环境变量模板

### 前端核心文件
- `frontend/src/App.tsx` - React 主应用
- `frontend/src/contexts/MusicContext.tsx` - 全局音乐状态
- `frontend/src/components/` - 页面和 UI 组件
- `frontend/src/utils/api.ts` - 后端 API 客户端
- `frontend/public/data/` - 静态数据文件

### 部署相关文件
- `Dockerfile` - 前后端集成 Docker 配置
- `DEPLOYMENT_GUIDE.md` - Ubuntu + Docker 部署指南
- `backend/.env.example` - 环境变量模板
- `.dockerignore` - Docker 构建忽略配置

## 常见开发任务

### 添加新的 API 端点

1. 在 `backend/app/routers/` 创建新路由文件或编辑现有文件
2. 使用 FastAPI `@app.get()`, `@app.post()` 装饰器定义端点
3. 使用 Pydantic schemas 定义请求/响应数据结构
4. 在 `backend/app/main.py` 注册路由: `app.include_router()`
5. 在 `frontend/src/utils/api.ts` 添加对应的 API 调用函数

### 修改数据库模型

1. 在 `backend/app/models/` 编辑 SQLAlchemy 模型
2. 对应的 schema 文件在 `backend/app/schemas/`
3. 运行 `python3 start.py` 自动创建表结构
4. 可选: 编写迁移脚本在 `backend/migrations/`

### 处理图片上传

后端支持以下存储方式：
- **阿里云 OSS** (推荐生产环境)
- **Minio** (本地测试)
- **Cloudflare R2** (S3 兼容)

配置在 `backend/.env`:
```env
# OSS 配置
OSS_ACCESS_KEY_ID=你的ID
OSS_ACCESS_KEY_SECRET=你的密钥
OSS_BUCKET_NAME=你的bucket
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
```

相关代码在 `backend/app/services/storage_service.py`

## 注意事项

### 安全性
- 不要在 git 提交 `.env` 文件 (含敏感信息)
- JWT SECRET_KEY 生产环境必须修改为强密码
- 数据库仅允许本地连接 (3306 端口不对外开放)
- OSS 图片权限设置为公共读 (用户可读取但不可修改)

### 性能优化
- 前端图片使用 OSS URL，支持 CDN 加速
- 后端支持多个尺寸 (original/medium/thumb)
- Nginx 启用 Gzip 压缩和静态文件缓存
- 考虑 Redis 缓存热点数据 (可选)

### 数据库备份
```bash
# 定期备份 MySQL
mysqldump -u root -p wangfeng_fan_website > backup.sql
gzip backup.sql

# 恢复数据库
gunzip < backup.sql.gz | mysql -u root -p wangfeng_fan_website
```

## 版本历史

- **V4** (当前): FastAPI + MySQL，单一 Docker 镜像，轻量级 API 优先
- **V3** (已删除): Strapi CMS，docker-compose 编排，功能完整但复杂
- **V2**: 原始 Flask/React 组合
- **V1**: 初始版本

## 获取帮助

- 检查 `docs/` 文件夹中的实现指南
- 查看 `DEPLOYMENT_GUIDE.md` 了解部署细节
- 检查后端日志: `docker logs -f wangfeng-app`
- 检查前端浏览器控制台的错误信息
