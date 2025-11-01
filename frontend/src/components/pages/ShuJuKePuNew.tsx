import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { articleAPI, Article as ApiArticle } from '@/utils/api';
import ArticleCard from '@/components/ui/ArticleCard';
import { Article as ContentArticle } from '@/utils/contentManager';

// 转换API文章类型为内容管理器文章类型
const convertApiArticleToContentArticle = (apiArticle: ApiArticle): ContentArticle => {
  return {
    id: apiArticle.id,
    title: apiArticle.title,
    date: apiArticle.published_at || apiArticle.created_at || new Date().toISOString().split('T')[0],
    author: apiArticle.author,
    category: apiArticle.category,
    category_primary: apiArticle.category_primary,
    category_secondary: apiArticle.category_secondary,
    tags: apiArticle.tags || [],
    excerpt: apiArticle.excerpt || '',
    content: apiArticle.content,
    slug: apiArticle.slug,
  };
};

const ShuJuKePu = () => {
  const [articles, setArticles] = useState<ContentArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const subcategories = ['汪峰数据', '辟谣考证', '演唱会资料', '歌曲资料', '乐队资料', '逸闻趣事', '媒体报道', '行程信息'];

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
        article.category_primary === '资料科普' &&
        (!selectedSubcategory || article.category_secondary === selectedSubcategory)
      );

      // 转换文章类型
      const convertedArticles = filtered.map(convertApiArticleToContentArticle);
      setArticles(convertedArticles);
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
          <div className="relative inline-block">
            <motion.h1
              className="text-5xl md:text-7xl font-bebas tracking-wider theme-text-primary mb-4 relative z-10"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              资料 <span className="text-wangfeng-purple">科普</span>
            </motion.h1>
            <motion.div
              className="absolute -top-4 -right-4 text-wangfeng-purple/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-12 h-12 md:w-16 md:h-16" />
            </motion.div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple">
            Knowledge Repository
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
                  : 'bg-transparent border theme-border-primary theme-text-secondary hover:border-wangfeng-purple hover:text-wangfeng-purple'
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

export default ShuJuKePu;