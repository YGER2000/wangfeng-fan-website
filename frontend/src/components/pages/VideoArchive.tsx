import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import VideoCard from '@/components/ui/VideoCard';
import { videoAPI, Video } from '@/utils/api';

// 清理后的分类
const categories = ['全部', '演出现场', '单曲现场', '综艺节目', '歌曲mv', '访谈节目', '纪录片', '其他'];

const VideoArchive = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        const data = await videoAPI.getList({
          limit: 100,
          category: selectedCategory && selectedCategory !== '全部' ? selectedCategory : undefined
        });
        setVideos(data);
      } catch (error) {
        console.error('加载视频失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [selectedCategory]);

  // 获取所有唯一分类
  const filteredVideos = selectedCategory && selectedCategory !== '全部' 
    ? videos.filter(video => video.category === selectedCategory)
    : videos;

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
            视频 <span className="text-wangfeng-purple animate-pulse-glow">精选</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple">
            Featured Videos of Wang Feng
          </h2>
        </motion.div>

        {/* 分类导航 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center gap-4 mb-12 flex-wrap"
        >
          {categories.map((category, index) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category === '全部' ? null : category)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                (selectedCategory === category) || (category === '全部' && selectedCategory === null)
                  ? 'bg-wangfeng-purple theme-text-primary shadow-glow animate-pulse-glow'
                  : 'bg-transparent border theme-border-primary theme-text-secondary hover:border-wangfeng-purple hover:text-wangfeng-purple'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* 视频列表 */}
        {loading ? (
          <div className="text-center text-gray-400 py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple mx-auto mb-4"></div>
            <p>加载中...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <p className="text-xl">暂无视频</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVideos.map((video, index) => (
              <VideoCard
                key={video.id}
                video={video}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoArchive;