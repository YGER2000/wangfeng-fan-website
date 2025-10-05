import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Calendar, User, Tag, ExternalLink, ArrowLeft, Clock } from 'lucide-react';
import { Article } from '@/utils/contentManager';
import { ContentLoader } from '@/utils/contentLoader';

const normalizeArticle = (raw: Article | (Article & { tags?: any; content?: any })): Article => ({
  ...raw,
  tags: Array.isArray((raw as any)?.tags)
    ? (raw as any).tags
    : typeof (raw as any)?.tags === 'string'
      ? (raw as any).tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      : [],
  content: typeof (raw as any)?.content === 'string' ? (raw as any).content : String((raw as any)?.content ?? ''),
});

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 页面加载时自动滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const loadArticle = async () => {
      if (!slug) {
        setError('文章不存在');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const loadedArticle = await ContentLoader.loadArticleBySlug(slug);
        if (loadedArticle) {
          setArticle(normalizeArticle(loadedArticle));
        } else {
          setError('文章未找到');
        }
      } catch (err) {
        console.error('加载文章失败:', err);
        setError('加载文章时出现错误');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    } catch {
      return dateStr;
    }
  };

  // 估算阅读时间
  const estimateReadingTime = (content: string) => {
    const wordsPerMinute = 200; // 中文阅读速度
    const words = content.length;
    const time = Math.ceil(words / wordsPerMinute);
    return `约 ${time} 分钟阅读`;
  };

  // 返回上一页
  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple mx-auto mb-4"></div>
          <p className="text-lg">加载文章中...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-black text-white py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 text-wangfeng-purple mx-auto mb-4 opacity-50">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17C11.45,17 11,16.55 11,16C11,15.45 11.45,15 12,15C12.55,15 13,15.45 13,16C13,16.55 12.55,17 12,17M12.14,14.5C11.6,14.5 11.11,14.17 11.1,13.64C11.1,13.18 11.27,12.77 11.54,12.39C11.95,11.84 12.5,11.32 12.97,10.77C13.26,10.42 13.4,10.09 13.4,9.68C13.4,8.89 12.85,8.4 12,8.4C11.16,8.4 10.6,8.89 10.6,9.68H9.14C9.14,8.08 10.33,6.9 12,6.9C13.67,6.9 14.86,8.08 14.86,9.68C14.86,10.34 14.61,10.84 14.27,11.26C13.91,11.7 13.54,12.12 13.18,12.55C13,12.76 12.86,12.96 12.86,13.18C12.86,13.64 12.55,14 12.14,14.5Z" />
            </svg>
          </div>
          <h3 className="text-xl text-gray-400 mb-4">{error}</h3>
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-wangfeng-purple hover:bg-wangfeng-purple/80 text-white rounded-lg transition-colors"
          >
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 返回按钮 */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gray-600 hover:text-wangfeng-purple transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>返回</span>
          </button>
        </motion.div>

        {/* 文章头部 */}
        <motion.header
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          {/* 分类标识 */}
          {article.category && (
            <div className="mb-4">
              <span className="text-sm text-wangfeng-purple bg-wangfeng-purple/10 px-3 py-1 rounded-full">
                {article.category}
              </span>
            </div>
          )}

          {/* 标题 */}
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
            {article.title}
          </h1>

          {/* 文章信息 */}
          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{article.author}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(article.date)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{estimateReadingTime(article.content)}</span>
            </div>

            {article.source && (
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <span>{article.source}</span>
              </div>
            )}
          </div>

          {/* 摘要 */}
          {article.excerpt && (
            <div className="text-lg text-gray-700 bg-gray-50 p-6 rounded-lg border-l-4 border-wangfeng-purple mb-8">
              {article.excerpt}
            </div>
          )}

          {/* 特殊信息 */}
          <div className="flex flex-wrap gap-3 mb-6">
            {article.songTitle && (
              <div className="text-sm">
                <span className="text-wangfeng-purple bg-wangfeng-purple/10 px-3 py-1 rounded-full">
                  歌曲: {article.songTitle}
                </span>
                {article.album && (
                  <span className="text-gray-600 ml-2">专辑: {article.album}</span>
                )}
              </div>
            )}

            {article.dataType && (
              <div className="text-sm">
                <span className="text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
                  数据类型: {article.dataType}
                </span>
                {article.timeRange && (
                  <span className="text-gray-600 ml-2">时间范围: {article.timeRange}</span>
                )}
              </div>
            )}

            {article.interviewer && (
              <div className="text-sm">
                <span className="text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                  采访者: {article.interviewer}
                </span>
                {article.media && (
                  <span className="text-gray-600 ml-2">媒体: {article.media}</span>
                )}
              </div>
            )}
          </div>

          {/* 标签 */}
          {Array.isArray(article.tags) && article.tags.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <Tag className="w-4 h-4 text-gray-600" />
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-sm text-gray-600 bg-gray-200 px-3 py-1 rounded-full hover:bg-gray-300 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.header>

        {/* 文章内容 */}
        <motion.article
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="prose prose-lg max-w-none article-content"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {typeof article.content === 'string' ? article.content : ''}
          </ReactMarkdown>
        </motion.article>

        {/* 原文链接 */}
        {article.originalUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-300"
          >
            <h3 className="text-lg font-semibold text-black mb-3">原文链接</h3>
            <a
              href={article.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-wangfeng-purple hover:text-wangfeng-light transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              {article.originalUrl}
            </a>
          </motion.div>
        )}

        {/* 返回顶部按钮 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-center mt-16"
        >
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-6 py-3 bg-wangfeng-purple hover:bg-wangfeng-purple/80 text-white rounded-lg transition-colors"
          >
            返回顶部
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ArticleDetail;
