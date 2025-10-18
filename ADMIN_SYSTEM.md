# 汪峰粉丝网 - 后台管理系统文档

## 概述

新的后台管理系统是一个独立、正式的管理界面，专门用于网站内容的发布和管理。

## 访问方式

### 登录页面
- **URL**: `http://localhost:1997/#/admin`
- 使用管理员账号登录
- 登录后自动跳转到管理后台

### 主要功能模块

1. **仪表盘** (`/admin/dashboard`)
   - 查看网站统计数据
   - 快速访问各个功能模块
   - 查看最近活动

2. **文章管理**
   - 发布文章: `/admin/articles/create`
   - 文章列表: `/admin/articles/list`
   - 支持 MDX 编辑器
   - 分类管理（峰言峰语、峰迷荟萃、资料科普）

3. **行程管理**
   - 发布行程: `/admin/schedules/create`
   - 行程列表: `/admin/schedules/list`
   - 支持多种活动类型（演唱会、livehouse、音乐节等）

4. **视频管理**
   - 发布视频: `/admin/videos/create`
   - 视频列表: `/admin/videos/list`

5. **图片管理**（待实现）
   - 上传图片: `/admin/gallery/upload`
   - 图片列表: `/admin/gallery/list`

## 界面特点

### 设计风格
- 保持与主站一致的汪峰紫色主题
- 专业的深色背景
- 现代化的卡片式布局
- 流畅的动画效果

### 导航结构
- **顶部导航栏**:
  - 显示网站 logo
  - 返回主站链接
  - 用户信息和退出按钮

- **侧边栏菜单**:
  - 仪表盘
  - 文章管理（可展开）
    - 发布文章
    - 文章列表
  - 行程管理（可展开）
    - 发布行程
    - 行程列表
  - 视频管理（可展开）
    - 发布视频
    - 视频列表
  - 图片管理（可展开）
    - 上传图片
    - 图片列表

### 响应式设计
- 桌面端：固定侧边栏
- 移动端：可收起的侧边栏

## 权限说明

- 只有 `admin` 和 `super_admin` 角色可以访问后台
- 未登录用户访问管理页面会被重定向到登录页
- 普通用户无法访问管理功能

## 与旧系统的关系

- 旧的管理系统已移动到 `/admin-old` 路径
- 新系统完全独立，不影响旧系统
- Header 中的管理按钮已移除，现在只能通过直接访问 URL 进入

## 文章分类系统

### 一级分类
1. **峰言峰语** - 汪峰本人的声音
2. **峰迷荟萃** - 粉丝的内容
3. **资料科普** - 各类资料整理

### 二级分类

**峰言峰语**:
- 汪峰博客
- 汪峰语录
- 访谈记录

**峰迷荟萃**:
- 闲聊汪峰
- 歌曲赏析

**资料科普**:
- 汪峰数据
- 辟谣考证
- 演唱会资料
- 歌曲资料
- 乐队资料
- 逸闻趣事
- 媒体报道

## 开发说明

### 文件结构

```
frontend/src/components/admin/
├── AdminLogin.tsx              # 登录页面
├── NewAdminLayout.tsx          # 新后台主布局
├── AdminLayout.tsx             # 旧后台布局（保留）
└── pages/
    ├── Dashboard.tsx           # 仪表盘（旧）
    ├── ArticleCreate.tsx       # 发布文章
    ├── ArticleList.tsx         # 文章列表
    ├── ScheduleCreate.tsx      # 发布行程
    ├── PlaceholderAdmin.tsx    # 占位页面
    └── ...                     # 其他页面
```

### 路由配置

```typescript
// 登录页面（无需认证）
/admin -> AdminLogin

// 管理页面（需要认证）
/admin/dashboard -> Dashboard
/admin/articles/create -> ArticleCreate
/admin/articles/list -> ArticleList
/admin/schedules/create -> ScheduleCreate
// ... 其他路由
```

### 样式规范

- 使用 Tailwind CSS
- 主题色：`wangfeng-purple` (#8B5CF6)
- 背景：黑色渐变 `from-black via-wangfeng-black to-wangfeng-purple/20`
- 卡片：`bg-black/60 backdrop-blur-md border border-wangfeng-purple/30`
- 发光效果：`shadow-glow`

## API 集成

所有数据操作通过 `@/utils/api` 提供的 API 函数：

```typescript
import { articleAPI, videoAPI, scheduleAPI } from '@/utils/api';

// 文章
await articleAPI.create(data);
await articleAPI.getList();
await articleAPI.update(id, data);
await articleAPI.delete(id);

// 视频
await videoAPI.create(data);
await videoAPI.getList();

// 行程
await scheduleAPI.create(formData);
await scheduleAPI.list();
```

## 待完成功能

- [ ] 视频发布页面
- [ ] 视频列表页面
- [ ] 图片上传功能
- [ ] 图片管理页面
- [ ] 文章编辑功能
- [ ] 行程列表页面
- [ ] 行程编辑功能
- [ ] 数据统计图表
- [ ] 批量操作功能

## 注意事项

1. **安全性**:
   - 后台地址不应该公开暴露
   - 建议使用强密码
   - 定期更新管理员账号

2. **兼容性**:
   - 支持现代浏览器（Chrome、Firefox、Safari、Edge）
   - 移动端浏览器支持

3. **性能**:
   - 图片上传建议限制大小
   - 文章列表分页加载
   - 使用懒加载优化性能

## 技术栈

- **前端框架**: React 18 + TypeScript
- **路由**: React Router v6
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **编辑器**: MDXEditor
- **图标**: Lucide React
- **HTTP**: Fetch API

## 更新日志

### v1.0.0 (2025-10-13)
- ✅ 创建独立的登录页面
- ✅ 设计新的管理后台布局
- ✅ 实现文章管理（发布、列表）
- ✅ 实现行程发布功能
- ✅ 移除 Header 中的管理按钮
- ✅ 配置路由系统
- ⏳ 待完成：视频管理、图片管理

## 联系支持

如有问题或建议，请联系开发团队。
