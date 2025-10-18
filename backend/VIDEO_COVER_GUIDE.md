# B站视频封面自动抓取功能使用指南

## 功能概述

本功能实现了从B站自动抓取视频封面的能力，包括：

1. **自动提取BV号**：支持从完整URL或纯BV号中提取
2. **自动获取封面**：从B站API获取视频封面URL
3. **智能补全信息**：如果标题/描述为空，自动从B站获取
4. **批量更新**：提供脚本批量更新现有视频的封面

## 1. 数据库迁移

首先需要在数据库中添加 `cover_url` 字段：

```bash
# 执行迁移SQL
mysql -u root -p wangfeng_fan_db < backend/migrations/002_add_video_cover_url.sql
```

或者手动执行：
```sql
USE wangfeng_fan_db;
ALTER TABLE videos ADD COLUMN cover_url VARCHAR(500) DEFAULT NULL AFTER bvid;
CREATE INDEX idx_videos_bvid ON videos(bvid);
```

## 2. 后台上传视频时自动抓取

在后台创建视频时，现在支持以下格式的输入：

### 支持的BV号格式

- ✅ `BV1xx4y1x7xx` - 纯BV号
- ✅ `https://www.bilibili.com/video/BV1xx4y1x7xx` - 完整URL
- ✅ `https://www.bilibili.com/video/BV1xx4y1x7xx?p=1` - 带参数的URL
- ✅ `https://b23.tv/xxxxx` - B站短链接
- ✅ `bilibili.com/video/BV1xx4y1x7xx` - 不带协议的URL

### 自动功能

系统会自动：
1. 从输入中提取BV号
2. 调用B站API获取视频信息
3. 保存封面URL到 `cover_url` 字段
4. 如果标题为空，自动使用B站标题
5. 如果描述为空，自动使用B站描述

### 前端表单

在后台视频创建页面：
- **视频链接/BV号**字段：粘贴B站链接或BV号即可
- **标题**字段：可选，留空则自动获取
- **描述**字段：可选，留空则自动获取

## 3. 批量更新现有视频封面

对于已存在的视频（没有封面的），可以使用批量更新脚本：

### 测试模式（查看需要更新的视频）

```bash
cd backend
python3 update_video_covers.py --test
```

### 批量更新所有视频

```bash
cd backend
python3 update_video_covers.py
# 确认后开始批量更新
```

### 更新单个视频

```bash
cd backend
python3 update_video_covers.py --bvid BV1xx4y1x7xx
```

### 脚本特性

- ✅ 自动跳过已有封面的视频
- ✅ 每次请求间隔0.5秒，避免被B站限流
- ✅ 详细的进度显示和统计
- ✅ 错误处理和重试机制

## 4. 前端显示

### VideoCard组件

视频卡片会自动显示：
- **有封面URL**：显示B站封面图片
- **无封面URL**：显示渐变色背景 + 标题
- **封面加载失败**：自动回退到渐变色背景

### 示例效果

```
┌─────────────────┐
│                 │
│  [B站封面图]     │  ← 如果有 cover_url
│                 │
└─────────────────┘
       或
┌─────────────────┐
│   渐变背景       │  ← 如果没有 cover_url
│   视频标题       │     或加载失败
└─────────────────┘
```

## 5. API接口

### 创建视频（POST /api/videos/）

```json
{
  "title": "汪峰演唱会",
  "description": "2024年演唱会精彩瞬间",
  "author": "汪峰",
  "category": "演出现场",
  "bvid": "https://www.bilibili.com/video/BV1xx4y1x7xx",
  "publish_date": "2024-01-15T00:00:00"
}
```

响应会自动包含 `cover_url`：
```json
{
  "id": "xxx",
  "title": "汪峰演唱会",
  "cover_url": "http://i2.hdslb.com/bfs/archive/xxx.jpg",
  ...
}
```

### 获取视频列表（GET /api/videos/）

响应中每个视频都会包含 `cover_url` 字段。

## 6. 工具函数

### Python后端

```python
from app.utils.bilibili import extract_bvid, get_video_info, get_video_cover

# 提取BV号
bvid = extract_bvid("https://www.bilibili.com/video/BV1xx4y1x7xx")

# 获取完整视频信息
info = get_video_info("BV1xx4y1x7xx")
# 返回: {'title': '...', 'cover': '...', 'author': '...', ...}

# 快速获取封面
cover_url = get_video_cover("BV1xx4y1x7xx")
```

## 7. 常见问题

### Q: 批量更新脚本运行很慢？
A: 为了避免被B站限流，每次请求间隔0.5秒是正常的。如果有大量视频，可能需要几分钟。

### Q: 某些视频封面获取失败？
A: 可能的原因：
- BV号错误
- 视频已被删除或设为私密
- B站API限流
- 网络问题

### Q: 封面图片显示不出来？
A: 前端会自动fallback到渐变色背景，用户体验不受影响。

### Q: 如何手动设置封面？
A: 目前封面从B站自动获取。如需自定义封面，可以：
1. 直接在数据库修改 `cover_url` 字段
2. 或在后台编辑页面添加自定义封面上传功能（待开发）

## 8. 技术细节

### B站API

使用的是B站公开API：
```
https://api.bilibili.com/x/web-interface/view?bvid={bvid}
```

返回数据包括：
- `pic`: 封面图URL
- `title`: 标题
- `desc`: 描述
- `owner.name`: UP主名称
- `pubdate`: 发布时间戳
- `duration`: 视频时长

### 封面URL格式

B站封面URL格式示例：
```
http://i0.hdslb.com/bfs/archive/abc123.jpg
http://i1.hdslb.com/bfs/archive/abc123.jpg
http://i2.hdslb.com/bfs/archive/abc123.jpg
```

这些URL可以直接使用，无需额外处理。

## 9. 未来优化

- [ ] 支持手动上传自定义封面
- [ ] 封面图片本地缓存
- [ ] 封面图片CDN加速
- [ ] 定期自动更新封面（针对新视频）
- [ ] 支持YouTube、抖音等其他平台视频
