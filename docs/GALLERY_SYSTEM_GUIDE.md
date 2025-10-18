# 图片画廊系统实现指南

## 📊 系统概述

图片画廊系统是一个完整的照片管理解决方案，支持图片上传、自动压缩、缩略图生成，并兼容本地存储和阿里云OSS存储。

## ✨ 核心功能

### 1. 图片优化
- **自动压缩**：原图压缩（质量90%，最大2400px）
- **中等尺寸**：用于灯箱预览（1200px宽，质量85%）
- **缩略图**：用于瀑布流展示（400px宽，质量75%）

### 2. 存储支持
- **本地存储**：默认存储在 `backend/uploads/` 目录
- **阿里云OSS**：支持阿里云对象存储（需要配置）
- **扩展性**：易于扩展支持其他存储服务（MinIO、Cloudflare R2等）

### 3. 后台管理
- **照片组管理**：创建、编辑、删除照片组
- **批量上传**：支持一次上传多张图片
- **分类管理**：巡演返图、工作花絮、日常生活
- **发布控制**：支持发布/取消发布

## 📁 文件结构

### 后端文件

```
backend/
├── app/
│   ├── models/
│   │   └── gallery_db.py          # 数据库模型（PhotoGroup, Photo）
│   ├── schemas/
│   │   └── gallery.py              # Pydantic Schemas
│   ├── crud/
│   │   └── gallery.py              # CRUD操作
│   ├── routers/
│   │   └── gallery.py              # API路由
│   ├── services/
│   │   ├── image_processing.py    # 图片压缩和处理
│   │   └── storage_service.py     # 存储服务（本地/OSS）
│   └── main.py                     # 注册gallery路由
└── migrations/
    └── 002_create_gallery_tables.sql  # 数据库迁移脚本
```

### 前端文件

```
frontend/src/components/admin/pages/
├── GalleryUpload.tsx               # 图片上传页面
├── GalleryList.tsx                 # 照片组列表页面
└── (待实现) GalleryEdit.tsx       # 照片组编辑页面
```

## 🗄️ 数据库结构

### photo_groups 表（照片组）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | 主键（UUID） |
| title | VARCHAR(200) | 照片组标题 |
| category | VARCHAR(50) | 分类（巡演返图/工作花絮/日常生活） |
| date | DATETIME | 照片日期 |
| display_date | VARCHAR(100) | 显示日期 |
| year | VARCHAR(4) | 年份 |
| description | TEXT | 描述 |
| cover_image_url | VARCHAR(500) | 封面图URL（原图） |
| cover_image_thumb_url | VARCHAR(500) | 封面图缩略图URL |
| storage_type | VARCHAR(20) | 存储类型（local/oss） |
| is_published | BOOLEAN | 是否发布 |
| is_deleted | BOOLEAN | 是否删除 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### photos 表（照片）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | 主键（UUID） |
| photo_group_id | VARCHAR(36) | 所属照片组ID |
| original_filename | VARCHAR(255) | 原始文件名 |
| title | VARCHAR(200) | 照片标题 |
| description | TEXT | 照片描述 |
| image_url | VARCHAR(500) | 原图URL |
| image_thumb_url | VARCHAR(500) | 缩略图URL |
| image_medium_url | VARCHAR(500) | 中等尺寸URL |
| file_size | INT | 文件大小 |
| width | INT | 宽度 |
| height | INT | 高度 |
| mime_type | VARCHAR(50) | MIME类型 |
| storage_type | VARCHAR(20) | 存储类型 |
| storage_path | VARCHAR(500) | 存储路径 |
| sort_order | INT | 排序顺序 |
| is_deleted | BOOLEAN | 是否删除 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

## 🚀 安装和配置

### 1. 安装Python依赖

```bash
cd backend
pip install Pillow  # 图片处理库
# 如果使用阿里云OSS：
pip install oss2
```

### 2. 创建数据库表

```bash
# 方法1：使用SQL脚本
mysql -u root -p wangfeng_fan_website < migrations/002_create_gallery_tables.sql

# 方法2：自动创建（启动应用时会自动创建）
python3 start.py
```

### 3. 配置存储（可选）

编辑 `backend/app/core/config.py` 或创建 `.env` 文件：

```python
# 本地存储（默认）
storage_type = "local"
local_storage_path = "./uploads"

# 阿里云OSS存储
storage_type = "oss"
oss_endpoint = "oss-cn-hangzhou.aliyuncs.com"
oss_access_key = "your_access_key"
oss_secret_key = "your_secret_key"
oss_bucket = "wangfeng-images"
oss_custom_domain = "cdn.your-domain.com"  # 可选
```

### 4. 确保上传目录存在

```bash
mkdir -p backend/uploads/gallery
chmod 755 backend/uploads
```

## 📡 API 端点

### 公开API（前台）

- `GET /api/gallery/groups` - 获取照片组列表（已发布）
- `GET /api/gallery/groups/{group_id}` - 获取照片组详情（含所有照片）
- `GET /api/gallery/groups/count` - 获取照片组总数
- `GET /api/gallery/photos/group/{group_id}` - 获取照片组的所有照片

### 管理员API（后台）

- `GET /api/gallery/admin/groups` - 获取照片组列表（含未发布）
- `POST /api/gallery/admin/groups` - 创建照片组
- `PUT /api/gallery/admin/groups/{group_id}` - 更新照片组
- `DELETE /api/gallery/admin/groups/{group_id}` - 删除照片组
- `POST /api/gallery/admin/photos` - 创建照片
- `PUT /api/gallery/admin/photos/{photo_id}` - 更新照片
- `DELETE /api/gallery/admin/photos/{photo_id}` - 删除照片
- `POST /api/gallery/admin/upload` - 上传单张图片
- `POST /api/gallery/admin/batch-upload` - 批量上传图片（最多50张）

## 💡 使用流程

### 后台上传照片组

1. 访问 `http://localhost:1997/#/admin/gallery/upload`
2. 填写照片组信息：
   - 标题：如"UNFOLLOW上海站"
   - 分类：巡演返图/工作花絮/日常生活
   - 日期：照片拍摄日期
   - 描述：可选
3. 拖拽或选择图片（支持多选）
4. 点击"创建照片组"
5. 系统自动：
   - 压缩和生成缩略图
   - 上传到存储服务
   - 创建照片组记录
   - 关联所有照片

### 查看照片组列表

1. 访问 `http://localhost:1997/#/admin/gallery/list`
2. 可以：
   - 搜索照片组
   - 按分类筛选
   - 查看封面图预览
   - 编辑照片组
   - 预览前台显示效果

## 🔧 性能优化

### 图片尺寸说明

| 类型 | 宽度 | 质量 | 用途 |
|------|------|------|------|
| 缩略图 | 400px | 75% | 瀑布流展示，快速加载 |
| 中等尺寸 | 1200px | 85% | 灯箱预览，兼顾质量和速度 |
| 原图 | ≤2400px | 90% | 下载/打印，高质量保存 |

### 优化效果

以一张3000x2000的原图为例：

- **原图**：约2.9MB → 压缩后约500KB（减少83%）
- **中等尺寸**：约200KB（用于灯箱）
- **缩略图**：约50KB（用于列表）

瀑布流加载100张图片：
- **优化前**：290MB（100 x 2.9MB）
- **优化后**：5MB（100 x 50KB）
- **节省**：98%的带宽和加载时间

## 🌐 迁移到阿里云OSS

### 步骤

1. 安装OSS SDK：
```bash
pip install oss2
```

2. 配置OSS参数（见上面"配置存储"）

3. 修改 `config.py`：
```python
storage_type = "oss"
```

4. 重启后端服务

### OSS优势

- **CDN加速**：全球加速访问
- **无限容量**：不受本地磁盘限制
- **高可用**：99.99%可用性
- **成本低**：按使用量付费

## 📝 待办事项

- [ ] 实现照片组编辑页面（GalleryEdit.tsx）
- [ ] 支持拖拽排序照片
- [ ] 支持照片水印功能
- [ ] 实现图片懒加载优化
- [ ] 添加图片CDN支持
- [ ] 支持WebP格式
- [ ] 添加图片裁剪功能
- [ ] 实现照片组批量导入
- [ ] 添加图片搜索功能（AI标签）

## 🐛 常见问题

### 1. 上传失败

**问题**：上传图片时报错"上传失败"

**解决方案**：
- 检查 `backend/uploads/` 目录权限
- 检查文件大小是否超过20MB
- 检查图片格式是否支持（JPG/PNG/WebP）
- 查看后端日志：`tail -f logs/backend.log`

### 2. 缩略图不显示

**问题**：照片组列表中封面图不显示

**解决方案**：
- 检查图片URL路径是否正确
- 确保已安装Pillow库
- 检查存储服务配置

### 3. OSS上传失败

**问题**：阿里云OSS上传失败

**解决方案**：
- 检查access_key和secret_key是否正确
- 检查bucket名称是否正确
- 检查endpoint是否正确
- 确保bucket权限设置为公共读

## 📞 技术支持

如有问题，请查看：
- 后端日志：`logs/backend.log`
- 浏览器控制台：F12 Console
- 项目文档：`docs/` 目录

---

**版本**：v1.0.0
**最后更新**：2025-10-16
