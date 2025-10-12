import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { articleAPI, Article } from '@/utils/api';
import ArticleCard from '@/components/ui/ArticleCard';

const FengYanFengYu = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const subcategories = ['汪峰博客', '汪峰语录', '访谈记录'];

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
        article.category_primary === '峰言峰语' &&
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
            峰言<span className="text-wangfeng-purple animate-pulse-glow">峰语</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple">
            Wang Feng's Words
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
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
              selectedSubcategory === null
                ? 'bg-wangfeng-purple theme-text-primary shadow-glow animate-pulse-glow'
                : 'bg-transparent border theme-border-primary theme-text-secondary hover:border-wangfeng-purple hover:text-wangfeng-purple'
            }`}
          >
            全部
          </button>
          {subcategories.map(sub => (
            <button
              key={sub}
              onClick={() => setSelectedSubcategory(sub)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                selectedSubcategory === sub
                  ? 'bg-wangfeng-purple theme-text-primary shadow-glow animate-pulse-glow'
                  : 'theme-bg-card theme-text-secondary border theme-border-primary hover:bg-wangfeng-purple/20 hover:text-wangfeng-purple'
              }`}
            >
              {sub}
            </button>
          ))}
        </motion.div>

        {/* 文章列表 */}
        {loading ? (
          <div className="text-center text-gray-400 py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple mx-auto mb-4"></div>
            <p>加载中...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <p className="text-xl">暂无文章</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((article, index) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FengYanFengYu;
