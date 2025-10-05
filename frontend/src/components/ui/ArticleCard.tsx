import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Tag, ExternalLink } from 'lucide-react';
import { Article } from '@/utils/contentManager';

interface ArticleCardProps {
  article: Article;
  onClick?: (article: Article) => void;
  index?: number;
}

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

  // 格式化日期
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative overflow-hidden rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-700 group-hover:border-wangfeng-purple/50 transition-all duration-300 p-6">
        {/* 文章头部 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-wangfeng-purple transition-colors line-clamp-2">
              {article.title}
            </h3>
            
            {/* 文章信息 */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(article.date)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{article.author}</span>
              </div>

              {article.source && (
                <div className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  <span className="text-xs">{article.source}</span>
                </div>
              )}
            </div>
          </div>

          {/* 特色标识 */}
          {article.featured && (
            <div className="bg-wangfeng-purple text-white text-xs px-2 py-1 rounded-full">
              推荐
            </div>
          )}
        </div>

        {/* 文章摘要 */}
        <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">
          {article.excerpt}
        </p>

        {/* 特殊信息 */}
        {article.songTitle && (
          <div className="mb-3">
            <span className="text-xs text-wangfeng-purple bg-wangfeng-purple/10 px-2 py-1 rounded">
              歌曲: {article.songTitle}
            </span>
            {article.album && (
              <span className="text-xs text-gray-400 ml-2">
                专辑: {article.album}
              </span>
            )}
          </div>
        )}

        {article.dataType && (
          <div className="mb-3">
            <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
              数据类型: {article.dataType}
            </span>
            {article.timeRange && (
              <span className="text-xs text-gray-400 ml-2">
                时间范围: {article.timeRange}
              </span>
            )}
          </div>
        )}

        {article.interviewer && (
          <div className="mb-3">
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
              采访者: {article.interviewer}
            </span>
            {article.media && (
              <span className="text-xs text-gray-400 ml-2">
                媒体: {article.media}
              </span>
            )}
          </div>
        )}

        {/* 标签 */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-gray-400" />
            {article.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{article.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 悬停效果 */}
        <div className="absolute inset-0 bg-wangfeng-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
      </div>
    </motion.div>
  );
};

export default ArticleCard;