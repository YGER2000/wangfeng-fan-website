# 🎵 OSS 音乐上传指南

本文档详细说明如何将汪峰粉丝网站的音乐文件迁移到阿里云 OSS。

## 📋 前提条件

1. **阿里云账户** - 已激活 OSS 服务
2. **AccessKey** - 从 RAM 控制台获取（需要 OSS 写权限）
3. **Bucket** - 已创建的 OSS bucket (推荐命名: `wangfeng-fan-website`)
4. **Python 3.7+** - 本地开发环境

## 🔧 安装依赖

```bash
# 安装 python-dotenv 和 oss2
pip install python-dotenv oss2
```

## 📁 目录结构

项目中的音乐文件目录结构如下：

```
frontend/public/music/
├── album/                    # 录音室专辑
│   ├── 1997-鲍家街43号/
│   ├── 1998-风暴来临/
│   ├── 2000-花火/
│   ├── ... (其他专辑)
│   └── 2025-人海/
├── live/                     # 演唱会现场
│   ├── 2005-Live in Beijing 飞得更高/
│   ├── 2010-信仰北京演唱会/
│   ├── 2011-生无所求演唱会/
│   └── 2013-存在超级巡回上海演唱会/
├── remaster/                 # 新编音乐
│   └── 2017-新编/
└── others/                   # 其他（单曲、电影配乐等）
    ├── 2001-十七岁的单车/
    ├── 2018-歌手第二季/
    └── singles/
```

**上传后的 OSS 结构会保持完全相同的路径**，这样前端代码无需大幅修改。

## 🚀 快速开始

### 第 1 步：配置环境变量

编辑 `backend/.env`，填入你的 OSS 配置：

```bash
cp backend/.env.example backend/.env
vim backend/.env
```

**关键字段：**
```env
# OSS 基本配置
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com        # 改为你的地域
OSS_ACCESS_KEY_ID=your_access_key_id             # 从 RAM 获取
OSS_ACCESS_KEY_SECRET=your_access_key_secret     # 从 RAM 获取
OSS_BUCKET_NAME=wangfeng-fan-website             # bucket 名称

# 访问 URL
OSS_BASE_URL=https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com
MUSIC_OSS_BASE_URL=https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com
```

### 第 2 步：运行上传脚本

```bash
# 进入项目根目录
cd /path/to/wangfeng-fan-website

# 运行上传脚本
python3 scripts/upload_music_to_oss.py
```

**脚本会：**
1. 读取 `.env` 中的 OSS 配置
2. 列出要上传的所有文件
3. 询问确认
4. 开始上传，显示进度
5. 汇总结果

**输出示例：**
```
================================================================================
🎵 阿里云 OSS 音乐上传工具 v1.0
================================================================================

📋 配置信息:
  Bucket: wangfeng-fan-website
  Endpoint: oss-cn-hangzhou.aliyuncs.com
  音乐目录: /path/to/wangfeng-fan-website/frontend/public/music
  目录大小: 9.40GB

📊 找到 324 个文件

👉 确认上传到 OSS 吗？(yes/no) [默认: no]: yes

🔗 连接到 OSS...
✅ 连接成功

📤 开始上传 324 个文件...

[  0%] ✅    1/ 324 music/album/1997-鲍家街43号/01.鲍家街43号.flac                   40.2MB
[  0%] ✅    2/ 324 music/album/1997-鲍家街43号/02.美丽.flac                        35.1MB
...
[100%] ✅  324/ 324 music/others/singles/黎明.flac                                  35.8MB

================================================================================
📊 上传结果统计
================================================================================
  ✅ 成功: 324/324
  ❌ 失败: 0/324

🎉 所有文件上传成功!

🌐 OSS 访问地址:
   https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com/music/

💡 提示: 更新 .env 中的 MUSIC_OSS_BASE_URL 为上述地址
```

## 🔄 后续步骤

### 第 3 步：验证上传结果

```bash
# 访问音乐文件验证
curl -I "https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com/music/album/1997-鲍家街43号/01.鲍家街43号.flac"

# 应该返回 HTTP 200 和文件大小信息
```

### 第 4 步：更新前端配置

在 `frontend/src/contexts/MusicContext.tsx` 或 `MusicPlayer` 组件中，添加 OSS URL 前缀：

**原始代码：**
```typescript
const audioUrl = `/music/${song.filePath}`;
```

**修改为：**
```typescript
const MUSIC_OSS_BASE_URL = import.meta.env.VITE_MUSIC_OSS_BASE_URL
  || 'https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com';
const audioUrl = `${MUSIC_OSS_BASE_URL}/music/${song.filePath}`;
```

或使用环境变量：

**`.env.local` (开发环境):**
```env
VITE_MUSIC_OSS_BASE_URL=https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com
```

**`.env.production` (生产环境):**
```env
VITE_MUSIC_OSS_BASE_URL=https://wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com
```

### 第 5 步：更新后端配置

后端 FastAPI 应该已经支持读取 `MUSIC_OSS_BASE_URL` 环境变量。确认在返回音乐元数据时使用 OSS URL：

```python
# backend/app/routers/articles.py 或其他音乐相关路由
from app.core.config import settings

music_url = f"{settings.music_oss_base_url}/music/{song.file_path}"
```

### 第 6 步：清理本地文件（可选）

上传完成后，可以从本地删除音乐文件以节省空间：

```bash
# 注意：这是可选的，谨慎操作！
# 备份你的音乐文件
tar -czf music-backup.tar.gz frontend/public/music/

# 删除本地文件
rm -rf frontend/public/music/

# 重新构建 Docker 镜像
docker build -t wangfeng-fan-website:latest .
```

## 📊 费用估算

| 项目 | 数量 | 单价 | 月费 |
|------|------|------|------|
| 存储容量 | 10GB | ¥0.12/GB | ¥1.2 |
| 出流量 | 100GB* | ¥0.5/GB | ¥50 |
| CDN 费用 | 可选 | ¥0.15/GB | ¥15 |
| **合计** | - | - | ~¥51-66 |

*假设平均每月100GB出流量，可根据实际情况调整

## 🔍 故障排查

### 上传失败：无法连接到 OSS

**问题：** `ConnectionError: Failed to establish connection to server`

**解决：**
1. 检查网络连接
2. 确认 OSS_ENDPOINT 正确（不包含 bucket 名称）
3. 检查防火墙规则

### 上传失败：认证错误

**问题：** `InvalidAccessKeyId` 或 `SignatureDoesNotMatch`

**解决：**
1. 验证 AccessKey ID 和 Secret
2. 确认 AccessKey 有 OSS 写权限
3. 检查 .env 文件中是否有多余空格

### 上传失败：Bucket 不存在

**问题：** `NoSuchBucket`

**解决：**
1. 在阿里云 OSS 控制台创建 bucket
2. 确认 BUCKET_NAME 拼写正确
3. 确认 bucket 与 endpoint 在同一地域

### 上传速度慢

**优化建议：**
1. 使用离服务器更近的阿里云地域
2. 在本地与 OSS 同地域的 ECS 上运行上传脚本
3. 分批上传（脚本已支持断点续传）

## 📝 其他注意事项

### OSS Bucket 权限设置

1. 进入阿里云 OSS 控制台
2. 选择 bucket，进入"权限管理"
3. 设置 Bucket 访问权限为"公共读"
4. （可选）配置防盗链规则，限制来源域名

### CDN 加速（可选）

如果想加速音乐访问：

1. 阿里云 CDN 控制台 → 添加域名
2. 加速源：`wangfeng-fan-website.oss-cn-hangzhou.aliyuncs.com`
3. 配置 CNAME 到你的域名

### 断点续传

脚本在失败时会显示哪些文件失败，可重新运行脚本，它会继续上传失败的文件。

## 🎯 总结

| 步骤 | 操作 | 时间 |
|------|------|------|
| 1 | 配置 .env | 5 分钟 |
| 2 | 运行上传脚本 | 2-4 小时（取决于网络速度） |
| 3 | 验证上传 | 5 分钟 |
| 4 | 更新前端代码 | 15 分钟 |
| 5 | 重新构建部署 | 10 分钟 |
| **总计** | - | **2-5 小时** |

---

有问题？检查以下文档：
- [阿里云 OSS 官方文档](https://help.aliyun.com/product/31815.html)
- [oss2 Python SDK 文档](https://github.com/aliyun/aliyun-oss-python-sdk)
- 项目 [CLAUDE.md](../CLAUDE.md) 和 [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)
