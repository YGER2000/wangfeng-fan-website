import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import { videoAPI, Video } from '@/utils/api';

const VideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideo = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // 获取视频详情
        const videoData = await videoAPI.getById(id);
        setVideo(videoData);

        // 获取相关推荐（同分类的其他视频）
        const allVideos = await videoAPI.getList({
          limit: 10,
          category: videoData.category
        });
        // 过滤掉当前视频，只保留3个
        const related = allVideos
          .filter(v => v.id !== id)
          .slice(0, 3);
        setRelatedVideos(related);
      } catch (err) {
        console.error('加载视频失败:', err);
        setError('加载视频失败');
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple mx-auto mb-4"></div>
        <div className="text-gray-600 text-xl">加载中...</div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-gray-700">
        <h1 className="text-3xl mb-4">😢 {error || '视频未找到'}</h1>
        <button
          onClick={() => navigate('/video-archive')}
          className="px-6 py-2 bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80 rounded-lg transition-colors"
        >
          返回视频存档
        </button>
      </div>
    );
  }

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

        {/* 视频头部 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          {/* 分类标签 */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-wangfeng-purple/10 text-wangfeng-purple border border-wangfeng-purple/20 rounded-full text-sm">
              {video.category}
            </span>
          </div>

          {/* 标题 */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-gray-900">
            {video.title}
          </h1>

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-6 text-gray-500 mb-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{video.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(video.publish_date).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>

          {/* 描述 */}
          {video.description && (
            <div className="text-lg text-gray-700 bg-gray-50 p-4 rounded-lg border-l-4 border-wangfeng-purple">
              {video.description}
            </div>
          )}
        </motion.div>

        {/* B站播放器 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg">
            <iframe
              src={`//player.bilibili.com/player.html?bvid=${video.bvid}&page=1&as_wide=1&high_quality=1&danmaku=0`}
              scrolling="no"
              frameBorder="0"
              allowFullScreen={true}
              className="w-full h-full"
            ></iframe>
          </div>
        </motion.div>

        {/* 相关推荐 */}
        {relatedVideos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">相关推荐</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedVideos.map((relatedVideo) => (
                <div
                  key={relatedVideo.id}
                  className="flex gap-3 p-3 rounded-lg border border-gray-200 hover:border-wangfeng-purple transition-colors cursor-pointer"
                  onClick={() => navigate(`/video/${relatedVideo.id}`)}
                >
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{relatedVideo.title}</h3>
                    <p className="text-sm text-gray-500 truncate">{relatedVideo.author}</p>
                    <p className="text-xs text-gray-400">{new Date(relatedVideo.publish_date).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>
              ))}
            </div>
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
              onClick={() => navigate('/video-archive')}
              className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回视频存档
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoDetail;