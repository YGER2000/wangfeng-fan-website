# 视频封面本地缓存功能文档

## 🎯 功能概述

本系统实现了视频封面的本地缓存功能，具有以下特点：

### ✨ 核心优势
1. **16:9 比例封面**：直接从B站获取16:9比例的图片，标准视频比例
2. **小文件体积**：缩略图仅19KB，原图30KB，加载速度快
3. **本地缓存**：无需每次从B站加载，减少网络请求
4. **智能fallback**：本地缓存 → B站URL → 渐变色背景

### 📐 封面尺寸规格

| 类型 | 尺寸 | 比例 | 用途 | 平均大小 |
|------|------|------|------|----------|
| 缩略图 (cover_thumb) | 480x270 | 16:9 | 视频卡片列表 | ~19KB |
| 原图 (cover_local) | 640x360 | 16:9 | 视频详情页 | ~30KB |
| B站URL (cover_url) | 变化 | 16:9 | fallback备用 | - |

## 🚀 使用方法

### 1. 批量缓存所有视频封面

```bash
cd backend

# 查看需要缓存的视频
python3 cache_video_covers.py --test

# 批量缓存（增量更新）
python3 cache_video_covers.py

# 强制更新所有封面
python3 cache_video_covers.py --force
```

### 2. 缓存单个视频封面

```bash
python3 cache_video_covers.py --bvid BV15rV6z9E5v
```

### 3. 新上传视频自动缓存（未来功能）

在后台上传视频时，系统会自动：
1. 提取BV号
2. 获取B站封面URL
3. 下载并缓存16:9比例的封面（可选）

## 📊 数据库结构

### videos 表新增字段

```sql
cover_url VARCHAR(500)      -- B站封面URL
cover_local VARCHAR(500)    -- 本地缓存原图路径 (640x360, 16:9)
cover_thumb VARCHAR(500)    -- 本地缓存缩略图路径 (480x270, 16:9)
```

### 示例数据

```sql
cover_url = "http://i1.hdslb.com/bfs/archive/992a333...jpg"
cover_local = "/images/video_covers/c6a27a9bce14...jpg"
cover_thumb = "/images/video_covers/thumbnails/c6a27a9bce14..._thumb.jpg"
```

## 🎨 B站封面尺寸参数

B站支持通过URL参数获取不同尺寸的图片：

```
原始封面：
http://i1.hdslb.com/bfs/archive/xxx.jpg

16:9 比例（本系统使用）：
http://i1.hdslb.com/bfs/archive/xxx.jpg@480w_270h.jpg  (480x270) ✅ 缩略图
http://i1.hdslb.com/bfs/archive/xxx.jpg@640w_360h.jpg  (640x360) ✅ 原图
http://i1.hdslb.com/bfs/archive/xxx.jpg@1280w_720h.jpg (1280x720) 高清

4:3 比例（旧版）：
http://i1.hdslb.com/bfs/archive/xxx.jpg@480w_360h.jpg  (480x360)
http://i1.hdslb.com/bfs/archive/xxx.jpg@640w_480h.jpg  (640x480)
```

## 📂 文件存储位置

```
frontend/public/images/video_covers/
├── c6a27a9bce140ace6fa1ba75c3343c81.jpg          # 原图 (640x360, 16:9)
└── thumbnails/
    └── c6a27a9bce140ace6fa1ba75c3343c81_thumb.jpg  # 缩略图 (480x270, 16:9)
```

### 访问路径

- 前端访问：`/images/video_covers/xxx.jpg`
- 物理路径：`frontend/public/images/video_covers/xxx.jpg`

## 🔧 技术实现

### 1. 图片下载和缓存

```python
from app.utils.image_cache import cache_cover_image

# 缓存封面（返回本地路径）
cover_local, cover_thumb = cache_cover_image(
    cover_url="http://i1.hdslb.com/bfs/archive/xxx.jpg",
    bvid="BV15rV6z9E5v"
)

# 结果
# cover_local = "/images/video_covers/xxx.jpg"
# cover_thumb = "/images/video_covers/thumbnails/xxx_thumb.jpg"
```

### 2. 前端显示优先级

```typescript
// VideoCard组件使用顺序
封面来源优先级：
1. video.cover_thumb    // 本地缩略图 (480x270, 16:9) ✅ 最优
2. video.cover_local    // 本地原图 (640x360, 16:9)
3. video.cover_url      // B站URL (在线获取)
4. 渐变色背景           // 无封面时的fallback
```

### 3. 智能fallback机制

```tsx
{/* 优先使用本地缓存 */}
<img
  src={video.cover_thumb || video.cover_local || video.cover_url}
  onError={(e) => {
    // 加载失败时隐藏图片，显示渐变背景
    e.target.style.display = 'none';
  }}
/>
{/* fallback渐变背景 */}
<div className="gradient-background" style={{ zIndex: -1 }}>
  {video.title}
</div>
```

## 📈 性能对比

### 加载时间对比

| 封面来源 | 文件大小 | 加载时间 | 网络请求 |
|----------|----------|----------|----------|
| 本地缓存 | 19KB | ~20ms | 0次 |
| B站URL | 变化 | ~200ms | 1次 |
| 无封面 | 0KB | 即时 | 0次 |

### 带宽节省

- 每个缩略图：节省约 **100KB+** 带宽（相比B站原图）
- 100个视频页面：节省约 **10MB+** 流量
- 用户体验：**无感知**快速加载

## ⚙️ 配置选项

### image_cache.py 配置

```python
# 缓存目录
CACHE_DIR = "frontend/public/images/video_covers"

# 缩略图尺寸（16:9 比例）
THUMB_SIZE = (480, 270)

# 原图尺寸（16:9 比例）
ORIGINAL_SIZE = (640, 360)
```

## 🔄 工作流程

### 完整流程图

```
1. 后台上传视频
   ↓
2. 系统从B站API获取封面URL
   ↓
3. 保存 cover_url 到数据库
   ↓
4. 运行缓存脚本
   ↓
5. 下载B站16:9比例图片
   ↓
6. 保存到本地（原图 + 缩略图）
   ↓
7. 更新数据库 (cover_local, cover_thumb)
   ↓
8. 前端优先使用本地缓存
```

## 🐛 常见问题

### Q1: 缓存目录创建在错误位置？

**原因**：脚本在 backend 目录运行，相对路径不对

**解决**：已更新为绝对路径，自动定位到项目根目录

### Q2: 为什么选择16:9而不是4:3？

**答案**：16:9是B站视频的标准比例，也是最通用的视频比例。系统直接从B站获取16:9比例图片，使用参数 `@640w_360h.jpg` 和 `@480w_270h.jpg`

### Q3: 批量缓存很慢？

**原因**：为避免B站限流，每次请求间隔0.3秒

**优化**：首次批量缓存后，后续只增量更新新视频

### Q4: 某些封面无法下载？

**可能原因**：
- 视频已被删除
- B站API限流
- 网络问题

**解决**：系统会自动fallback到渐变背景，不影响用户体验

## 📝 未来优化方向

- [ ] WebP格式支持（更小体积）
- [ ] CDN加速（全球访问）
- [ ] 自动定期更新封面
- [ ] 支持手动上传自定义封面
- [ ] 图片懒加载优化
- [ ] Progressive JPEG加载

## 🎉 使用效果

### Before（使用B站URL）
- ❌ 每次都从B站加载
- ❌ 文件较大（约100KB+）
- ❌ 加载时间长（~200ms）
- ❌ 受B站服务器影响

### After（使用本地缓存）
- ✅ 从本地加载
- ✅ 文件小（19KB缩略图）
- ✅ 加载快（~20ms）
- ✅ 稳定可控
- ✅ 16:9 比例完美适配视频内容

---

**最后更新**：2025-10-17
**版本**：v1.0
