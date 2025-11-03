import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, Eye, Tag } from 'lucide-react';
import { articleAPI, Article } from '@/utils/api';
import TagContentModal from '@/components/ui/TagContentModal';
import 'react-quill/dist/quill.snow.css';

const normalizeArticle = (raw: any): Article => {
  const tags = Array.isArray(raw?.tags)
    ? raw.tags
    : typeof raw?.tags === 'string'
      ? raw.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      : [];

  return {
    ...raw,
    tags,
    content: typeof raw?.content === 'string' ? raw.content : String(raw?.content ?? ''),
    view_count: typeof raw?.view_count === 'number' ? raw.view_count : Number(raw?.view_count ?? 0),
    like_count: typeof raw?.like_count === 'number' ? raw.like_count : Number(raw?.like_count ?? 0),
  };
};

const ArticleDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('');

  // 使用 ref 防止 StrictMode 导致的重复请求和视图计数
  const hasLoadedRef = useRef(false);
  const hasIncrementedRef = useRef(false);

  useEffect(() => {
    const loadArticle = async () => {
      if (!slug) return;

      // 防止重复加载（StrictMode 会导致 useEffect 执行两次）
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;

      try {
        setLoading(true);
        // 判断 slug 是否是 UUID 格式（文章 ID）
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

        // 如果是 UUID，使用 getById，否则使用 getBySlug
        const data = isUUID
          ? await articleAPI.getById(slug)
          : await articleAPI.getBySlug(slug);
        const normalizedArticle = normalizeArticle(data);
        setArticle(normalizedArticle);

        // 获取文章ID用于增加浏览次数
        const articleId = normalizedArticle.id;

        // 只增加一次浏览次数（防止重复）
        if (articleId && !hasIncrementedRef.current) {
          hasIncrementedRef.current = true;
          try {
            // 调用 POST 端点增加浏览次数
            await fetch(`/api/articles/${articleId}/view`, { method: 'POST' });
          } catch (err) {
            console.error('增加浏览次数失败:', err);
            // 失败不影响文章显示，仅在控制台输出错误
          }
        }
      } catch (err) {
        console.error('加载文章失败:', err);
        setError('文章加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();

    // 清理函数：当 slug 变化时重置标记
    return () => {
      hasLoadedRef.current = false;
      hasIncrementedRef.current = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600 text-xl">加载中...</div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-gray-700">
        <h1 className="text-3xl mb-4">😢 {error || '文章未找到'}</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80 rounded-lg transition-colors"
        >
          返回上一页
        </button>
      </div>
    );
  }

  const safeTags = Array.isArray(article.tags) ? article.tags : [];
  const articleContent = typeof article.content === 'string' ? article.content : '';

  // 从 HTML 中提取纯文本用于摘要
  const getPlainTextFromHtml = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const excerptText = article.excerpt
    ? getPlainTextFromHtml(article.excerpt).substring(0, 200)
    : '';

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setIsTagModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-black py-24">
      <style>{`
        /* 文章内容样式 */
        .article-content-wrapper .ql-editor {
          padding: 0 !important;
          font-size: 16px !important;
          line-height: 1.8 !important;
          color: #374151 !important;
        }

        /* 标题样式 */
        .article-content-wrapper .ql-editor h1 {
          font-size: 2em;
          font-weight: 700;
          margin: 1.5em 0 0.75em;
          color: #8B5CF6;
          line-height: 1.3;
        }

        .article-content-wrapper .ql-editor h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 1.25em 0 0.6em;
          color: #7C3AED;
          line-height: 1.4;
        }

        .article-content-wrapper .ql-editor h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 1em 0 0.5em;
          color: #1F2937;
          line-height: 1.5;
        }

        .article-content-wrapper .ql-editor h4,
        .article-content-wrapper .ql-editor h5,
        .article-content-wrapper .ql-editor h6 {
          font-weight: 600;
          margin: 1em 0 0.5em;
          color: #374151;
        }

        /* 段落样式 */
        .article-content-wrapper .ql-editor p {
          margin-bottom: 1em;
          line-height: 1.8;
        }

        /* 链接样式 */
        .article-content-wrapper .ql-editor a {
          color: #8B5CF6;
          text-decoration: underline;
          transition: color 0.2s;
        }

        .article-content-wrapper .ql-editor a:hover {
          color: #7C3AED;
        }

        /* 引用样式 */
        .article-content-wrapper .ql-editor blockquote {
          border-left: 4px solid #8B5CF6;
          padding-left: 16px;
          margin: 1.5em 0;
          color: #6B7280;
          font-style: italic;
          background: rgba(139, 92, 246, 0.05);
          padding: 12px 16px;
          border-radius: 0 8px 8px 0;
        }

        /* 代码样式 */
        .article-content-wrapper .ql-editor code {
          background: rgba(139, 92, 246, 0.1);
          color: #7C3AED;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9em;
        }

        .article-content-wrapper .ql-editor pre {
          background: #1F2937;
          color: #E5E7EB;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1.5em 0;
        }

        .article-content-wrapper .ql-editor pre code {
          background: transparent;
          color: inherit;
          padding: 0;
        }

        /* 列表样式 */
        .article-content-wrapper .ql-editor ul,
        .article-content-wrapper .ql-editor ol {
          padding-left: 1.5em;
          margin: 1em 0;
        }

        .article-content-wrapper .ql-editor li {
          margin-bottom: 0.5em;
        }

        /* 图片样式 */
        .article-content-wrapper .ql-editor img {
          max-width: 50%;
          height: auto;
          border-radius: 8px;
          margin: 1.5em auto;
          display: block;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        /* 分隔线样式 */
        .article-content-wrapper .ql-editor hr {
          border: none;
          border-top: 2px solid rgba(139, 92, 246, 0.2);
          margin: 2em 0;
        }

        /* 表格样式 */
        .article-content-wrapper .ql-editor table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
        }

        .article-content-wrapper .ql-editor table th,
        .article-content-wrapper .ql-editor table td {
          border: 1px solid #E5E7EB;
          padding: 8px 12px;
          text-align: left;
        }

        .article-content-wrapper .ql-editor table th {
          background: rgba(139, 92, 246, 0.1);
          font-weight: 600;
          color: #7C3AED;
        }

        .article-content-wrapper .ql-editor table tr:nth-child(even) {
          background: rgba(139, 92, 246, 0.02);
        }

        /* 文字颜色和样式 */
        .article-content-wrapper .ql-editor strong {
          font-weight: 700;
          color: #111827;
        }

        .article-content-wrapper .ql-editor em {
          font-style: italic;
        }

        .article-content-wrapper .ql-editor u {
          text-decoration: underline;
        }

        .article-content-wrapper .ql-editor s {
          text-decoration: line-through;
        }
      `}</style>
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 返回按钮 */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-wangfeng-purple mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </motion.button>

        {/* 文章头部 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          {/* 分类标签 */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {article.category_primary && (
              <span className="px-3 py-1 bg-wangfeng-purple/10 text-wangfeng-purple border border-wangfeng-purple/20 rounded-full text-sm">
                {article.category_primary}
              </span>
            )}
            {article.category_secondary && (
              <span className="px-3 py-1 bg-purple-100 text-purple-600 border border-purple-200 rounded-full text-sm">
                {article.category_secondary}
              </span>
            )}
          </div>

          {/* 标题 */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-gray-900">
            {article.title}
          </h1>

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-6 text-gray-500 mb-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(article.created_at).toLocaleDateString('zh-CN')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{article.view_count} 阅读</span>
            </div>
          </div>
        </motion.div>

        {/* 文章内容 */}
        <motion.article
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="article-content-wrapper mb-12"
        >
          <div
            className="ql-editor"
            dangerouslySetInnerHTML={{ __html: articleContent }}
          />
        </motion.article>

        {/* 标签 */}
        {safeTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-2 mb-12"
          >
            <Tag className="w-5 h-5 text-gray-500" />
            {safeTags.map((tag, index) => (
              <button
                key={index}
                onClick={() => handleTagClick(tag)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-wangfeng-purple hover:text-white transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </motion.div>
        )}

        {/* 底部操作 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-gray-200 pt-8"
        >
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </button>
          </div>
        </motion.div>
      </div>

      {/* 标签内容模态框 */}
      <TagContentModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        tagName={selectedTag}
      />
    </div>
  );
};

export default ArticleDetailPage;
