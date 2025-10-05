import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, Eye, Heart, Tag } from 'lucide-react';
import { articleAPI, Article } from '@/utils/api';
import ReactMarkdown from 'react-markdown';

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

  useEffect(() => {
    const loadArticle = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const data = await articleAPI.getBySlug(slug);
        setArticle(normalizeArticle(data));
      } catch (err) {
        console.error('加载文章失败:', err);
        setError('文章加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
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

  return (
    <div className="min-h-screen bg-white text-black py-24">
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
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>{article.like_count} 点赞</span>
            </div>
          </div>

          {/* 摘要 */}
          {article.excerpt && (
            <div className="text-lg text-gray-700 bg-gray-50 p-4 rounded-lg border-l-4 border-wangfeng-purple">
              {article.excerpt}
            </div>
          )}
        </motion.div>

        {/* 文章内容 */}
        <motion.article
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose prose-lg max-w-none mb-12 text-gray-800"
        >
          <div className="markdown-content">
            <ReactMarkdown
              components={{
                // 自定义渲染组件
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4 text-wangfeng-purple" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-6 mb-3 text-purple-700" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-800" {...props} />,
                p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-gray-700" {...props} />,
                a: ({ node, ...props }) => <a className="text-wangfeng-purple hover:text-wangfeng-light underline" {...props} />,
                code: ({ node, inline, ...props }: any) =>
                  inline ? (
                    <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm text-wangfeng-purple" {...props} />
                  ) : (
                    <code className="block bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm text-gray-800" {...props} />
                  ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-wangfeng-purple/60 bg-purple-50/60 px-6 py-4 text-gray-700 italic rounded-r-xl"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => <ul className="list-disc pl-6 text-gray-700 space-y-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 text-gray-700 space-y-2" {...props} />,
              }}
            >
              {articleContent}
            </ReactMarkdown>
          </div>
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
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
              >
                {tag}
              </span>
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
    </div>
  );
};

export default ArticleDetailPage;
