import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';

// 模拟视频数据
const mockVideos = [
  {
    id: '1',
    title: '汪峰现场演出精彩瞬间',
    date: '2024-10-10',
    author: '官方频道',
    category: '现场演出',
    bvid: 'BV1xx411c7mu',
    description: '汪峰最新演唱会精彩片段，包含了多首经典歌曲的现场演绎。'
  },
  {
    id: '2',
    title: '汪峰新歌MV首播',
    date: '2024-09-15',
    author: '音乐频道',
    category: '音乐视频',
    bvid: 'BV1yy411d7mN',
    description: '汪峰最新单曲官方MV，由知名导演执导，展现了独特的视觉艺术。'
  },
  {
    id: '3',
    title: '汪峰访谈节目',
    date: '2024-08-20',
    author: '访谈频道',
    category: '访谈节目',
    bvid: 'BV1zz411e7nO',
    description: '汪峰接受深度访谈，分享音乐创作背后的故事和人生感悟。'
  },
  {
    id: '4',
    title: '汪峰纪录片片段',
    date: '2024-07-05',
    author: '纪录片频道',
    category: '纪录片',
    bvid: 'BV1aa411f7pP',
    description: '汪峰音乐之路纪录片，记录了他从乐队到 solo 的音乐历程。'
  },
  {
    id: '5',
    title: '汪峰慈善演出',
    date: '2024-06-12',
    author: '公益频道',
    category: '公益活动',
    bvid: 'BV1bb411g7qQ',
    description: '汪峰参与的慈善义演，用音乐传递爱心和正能量。'
  },
  {
    id: '6',
    title: '汪峰音乐教学',
    date: '2024-05-18',
    author: '教育频道',
    category: '音乐教学',
    bvid: 'BV1cc411h7rR',
    description: '汪峰分享音乐创作心得，讲解吉他演奏技巧和歌曲创作方法。'
  },
  {
    id: '7',
    title: '汪峰粉丝见面会',
    date: '2024-04-22',
    author: '粉丝频道',
    category: '粉丝活动',
    bvid: 'BV1dd411j7sS',
    description: '汪峰与粉丝亲密互动，现场演唱多首经典歌曲并回答粉丝提问。'
  },
  {
    id: '8',
    title: '汪峰经典回顾',
    date: '2024-03-30',
    author: '怀旧频道',
    category: '经典回顾',
    bvid: 'BV1ee411k7tT',
    description: '汪峰经典歌曲回顾，重温那些年感动过无数人的音乐作品。'
  },
  {
    id: '13',
    title: '当我想你的时候现场视频',
    date: '2024-10-12',
    author: '官方频道',
    category: '现场演出',
    bvid: 'BV1okVhzwEGo',
    description: '《当我想你的时候》现场演出视频，感受汪峰的音乐魅力。'
  }
];

const VideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载视频数据
    const loadVideo = async () => {
      setLoading(true);
      // 模拟网络请求延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const foundVideo = mockVideos.find(v => v.id === id);
      setVideo(foundVideo || null);
      setLoading(false);
    };

    loadVideo();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600 text-xl">加载中...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-gray-700">
        <h1 className="text-3xl mb-4">😢 视频未找到</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80 rounded-lg transition-colors"
        >
          返回上一页
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
              <span>{new Date(video.date).toLocaleDateString('zh-CN')}</span>
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
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 text-gray-900">相关推荐</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockVideos
              .filter(v => v.id !== video.id)
              .slice(0, 3)
              .map((relatedVideo) => (
                <div 
                  key={relatedVideo.id}
                  className="flex gap-3 p-3 rounded-lg border border-gray-200 hover:border-wangfeng-purple transition-colors cursor-pointer"
                  onClick={() => navigate(`/video/${relatedVideo.id}`)}
                >
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{relatedVideo.title}</h3>
                    <p className="text-sm text-gray-500 truncate">{relatedVideo.author}</p>
                    <p className="text-xs text-gray-400">{new Date(relatedVideo.date).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>

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

export default VideoDetail;