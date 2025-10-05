import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { articleAPI, Article } from '@/utils/api';
import { Calendar, Eye, User, ChevronRight } from 'lucide-react';

const ShuJuKePu = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const subcategories = ['汪峰数据', '辟谣考证', '媒体报道', '逸闻趣事'];

  useEffect(() => {
    loadArticles();
  }, [selectedSubcategory]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      // 从 MySQL 加载文章
      const data = await articleAPI.getList({
        limit: 100
      });

      // 按分类筛选
      const filtered = data.filter(article =>
        article.category_primary === '数据科普' &&
        (!selectedSubcategory || article.category_secondary === selectedSubcategory)
      );

      setArticles(filtered);
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white py-20">
      <div className="container mx-auto px-4">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bebas tracking-wider theme-text-primary mb-4">
            数据<span className="text-wangfeng-purple animate-pulse-glow">科普</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple">
            Data & Knowledge
          </h2>
        </motion.div>

        {/* 子分类导航 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center gap-4 mb-12 flex-wrap"
        >
          <button
            onClick={() => setSelectedSubcategory(null)}
            className={`px-6 py-2 rounded-lg transition-all ${
              selectedSubcategory === null
                ? 'bg-wangfeng-purple text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            全部
          </button>
          {subcategories.map(sub => (
            <button
              key={sub}
              onClick={() => setSelectedSubcategory(sub)}
              className={`px-6 py-2 rounded-lg transition-all ${
                selectedSubcategory === sub
                  ? 'bg-wangfeng-purple text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {sub}
            </button>
          ))}
        </motion.div>

        {/* 文章列表 */}
        {loading ? (
          <div className="text-center text-gray-400">加载中...</div>
        ) : articles.length === 0 ? (
          <div className="text-center text-gray-400">暂无文章</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link to={`/article/${article.slug}`}>
                  <div className="theme-bg-card rounded-xl border theme-border-primary p-6 hover:border-wangfeng-purple transition-all cursor-pointer group h-full flex flex-col">
                    {/* 分类标签 */}
                    <div className="flex gap-2 mb-3">
                      <span className="text-xs px-2 py-1 bg-wangfeng-purple/20 text-wangfeng-purple rounded-full">
                        {article.category_secondary}
                      </span>
                    </div>

                    {/* 标题 */}
                    <h3 className="text-xl font-bold theme-text-primary mb-3 group-hover:text-wangfeng-purple transition-colors line-clamp-2">
                      {article.title}
                    </h3>

                    {/* 摘要 */}
                    {article.excerpt && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-1">
                        {article.excerpt}
                      </p>
                    )}

                    {/* 元信息 */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-800">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{article.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(article.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{article.view_count}</span>
                      </div>
                    </div>

                    {/* 查看更多 */}
                    <div className="flex items-center gap-1 text-wangfeng-purple text-sm mt-3 group-hover:gap-2 transition-all">
                      <span>阅读全文</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShuJuKePu;
