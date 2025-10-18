# 标签系统使用指南

## 概述

标签系统已成功集成到汪峰粉丝网站中，支持为视频、文章、图片、行程、音乐等内容添加标签，并通过标签快速查找相关内容。

## 功能特性

### 1. 智能标签输入
- ✅ **实时搜索**：输入关键词自动搜索已有标签
- ✅ **模糊匹配**：输入"花"可以找到"单曲《花火》"、"单曲《向阳花》"等
- ✅ **快速创建**：搜索不到的标签可以直接创建
- ✅ **键盘导航**：支持上下键选择、回车确认、ESC 关闭
- ✅ **标签展示**：已选标签以紫色徽章形式展示，可单独移除

### 2. 标签管理
- ✅ **统一存储**：所有标签集中管理，避免重复和不一致
- ✅ **批量创建**：支持预构建常用标签库
- ✅ **CRUD 操作**：完整的增删改查功能

### 3. 内容关联
- ✅ **多对多关系**：一个标签可关联多个内容，一个内容可有多个标签
- ✅ **类型区分**：支持 video、article、gallery、schedule、music 五种内容类型
- ✅ **智能聚合**：点击标签自动聚合显示所有相关内容

## 数据库设计

### 表结构

#### 1. tags 表（标签主表）
```sql
CREATE TABLE tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME,
    updated_at DATETIME
);
```

#### 2. content_tags 表（内容-标签关联表）
```sql
CREATE TABLE content_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tag_id INT NOT NULL,
    content_type VARCHAR(50) NOT NULL,  -- video/article/gallery/schedule/music
    content_id INT NOT NULL,
    created_at DATETIME,
    UNIQUE KEY (content_type, content_id, tag_id)
);
```

## 部署步骤

### 1. 数据库迁移

运行迁移脚本创建标签表：

```bash
# 连接到 MySQL
mysql -u your_username -p your_database

# 执行迁移脚本
source backend/migrations/001_create_tags_tables.sql
```

或者直接在 MySQL 客户端中运行：

```sql
-- 创建标签表
CREATE TABLE IF NOT EXISTS tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL COMMENT '标签名称',
    description TEXT NULL COMMENT '标签描述',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建关联表
CREATE TABLE IF NOT EXISTS content_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tag_id INT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_content_tag (content_type, content_id, tag_id),
    INDEX idx_tag (tag_id),
    INDEX idx_content (content_type, content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 为 schedules 表添加 tags 字段
ALTER TABLE schedules
ADD COLUMN tags TEXT NULL COMMENT '标签，用逗号分隔'
AFTER description;
```

### 2. 重启后端服务

```bash
cd backend
# 重启 Python 服务
python3 start.py
```

### 3. 前端无需额外操作

前端代码已经集成完成，刷新页面即可使用。

## API 接口文档

### 标签相关接口

#### 1. 获取所有标签
```
GET /api/tags?skip=0&limit=100
```

#### 2. 搜索标签
```
GET /api/tags/search?q=花火&limit=20
```

#### 3. 创建标签
```
POST /api/tags
Content-Type: application/json

{
  "name": "单曲《花火》",
  "description": "汪峰代表作之一"
}
```

#### 4. 批量创建标签
```
POST /api/tags/batch
Content-Type: application/json

["单曲《花火》", "专辑《花火》", "单曲《向阳花》"]
```

#### 5. 获取内容的标签
```
GET /api/tags/content/video/123
```

#### 6. 设置内容的标签
```
PUT /api/tags/content/video/123
Content-Type: application/json

[1, 2, 3]  # 标签 ID 列表
```

#### 7. 获取标签的所有关联内容
```
GET /api/tags/123/contents
```

## 前端组件使用

### 1. TagInputWithSearch（标签输入组件）

在表单中添加标签输入：

```tsx
import TagInputWithSearch from '@/components/ui/TagInputWithSearch';
import { tagAPI, TagData } from '@/utils/api';

const [selectedTags, setSelectedTags] = useState<TagData[]>([]);

const handleAddTag = (tag: TagData) => {
  setSelectedTags(prev => [...prev, tag]);
};

const handleRemoveTag = (tagId: number) => {
  setSelectedTags(prev => prev.filter(t => t.id !== tagId));
};

const handleSearchTags = async (query: string) => {
  return await tagAPI.search(query);
};

const handleCreateTag = async (name: string) => {
  return await tagAPI.create(name);
};

<TagInputWithSearch
  selectedTags={selectedTags}
  onAddTag={handleAddTag}
  onRemoveTag={handleRemoveTag}
  onSearchTags={handleSearchTags}
  onCreateTag={handleCreateTag}
  placeholder="搜索或创建标签..."
/>
```

### 2. TagList（标签展示组件）

在卡片或详情页中展示标签：

```tsx
import TagList from '@/components/ui/TagList';

<TagList
  tags={tags}
  onClick={(tag) => {
    // 点击标签时的处理逻辑
    // 可以打开弹窗显示相关内容
  }}
  size="md"
/>
```

### 3. TagContentModal（标签内容弹窗）

点击标签后显示相关内容：

```tsx
import TagContentModal from '@/components/ui/TagContentModal';

const [selectedTag, setSelectedTag] = useState<TagData | null>(null);
const [modalOpen, setModalOpen] = useState(false);

const loadTagContents = async (tagId: number) => {
  // 获取标签关联的内容
  const contentIds = await tagAPI.getTagContents(tagId);

  // 根据 ID 获取具体内容详情
  // 返回 ContentItem[] 格式
  return [];
};

<TagContentModal
  tag={selectedTag}
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  onLoadContents={loadTagContents}
/>
```

## 预构建标签示例

使用批量创建接口预构建常用标签：

```typescript
const commonTags = [
  // 专辑
  "专辑《花火》",
  "专辑《生来彷徨》",
  "专辑《信仰在空中飘扬》",
  "专辑《生无所求》",

  // 单曲
  "单曲《花火》",
  "单曲《春天里》",
  "单曲《飞得更高》",
  "单曲《怒放的生命》",
  "单曲《北京北京》",
  "单曲《向阳花》",

  // 演唱会
  "岁月巡回演唱会",
  "相信未来巡回演唱会",
  "UNFOLLOW巡回演唱会",

  // 主题
  "摇滚",
  "民谣",
  "现场",
  "MV",
  "访谈",
  "幕后花絮"
];

await tagAPI.batchCreate(commonTags);
```

## 后续开发建议

### 1. 行程详情页集成
- 在行程卡片上显示标签
- 点击行程卡片跳转到详情页
- 详情页底部显示标签，点击标签打开弹窗

### 2. 视频详情页集成
- 视频详情页底部显示标签
- 点击标签打开弹窗显示相关内容

### 3. 图片详情页改造
- 将当前弹窗改为独立页面
- 页面底部显示标签

### 4. 文章详情页集成
- 文章详情页底部显示标签
- 已有标签系统，需要迁移到新系统

### 5. 音乐作品集成
- 音乐卡片上显示标签
- 点击标签显示相关内容

### 6. 标签管理后台
- 创建标签管理页面
- 支持批量导入、编辑、删除
- 查看标签使用统计

## 注意事项

1. **标签命名规范**：
   - 建议使用统一格式，如：单曲《xxx》、专辑《xxx》
   - 由专人负责标签命名和维护

2. **性能优化**：
   - 标签搜索已实现防抖（300ms）
   - 大量标签时考虑分页加载

3. **数据一致性**：
   - 删除标签时会级联删除所有关联
   - 修改标签名称会影响所有使用该标签的内容

4. **向后兼容**：
   - schedules 表的 tags 字段保留，用于向后兼容
   - 新系统使用 content_tags 关联表

## 技术栈

- **后端**: FastAPI + SQLAlchemy + MySQL
- **前端**: React + TypeScript + Tailwind CSS + Framer Motion
- **数据库**: MySQL 5.7+

## 联系支持

如遇问题请查看：
- 后端日志: `logs/backend.log`
- 前端控制台: 浏览器开发者工具
- API 文档: `http://localhost:1994/docs`
