import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { withBasePath } from '@/lib/utils';

interface Video {
  id: string;
  title: string;
  date: string;
  author: string;
  category: string;
  bvid: string;
  description?: string;
}

interface VideoCardProps {
  video: Video;
  index?: number;
}

const VideoCard = ({ video, index = 0 }: VideoCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // 导航到视频详情页面
    navigate(`/video/${video.id}`);
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
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

  // 生成随机渐变色（基于视频标题，保证同一视频颜色一致）
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
        {/* 封面区域 - 固定 1:1 正方形 */}
        <div className="relative aspect-square w-full">
          {/* 显示纯文字渐变背景 */}
          <div className={`w-full h-full bg-gradient-to-br ${getGradientColors(video.title)} flex items-center justify-center p-4 transition-transform duration-300 group-hover:scale-105`}>
            <h3 className="text-white text-lg font-bold text-center leading-tight line-clamp-3">
              {video.title}
            </h3>
          </div>

          {/* 分类标签 - 右上角 */}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
            {video.category}
          </div>
          
          {/* 播放图标 - 中间 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* 视频信息 - 固定高度和布局 */}
        <div className="p-4" style={{ height: '160px' }}>
          {/* 标题 - 单行 */}
          <h3 className="font-bold theme-text-primary mb-3 truncate group-hover:text-wangfeng-purple transition-colors text-base" style={{ height: '24px', lineHeight: '24px' }}>
            {video.title}
          </h3>

          {/* 描述 - 固定三行高度 */}
          <div className="mb-3 overflow-hidden" style={{ height: '63px' }}>
            <p className="theme-text-muted text-sm leading-relaxed" style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: '21px'
            }}>
              {video.description || '暂无描述'}...
            </p>
          </div>

          {/* 作者和日期 - 固定在底部 */}
          <div className="flex items-center justify-between theme-text-muted text-xs" style={{ height: '20px', lineHeight: '20px' }}>
            <span className="truncate mr-2">{video.author}</span>
            <span className="whitespace-nowrap">{formatDate(video.date)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCard;