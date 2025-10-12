import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Article } from '@/utils/contentManager';
import { ContentLoader } from '@/utils/contentLoader';
import ArticleCard from '@/components/ui/ArticleCard';

type ContentCategory = 'all' | 'blog' | 'quotes' | 'interviews';

const FengYanFengYu = () => {
  const [activeCategory, setActiveCategory] = useState<ContentCategory>('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { key: 'all' as const, label: '全部' },
    { key: 'blog' as const, label: '汪峰博客' },
    { key: 'quotes' as const, label: '汪峰语录' },
    { key: 'interviews' as const, label: '访谈记录' },
  ];

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      try {
        const allArticles = await ContentLoader.loadArticles('峰言峰语');
        setArticles(allArticles);
      } catch (error) {
        console.error('加载文章失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  const filteredArticles = ContentLoader.filterBySubcategory(articles, activeCategory);


  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple mx-auto mb-4"></div>
          <p className="text-lg">加载内容中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bebas tracking-wider text-white mb-4">
            峰言 <span className="text-wangfeng-purple animate-pulse-glow">峰语</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple mb-6">
            汪峰的声音与思考
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            收录汪峰的个人博客、经典语录和各类访谈记录，记录音乐路上的思考与感悟
          </p>
        </motion.div>

        {/* 分类按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category, index) => (
            <motion.button
              key={category.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(category.key)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeCategory === category.key
                  ? 'bg-wangfeng-purple theme-text-primary shadow-glow animate-pulse-glow'
                  : 'theme-bg-card theme-text-secondary border theme-border-primary hover:bg-wangfeng-purple/20 hover:text-wangfeng-purple'
              }`}
            >
              {category.label}
            </motion.button>
          ))}
        </motion.div>

        {/* 内容区域 */}
        <div className="max-w-6xl mx-auto">
          {filteredArticles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 text-wangfeng-purple mx-auto mb-4 opacity-50">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
              </div>
              <h3 className="text-xl text-gray-400 mb-2">
                {loading ? '加载中...' : `暂无${categories.find(c => c.key === activeCategory)?.label}内容`}
              </h3>
              <p className="text-gray-500">
                {loading ? '正在获取文章数据' : '内容正在整理中，敬请期待'}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article, index) => (
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
    </div>
  );
};

export default FengYanFengYu;
