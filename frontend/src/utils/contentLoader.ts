import { Article, parseFrontMatter } from './contentManager';

// 内容加载器
export class ContentLoader {
  private static cache = new Map<string, Article[]>();

  // 加载指定分类的文章
  static async loadArticles(category: string): Promise<Article[]> {
    if (this.cache.has(category)) {
      return this.cache.get(category) || [];
    }

    try {
      let articles: Article[] = [];
      
      // 特殊处理：对于有预生成JSON数据的分类，直接从JSON加载
      if (category === '峰言峰语') {
        articles = await this.loadFromJson(category);
      } else {
        // 其他分类继续使用文件路径方式加载
        const contentPaths = this.getContentPaths(category);
        
        for (const path of contentPaths) {
          try {
            const response = await fetch(path);
            if (response.ok) {
              const content = await response.text();
              const { data, content: markdownContent } = parseFrontMatter(content);
              
              // 创建文章对象
              const article: Article = {
                id: data.id || this.generateId(data.title, data.date),
                title: data.title || '无标题',
                date: data.date || '',
                author: data.author || '未知作者',
                category: data.category || category,
                tags: data.tags || [],
                excerpt: data.excerpt || '',
                content: markdownContent,
                slug: data.slug || this.generateSlug(data.title, data.date),
                featured: data.featured || false,
                coverImage: data.coverImage,
                // 特殊字段
                source: data.source,
                originalUrl: data.originalUrl,
                media: data.media,
                interviewer: data.interviewer,
                songTitle: data.songTitle,
                album: data.album,
                analysisType: data.analysisType,
                dataType: data.dataType,
                timeRange: data.timeRange,
              };
              
              articles.push(article);
            }
          } catch (error) {
            console.warn(`加载文章失败: ${path}`, error);
          }
        }
        
        // 按日期排序（最新的在前）
        articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      
      this.cache.set(category, articles);
      return articles;
    } catch (error) {
      console.error(`加载${category}文章失败:`, error);
      return [];
    }
  }

  // 从JSON文件加载文章数据（用于峰言峰语等有预生成数据的分类）
  private static async loadFromJson(category: string): Promise<Article[]> {
    try {
      let jsonPath = '';
      
      switch (category) {
        case '峰言峰语':
          jsonPath = '/data/feng-yan-feng-yu-articles.json';
          break;
        default:
          return [];
      }
      
      const response = await fetch(jsonPath);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error(`从JSON加载${category}文章失败:`, error);
      return [];
    }
  }

  // 获取内容路径（用于需要直接从文件加载的分类）
  private static getContentPaths(category: string): string[] {
    const basePath = '/content';
    
    switch (category) {
      case '峰迷荟萃':
        return [
          `${basePath}/峰迷荟萃/歌曲赏析/2023-10-15-春天里深度解析.md`,
          // 这里可以添加更多歌曲赏析文章路径
        ];
      case '资料科普':
        return [
          `${basePath}/资料科普/汪峰数据/2023-12-01-演唱会数据统计.md`,
          // 这里可以添加更多数据文章路径
        ];
      default:
        return [];
    }
  }

  // 根据子分类过滤文章
  static filterBySubcategory(articles: Article[], subcategory: string): Article[] {
    if (subcategory === 'all') return articles;
    
    return articles.filter(article => {
      switch (subcategory) {
        case 'blog':
          return article.source === '新浪博客' || 
                 article.category === '个人博客' || 
                 article.category === '汪峰博客' ||
                 article.subcategory === 'blog';
        case 'quotes':
          return article.category === '汪峰语录';
        case 'interviews':
          return article.category === '访谈记录' || article.interviewer;
        case 'chat':
          return article.category === '闲聊汪峰';
        case 'song-analysis':
          return article.category === '歌曲赏析' || article.songTitle;
        case 'data':
          return (
            article.dataType ||
            article.category === '数据统计' ||
            article.category === '汪峰数据'
          );
        case 'fact-check':
          return article.category === '辟谣考证';
        case 'concert':
          return article.category === '演唱会资料';
        case 'song':
          return article.category === '歌曲资料';
        case 'band':
          return article.category === '乐队资料';
        case 'media':
          return article.category === '媒体报道';
        case 'anecdotes':
          return article.category === '逸闻趣事';
        default:
          return true;
      }
    });
  }

  // 生成文章ID
  private static generateId(title: string, date: string): string {
    return `${date}-${title}`.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-').toLowerCase();
  }

  // 生成slug
  private static generateSlug(title: string, date: string): string {
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
      .replace(/\s+/g, '-');
    return `${date}-${cleanTitle}`;
  }

  // 根据slug加载单篇文章
  static async loadArticleBySlug(slug: string): Promise<Article | null> {
    try {
      // 先从所有缓存中查找
      for (const articles of this.cache.values()) {
        const article = articles.find(a => a.slug === slug || a.id === slug);
        if (article) return article;
      }

      // 如果缓存中没有，尝试从所有分类加载
      const categories = ['峰言峰语', '峰迷荟萃', '资料科普'];
      
      for (const category of categories) {
        const articles = await this.loadArticles(category);
        const article = articles.find(a => a.slug === slug || a.id === slug);
        if (article) return article;
      }

      return null;
    } catch (error) {
      console.error(`加载文章失败 (slug: ${slug}):`, error);
      return null;
    }
  }

  // 根据路径直接加载文章
  static async loadArticleByPath(path: string): Promise<Article | null> {
    try {
      const response = await fetch(path);
      if (!response.ok) return null;

      const content = await response.text();
      const { data, content: markdownContent } = parseFrontMatter(content);
      
      const article: Article = {
        id: data.id || this.generateId(data.title, data.date),
        title: data.title || '无标题',
        date: data.date || '',
        author: data.author || '未知作者',
        category: data.category || '',
        tags: data.tags || [],
        excerpt: data.excerpt || '',
        content: markdownContent,
        slug: data.slug || this.generateSlug(data.title, data.date),
        featured: data.featured || false,
        coverImage: data.coverImage,
        source: data.source,
        originalUrl: data.originalUrl,
        media: data.media,
        interviewer: data.interviewer,
        songTitle: data.songTitle,
        album: data.album,
        analysisType: data.analysisType,
        dataType: data.dataType,
        timeRange: data.timeRange,
      };
      
      return article;
    } catch (error) {
      console.error(`直接加载文章失败 (path: ${path}):`, error);
      return null;
    }
  }

  // 清除缓存
  static clearCache(): void {
    this.cache.clear();
  }
}
