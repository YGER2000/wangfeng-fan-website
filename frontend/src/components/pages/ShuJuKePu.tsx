import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Article } from '@/utils/contentManager';
import { ContentLoader } from '@/utils/contentLoader';
import ArticleCard from '@/components/ui/ArticleCard';

type ContentCategory =
  | 'all'
  | 'data'
  | 'fact-check'
  | 'concert'
  | 'song'
  | 'band'
  | 'anecdotes'
  | 'media';

const ShuJuKePu = () => {
  const [activeCategory, setActiveCategory] = useState<ContentCategory>('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { key: 'all' as const, label: '全部' },
    { key: 'data' as const, label: '汪峰数据' },
    { key: 'fact-check' as const, label: '辟谣考证' },
    { key: 'concert' as const, label: '演唱会资料' },
    { key: 'song' as const, label: '歌曲资料' },
    { key: 'band' as const, label: '乐队资料' },
    { key: 'anecdotes' as const, label: '逸闻趣事' },
    { key: 'media' as const, label: '媒体报道' },
  ];

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      try {
        const allArticles = await ContentLoader.loadArticles('资料科普');
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
      <div className="min-h-screen  text-white py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple mx-auto mb-4"></div>
          <p className="text-lg">加载内容中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  text-white py-20">
      <div className="container mx-auto px-2">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bebas tracking-wider text-white mb-4">
            资料 <span className="text-wangfeng-purple animate-pulse-glow">科普</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple mb-6">
            多维视角
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            多角度整理汪峰的各类资料，从数据解读到演出档案，全面呈现最真实的汪峰。
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
                  : 'bg-transparent border theme-border-primary theme-text-secondary hover:border-wangfeng-purple hover:text-wangfeng-purple'
              }`}
            >
              {category.label}
            </motion.button>
          ))}
        </motion.div>

        {/* 内容区域 */}
        <div className="mx-auto">
          {filteredArticles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 text-wangfeng-purple mx-auto mb-4 opacity-50">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,17H7V10H9V17M13,17H11V7H13V17M17,17H15V13H17V17M19.5,19.5H4.5V5.5H19.5V19.5M19.5,3.5H4.5C3.4,3.5 2.5,4.4 2.5,5.5V19.5C2.5,20.6 3.4,21.5 4.5,21.5H19.5C20.6,21.5 21.5,20.6 21.5,19.5V5.5C21.5,4.4 20.6,3.5 19.5,3.5Z" />
                </svg>
              </div>
              <h3 className="text-xl text-gray-400 mb-2">
                暂无{categories.find(c => c.key === activeCategory)?.label}内容
              </h3>
              <p className="text-gray-500">
                资料整理中，敬请期待
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-0.5 justify-center">
              {filteredArticles.map((article, index) => (
                <ArticleCard key={article.id} article={article} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShuJuKePu;
