import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Article } from '@/utils/contentManager';
import { withBasePath } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
  onClick?: (article: Article) => void;
  index?: number;
}

// 从 HTML 内容中提取第一张图片 URL
const extractFirstImageFromHtml = (html: string): string | null => {
  if (!html) return null;

  // 匹配 <img> 标签的 src 属性
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
  const match = html.match(imgRegex);

  if (match && match[1]) {
    return match[1];
  }

  // 尝试匹配 Markdown 图片语法 ![alt](url)
  const mdImgRegex = /!\[.*?\]\(([^)]+)\)/;
  const mdMatch = html.match(mdImgRegex);

  if (mdMatch && mdMatch[1]) {
    return mdMatch[1];
  }

  return null;
};

// 获取默认封面图
const getDefaultCoverImage = (category: string): string => {
  const defaultImages: Record<string, string> = {
    '峰言峰语': '/images/defaults/fengyan.jpg',
    '峰迷荟萃': '/images/defaults/fengmi.jpg',
    '资料科普': '/images/defaults/kepu.jpg',
  };

  return defaultImages[category] || '/images/defaults/article-default.jpg';
};

const ArticleCard = ({ article, onClick, index = 0 }: ArticleCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(article);
    } else {
      // 导航到文章详情页面
      navigate(`/article/${article.slug}`);
    }
  };

  // 格式化日期 - 支持多种日期字段
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '未知日期';

    try {
      const date = new Date(dateStr);
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return '未知日期';
      }
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return '未知日期';
    }
  };

  // 获取文章日期（优先级：published_at > updated_at > created_at > date）
  const getArticleDate = (): string | undefined => {
    const articleAny = article as any;
    return articleAny.published_at || articleAny.updated_at || articleAny.created_at || articleAny.date;
  };

  // 获取封面图 - 优先级：设置的封面 > 正文第一张图 > null（显示纯文字卡片）
  let coverImage: string | null = null;
  let hasImage = false;

  if (article.coverImage) {
    // 1. 如果设置了封面，使用设置的封面
    coverImage = withBasePath(article.coverImage);
    hasImage = true;
  } else {
    // 2. 尝试从正文或摘要中提取第一张图片
    const contentImage = extractFirstImageFromHtml(article.content) || extractFirstImageFromHtml(article.excerpt);
    if (contentImage) {
      coverImage = contentImage.startsWith('http') ? contentImage : withBasePath(contentImage);
      hasImage = true;
    }
  }

  // 生成随机渐变色（基于文章标题，保证同一文章颜色一致）
  const getGradientColors = (title: string): string => {
    const gradients = [
      'from-purple-400/70 via-purple-500/70 to-purple-600/75',
      'from-blue-400/70 via-purple-400/70 to-pink-500/75',
      'from-indigo-400/70 via-purple-400/70 to-purple-500/75',
      'from-violet-400/70 via-purple-500/70 to-fuchsia-500/75',
      'from-purple-500/70 via-indigo-500/70 to-blue-600/75',
      'from-pink-400/70 via-purple-400/70 to-indigo-500/75',
    ];

    // 基于标题生成一个稳定的索引
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = ((hash << 5) - hash) + title.charCodeAt(i);
      hash = hash & hash;
    }

    return gradients[Math.abs(hash) % gradients.length];
  };

  // 从 HTML 中提取纯文本
  const getPlainTextFromHtml = (html: string): string => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // 获取显示用的正文开头（用于卡片底部，缩短字数以显示三行）
  const displayContent = article.content ? getPlainTextFromHtml(article.content) : '';
  const displayExcerpt = displayContent.substring(0, 80) || '暂无内容';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative overflow-hidden rounded-xl theme-bg-card border theme-border-primary group-hover:border-wangfeng-purple/50 transition-all duration-300 w-full">
        {/* 封面区域 - 固定 16:9 比例 */}
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          {hasImage && coverImage ? (
            // 有图片时显示图片
            <img
              src={coverImage}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = withBasePath(getDefaultCoverImage(article.category));
              }}
            />
          ) : (
            // 无图片时显示纯文字渐变背景
            <div className={`w-full h-full bg-gradient-to-br ${getGradientColors(article.title)} flex items-center justify-center p-4 transition-transform duration-300 group-hover:scale-105`}>
              <h3 className="text-white text-lg font-bold text-center leading-tight line-clamp-3">
                {article.title}
              </h3>
            </div>
          )}

          {/* 分类标签 - 右上角 */}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
            {article.category_secondary || article.category}
          </div>
        </div>

        {/* 文章信息 - 固定高度和布局 */}
        <div className="p-4" style={{ height: '139px' }}>
          {/* 标题 - 单行 */}
          <h3 className="font-bold theme-text-primary mb-3 truncate group-hover:text-wangfeng-purple transition-colors text-base" style={{ height: '24px', lineHeight: '24px' }}>
            {article.title}
          </h3>

          {/* 正文开头 - 固定两行高度 */}
          <div className="mb-3 overflow-hidden" style={{ height: '42px' }}>
            <p className="theme-text-muted text-sm leading-relaxed" style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: '21px'
            }}>
              {displayExcerpt}
            </p>
          </div>

          {/* 作者和日期 - 固定在底部 */}
          <div className="flex items-center justify-between theme-text-muted text-xs" style={{ height: '20px', lineHeight: '20px' }}>
            <span className="truncate mr-2">{article.author}</span>
            <span className="whitespace-nowrap">{formatDate(getArticleDate())}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ArticleCard;