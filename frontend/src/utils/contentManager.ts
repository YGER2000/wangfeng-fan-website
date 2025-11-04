import { withBasePath } from '@/lib/utils';

// 文章数据接口
export interface Article {
  id: string;
  title: string;
  date: string;
  author: string;
  category: string;

  // 新的二级分类系统
  category_primary?: string;   // 一级分类：峰言峰语/峰迷荟萃/资料科普
  category_secondary?: string; // 二级分类：汪峰博客/汪峰语录等

  tags: string[];
  excerpt?: string;  // 改为可选，与 api.ts 保持一致
  content: string;
  featured?: boolean;
  coverImage?: string;    // 旧的封面字段（兼容性）
  coverUrl?: string;      // 新的封面URL字段（从后端获取）
  cover_url?: string;     // 后端返回的封面字段
  slug: string;

  // 后端字段
  is_published?: boolean;
  is_deleted?: boolean;
  review_status?: 'draft' | 'pending' | 'approved' | 'rejected';  // 审核状态
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  view_count?: number;
  like_count?: number;
  meta_description?: string;
  meta_keywords?: string;

  // 特殊字段
  source?: string;           // 来源 (博客、访谈等)
  originalUrl?: string;      // 原文链接
  media?: string;           // 媒体名称 (访谈)
  interviewer?: string;     // 采访者
  songTitle?: string;       // 歌曲名 (歌曲赏析)
  album?: string;           // 专辑名
  analysisType?: string;    // 分析类型
  dataType?: string;        // 数据类型
  timeRange?: string;       // 时间范围

  // 新增字段（来自博客映射）
  subcategory?: string;     // 子分类（向后兼容）
  time?: string;            // 发布时间（HH:MM）
  fullDatetime?: string;    // 完整日期时间
  year?: string;            // 年份
  filePath?: string;        // 文件路径
  wordCount?: number;       // 字数统计
  readingTime?: number;     // 预计阅读时间（分钟）
}

// 分类配置
export const CATEGORIES = {
  '峰言峰语': {
    name: '峰言峰语',
    path: '/content/峰言峰语',
    subcategories: {
      '汪峰博客': { name: '汪峰博客', path: '/blog' },
      '汪峰语录': { name: '汪峰语录', path: '/quotes' },
      '访谈记录': { name: '访谈记录', path: '/interviews' }
    }
  },
  '峰迷荟萃': {
    name: '峰迷荟萃',
    path: '/content/峰迷荟萃',
    subcategories: {
      '闲聊汪峰': { name: '闲聊汪峰', path: '/chat' },
      '歌曲赏析': { name: '歌曲赏析', path: '/song-analysis' }
    }
  },
  '资料科普': {
    name: '资料科普',
    path: '/content/资料科普',
    subcategories: {
      '汪峰数据': { name: '汪峰数据', path: '/data' },
      '辟谣考证': { name: '辟谣考证', path: '/fact-check' },
      '演唱会资料': { name: '演唱会资料', path: '/concert-archives' },
      '歌曲资料': { name: '歌曲资料', path: '/song-archives' },
      '乐队资料': { name: '乐队资料', path: '/band-archives' },
      '逸闻趣事': { name: '逸闻趣事', path: '/anecdotes' },
      '媒体报道': { name: '媒体报道', path: '/media' }
    }
  }
} as const;

// Markdown Front Matter 解析
export function parseFrontMatter(content: string): { data: any; content: string } {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return { data: {}, content };
  }
  
  const [, frontMatter, markdownContent] = match;
  const data: any = {};
  
  // 简单的 YAML 解析
  frontMatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim();
      
      // 处理不同类型的值
      if (value.startsWith('[') && value.endsWith(']')) {
        // 数组类型
        data[key.trim()] = value
          .slice(1, -1)
          .split(',')
          .map(item => item.trim().replace(/"/g, ''));
      } else if (value === 'true' || value === 'false') {
        // 布尔类型
        data[key.trim()] = value === 'true';
      } else {
        // 字符串类型
        data[key.trim()] = value.replace(/"/g, '');
      }
    }
  });
  
  return { data, content: markdownContent };
}

// 生成文章 slug
export function generateSlug(title: string, date: string): string {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
  return `${date}-${cleanTitle}`;
}

// 获取分类信息
export function getCategoryInfo(category: string, subcategory?: string) {
  const categoryConfig = Object.values(CATEGORIES).find(cat => 
    cat.name === category || Object.values(cat.subcategories).some(sub => sub.name === subcategory)
  );
  
  if (!categoryConfig) return null;
  
  if (subcategory) {
    const subConfig = Object.values(categoryConfig.subcategories).find(sub => sub.name === subcategory);
    return subConfig;
  }
  
  return categoryConfig;
}

// 文章过滤和排序
export function filterArticles(
  articles: Article[], 
  options: {
    category?: string;
    subcategory?: string;
    tags?: string[];
    featured?: boolean;
    limit?: number;
    sortBy?: 'date' | 'title';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Article[] {
  let filtered = articles.filter(article => {
    // 分类过滤
    if (options.category && article.category !== options.category) {
      return false;
    }
    
    // 子分类过滤
    if (options.subcategory) {
      // 这里需要根据具体的分类逻辑来实现
      // 可以通过文件路径或其他字段来判断
    }
    
    // 标签过滤
    if (options.tags && options.tags.length > 0) {
      const hasMatchingTags = options.tags.some(tag => 
        article.tags.includes(tag)
      );
      if (!hasMatchingTags) return false;
    }
    
    // 推荐文章过滤
    if (options.featured !== undefined && article.featured !== options.featured) {
      return false;
    }
    
    return true;
  });
  
  // 排序
  const sortBy = options.sortBy || 'date';
  const sortOrder = options.sortOrder || 'desc';
  
  filtered.sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'date') {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title);
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  // 限制数量
  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }
  
  return filtered;
}

// 获取相关文章
export function getRelatedArticles(article: Article, allArticles: Article[], limit = 5): Article[] {
  const related = allArticles
    .filter(a => a.id !== article.id)
    .map(a => {
      let score = 0;
      
      // 相同分类加分
      if (a.category === article.category) score += 3;
      
      // 相同标签加分
      const commonTags = a.tags.filter(tag => article.tags.includes(tag));
      score += commonTags.length * 2;
      
      // 相同作者加分
      if (a.author === article.author) score += 1;
      
      // 时间相近加分
      const daysDiff = Math.abs(
        new Date(a.date).getTime() - new Date(article.date).getTime()
      ) / (1000 * 60 * 60 * 24);
      
      if (daysDiff < 30) score += 1;
      if (daysDiff < 7) score += 1;
      
      return { article: a, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.article);
    
  return related;
}

// 搜索文章
export function searchArticles(articles: Article[], query: string): Article[] {
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) return articles;
  
  return articles
    .map(article => {
      let score = 0;
      const title = article.title.toLowerCase();
      const content = article.content.toLowerCase();
      const excerpt = article.excerpt.toLowerCase();
      const tags = article.tags.join(' ').toLowerCase();
      
      // 标题匹配权重最高
      if (title.includes(searchTerm)) score += 10;
      if (title.startsWith(searchTerm)) score += 5;
      
      // 摘要匹配
      if (excerpt.includes(searchTerm)) score += 5;
      
      // 标签匹配
      if (tags.includes(searchTerm)) score += 3;
      
      // 内容匹配
      const contentMatches = (content.match(new RegExp(searchTerm, 'g')) || []).length;
      score += contentMatches;
      
      return { article, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.article);
}

// 获取热门标签
export function getPopularTags(articles: Article[], limit = 20): Array<{ tag: string; count: number }> {
  const tagCount: Record<string, number> = {};
  
  articles.forEach(article => {
    article.tags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });
  
  return Object.entries(tagCount)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// 获取文章统计
export function getArticleStats(articles: Article[]) {
  const stats = {
    total: articles.length,
    categories: {} as Record<string, number>,
    authors: {} as Record<string, number>,
    monthlyCount: {} as Record<string, number>,
    tagCount: 0
  };
  
  const allTags = new Set<string>();
  
  articles.forEach(article => {
    // 分类统计
    stats.categories[article.category] = (stats.categories[article.category] || 0) + 1;
    
    // 作者统计
    stats.authors[article.author] = (stats.authors[article.author] || 0) + 1;
    
    // 月度统计
    const month = article.date.substring(0, 7); // YYYY-MM
    stats.monthlyCount[month] = (stats.monthlyCount[month] || 0) + 1;
    
    // 标签统计
    article.tags.forEach(tag => allTags.add(tag));
  });
  
  stats.tagCount = allTags.size;
  
  return stats;
}

// 验证文章数据
export function validateArticle(article: Partial<Article>): string[] {
  const errors: string[] = [];
  
  if (!article.title?.trim()) {
    errors.push('标题不能为空');
  }
  
  if (!article.date || !/^\d{4}-\d{2}-\d{2}$/.test(article.date)) {
    errors.push('日期格式不正确，应为 YYYY-MM-DD');
  }
  
  if (!article.author?.trim()) {
    errors.push('作者不能为空');
  }
  
  if (!article.category?.trim()) {
    errors.push('分类不能为空');
  }
  
  if (!article.excerpt?.trim()) {
    errors.push('摘要不能为空');
  }
  
  if (!article.content?.trim()) {
    errors.push('内容不能为空');
  }
  
  if (!article.tags || article.tags.length === 0) {
    errors.push('至少需要一个标签');
  }
  
  return errors;
}
