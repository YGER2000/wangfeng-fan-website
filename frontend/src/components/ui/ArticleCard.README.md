# ArticleCard Component

全新的 Flowbite 风格文章卡片组件，支持预览图、作者头像等丰富功能。

## 特性

### ✨ 主要功能

1. **预览图显示**
   - 支持 2:3 比例的封面图
   - 鼠标悬停时图片放大效果
   - 自动回退到默认封面图

2. **作者信息**
   - 圆形头像显示
   - 支持自定义头像或自动生成
   - 头像带紫色光环效果

3. **丰富的元数据**
   - 发布日期
   - 文章分类标签
   - 文章标签（最多显示3个）
   - 阅读时间（如果有）
   - 特殊信息标识（歌曲、数据类型、采访者等）

4. **Flowbite 风格**
   - 使用 Flowbite Card 组件
   - 统一的设计语言
   - 响应式布局
   - 深色模式支持

### 🎨 视觉效果

- 卡片阴影和悬停效果
- 平滑的动画过渡
- 紫色主题色（汪峰品牌色）
- 推荐文章特殊标识

## 使用方法

```tsx
import ArticleCard from '@/components/ui/ArticleCard';

// 基本使用
<ArticleCard article={article} index={0} />

// 自定义点击事件
<ArticleCard
  article={article}
  onClick={(article) => console.log(article)}
  index={0}
/>

// 网格布局
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {articles.map((article, index) => (
    <ArticleCard key={article.id} article={article} index={index} />
  ))}
</div>
```

## Article 接口

```typescript
interface Article {
  id: string;
  title: string;
  date: string;
  author: string;
  category: string;
  category_primary?: string;
  category_secondary?: string;
  tags: string[];
  excerpt: string;
  content: string;
  featured?: boolean;
  coverImage?: string;  // 封面图路径
  slug: string;

  // 可选字段
  source?: string;
  readingTime?: number;
  songTitle?: string;
  dataType?: string;
  interviewer?: string;
}
```

## 图片资源

### 封面图

文章的 `coverImage` 字段应该指向图片路径，例如：
- `/images/articles/my-article-cover.jpg`
- 如果没有提供，会使用分类默认图片

### 默认封面

需要在 `frontend/public/images/defaults/` 目录下准备：
- `article-default.jpg` - 通用默认封面
- `fengyan.jpg` - 峰言峰语分类
- `fengmi.jpg` - 峰迷荟萃分类
- `kepu.jpg` - 资料科普分类

推荐尺寸：400x600px (2:3 比例)

### 作者头像

在 `frontend/public/images/avatars/` 目录下：
- `wangfeng.jpg` - 汪峰的头像

如果没有头像，会自动使用 UI Avatars API 生成紫色主题的头像。

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| article | Article | Yes | 文章数据对象 |
| onClick | (article: Article) => void | No | 点击回调（不提供则导航到文章详情） |
| index | number | No | 用于动画延迟，默认为 0 |

## 样式自定义

卡片使用 Flowbite 主题，可以在 `flowbite-theme.ts` 中自定义：

```typescript
card: {
  root: {
    base: 'rounded-2xl border border-wangfeng-purple/20 ...',
  }
}
```

额外的 CSS 样式在 `App.css` 中：
- `.article-card-cover` - 封面容器
- `.avatar-ring` - 头像光环效果

## 示例

### 基本文章卡片

```tsx
const article = {
  id: '1',
  title: '我的音乐之路',
  date: '2025/10/11',
  author: '汪峰',
  category: '峰言峰语',
  category_secondary: '汪峰博客',
  tags: ['音乐', '创作', '人生'],
  excerpt: '回顾我这些年的音乐创作历程...',
  content: '...',
  slug: 'my-music-journey',
  featured: true,
  coverImage: '/images/articles/music-journey.jpg',
  readingTime: 5
};

<ArticleCard article={article} />
```

### 网格布局

```tsx
<div className="container mx-auto px-4 py-8">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {articles.map((article, index) => (
      <ArticleCard
        key={article.id}
        article={article}
        index={index}
      />
    ))}
  </div>
</div>
```

## 注意事项

1. 确保图片路径正确，建议使用 `withBasePath()` 工具函数
2. 封面图建议使用 2:3 比例，尺寸不小于 400x600px
3. 文章摘要建议 100-150 字，会自动截断到 3 行
4. 标签过多时只显示前 3 个，其余显示 "+N"
5. 支持深色模式，确保内容在两种模式下都可读
