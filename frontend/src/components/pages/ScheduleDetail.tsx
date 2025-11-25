import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn, withBasePath } from '@/lib/utils';
import { scheduleAPI, ScheduleItemResponse, ScheduleCategory } from '@/utils/api';

// 分类颜色映射
const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    '演唱会': 'bg-red-500',
    'livehouse': 'bg-blue-500',
    '音乐节': 'bg-green-500',
    '商演拼盘': 'bg-yellow-500',
    '综艺晚会': 'bg-purple-500',
    '直播': 'bg-pink-500',
    '商业活动': 'bg-indigo-500',
    '其他': 'bg-gray-500',
  };
  return colorMap[category] || 'bg-gray-500';
};

const ScheduleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<ScheduleItemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posterIndex, setPosterIndex] = useState(0);

  // 获取海报列表
  const getPosterList = (): string[] => {
    if (!schedule) return [];
    if (schedule.images && schedule.images.length > 0) {
      return schedule.images;
    }
    return schedule.image ? [schedule.image] : [];
  };

  const posterList = getPosterList();
  const totalPosters = posterList.length || 1;
  const currentPoster = posterList[posterIndex] || schedule?.image;

  // 海报导航函数
  const handlePrevPoster = () => {
    setPosterIndex(Math.max(0, posterIndex - 1));
  };

  const handleNextPoster = () => {
    setPosterIndex(Math.min(totalPosters - 1, posterIndex + 1));
  };

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true);
        const data = await scheduleAPI.list();
        const found = data.find(item => item.id.toString() === id);
        if (found) {
          setSchedule(found);
        } else {
          setError('行程信息未找到');
        }
      } catch (err) {
        console.error('Error loading schedule:', err);
        setError('加载行程信息失败');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadSchedule();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent theme-text-primary py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple mx-auto mb-4"></div>
          <p className="text-lg">加载行程信息中...</p>
        </div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="min-h-screen bg-transparent theme-text-primary py-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-6">{error || '行程信息未找到'}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/tour-dates')}
            className="px-8 py-3 bg-wangfeng-purple text-white rounded-full font-semibold hover:bg-purple-700 transition-all"
          >
            返回行程列表
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-transparent theme-text-primary"
    >
      {/* 返回按钮 */}
      <div className="sticky top-0 z-40 py-4 px-4 sm:px-6 lg:px-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/tour-dates')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-wangfeng-purple/20 hover:bg-wangfeng-purple/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">返回行程列表</span>
        </motion.button>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* 行程主题标题 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 mt-8"
        >
          <div className="flex justify-center mb-6">
            <span className={cn(
              'inline-block px-4 py-2 text-xs font-bold text-white rounded-full',
              getCategoryColor(schedule.category)
            )}>
              {schedule.category}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bebas tracking-wider text-wangfeng-purple mb-4">
            {schedule.theme}
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-lg theme-text-secondary">
            <span className="text-2xl">📍 {schedule.city}</span>
            <span className="hidden sm:inline text-wangfeng-purple/50">•</span>
            <span className="text-lg">
              {new Date(schedule.date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </motion.div>

        {/* 轮播图组件 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16 flex justify-center"
        >
          <div className="w-full max-w-3xl">
            <div className="relative group">
              {/* 海报容器 */}
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-4 border-wangfeng-purple/30 bg-gray-900 shadow-2xl">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={posterIndex}
                    src={withBasePath(currentPoster ?? 'images/concerts/xiangxinweilai_poster.jpg')}
                    alt={`${schedule.theme} 海报`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                {/* 海报计数器 */}
                <div className="absolute top-6 right-6 px-4 py-2 bg-black/70 text-white text-sm font-semibold rounded-full backdrop-blur">
                  {posterIndex + 1}/{totalPosters}
                </div>
              </div>

              {/* 左导航按钮 */}
              {totalPosters > 1 && (
                <motion.button
                  whileHover={{ scale: 1.15, x: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePrevPoster}
                  disabled={posterIndex === 0}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-wangfeng-purple/80 hover:bg-wangfeng-purple text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"
                  aria-label="上一张海报"
                >
                  <ChevronLeft className="w-6 h-6" />
                </motion.button>
              )}

              {/* 右导航按钮 */}
              {totalPosters > 1 && (
                <motion.button
                  whileHover={{ scale: 1.15, x: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleNextPoster}
                  disabled={posterIndex === totalPosters - 1}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-wangfeng-purple/80 hover:bg-wangfeng-purple text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"
                  aria-label="下一张海报"
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              )}
            </div>

            {/* 轮播指示器 */}
            {totalPosters > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: totalPosters }).map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setPosterIndex(index)}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      index === posterIndex
                        ? 'bg-wangfeng-purple w-8'
                        : 'bg-wangfeng-purple/30 w-2 hover:bg-wangfeng-purple/60'
                    )}
                    whileHover={{ scale: 1.2 }}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* 按钮行 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16 flex flex-col sm:flex-row justify-center gap-6 max-w-2xl mx-auto"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-wangfeng-purple/20 border-2 border-wangfeng-purple text-wangfeng-purple rounded-full font-bold text-lg hover:bg-wangfeng-purple hover:text-white transition-all shadow-glow"
          >
            📸 查看巡演返图
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-wangfeng-purple/20 border-2 border-wangfeng-purple text-wangfeng-purple rounded-full font-bold text-lg hover:bg-wangfeng-purple hover:text-white transition-all shadow-glow"
          >
            🎸 查看排练返图
          </motion.button>
        </motion.div>

        {/* 详细信息区域 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto space-y-12"
        >
          {/* 基本信息卡片 */}
          <div className="theme-bg-card backdrop-blur-sm rounded-2xl border border-wangfeng-purple/20 p-8 box-shadow-glow">
            <h2 className="text-3xl font-bebas tracking-wider text-wangfeng-purple mb-8">基本信息</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 行程主题 */}
              <div>
                <h3 className="text-sm font-bold text-wangfeng-purple uppercase tracking-widest mb-3">
                  行程主题
                </h3>
                <p className="theme-text-primary text-lg leading-relaxed">
                  {schedule.theme}
                </p>
              </div>

              {/* 城市 */}
              <div>
                <h3 className="text-sm font-bold text-wangfeng-purple uppercase tracking-widest mb-3">
                  演出城市
                </h3>
                <p className="theme-text-primary text-lg leading-relaxed">
                  {schedule.city}
                </p>
              </div>

              {/* 日期 */}
              <div>
                <h3 className="text-sm font-bold text-wangfeng-purple uppercase tracking-widest mb-3">
                  演出日期
                </h3>
                <p className="theme-text-primary text-lg leading-relaxed">
                  {new Date(schedule.date).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })}
                </p>
              </div>

              {/* 分类 */}
              <div>
                <h3 className="text-sm font-bold text-wangfeng-purple uppercase tracking-widest mb-3">
                  演出分类
                </h3>
                <p className="theme-text-primary text-lg">
                  <span className={cn(
                    'inline-block px-4 py-2 text-xs font-bold text-white rounded-full',
                    getCategoryColor(schedule.category)
                  )}>
                    {schedule.category}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* 场馆信息 */}
          {schedule.venue && (
            <div className="theme-bg-card backdrop-blur-sm rounded-2xl border border-wangfeng-purple/20 p-8 box-shadow-glow">
              <h2 className="text-3xl font-bebas tracking-wider text-wangfeng-purple mb-6">场馆地点</h2>

              <div className="flex items-start gap-4">
                <span className="text-4xl mt-2">📍</span>
                <div className="flex-1">
                  <p className="theme-text-primary text-lg leading-relaxed">
                    {schedule.venue}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 详细描述 */}
          {schedule.description && (
            <div className="theme-bg-card backdrop-blur-sm rounded-2xl border border-wangfeng-purple/20 p-8 box-shadow-glow">
              <h2 className="text-3xl font-bebas tracking-wider text-wangfeng-purple mb-6">详细信息</h2>

              <div className="prose prose-invert max-w-none">
                <p className="theme-text-secondary text-base leading-relaxed whitespace-pre-wrap">
                  {schedule.description}
                </p>
              </div>
            </div>
          )}

          {/* 演出亮点（如果有补充信息） */}
          {schedule.remarks && (
            <div className="theme-bg-card backdrop-blur-sm rounded-2xl border border-wangfeng-purple/20 p-8 box-shadow-glow">
              <h2 className="text-3xl font-bebas tracking-wider text-wangfeng-purple mb-6">备注</h2>

              <p className="theme-text-secondary text-base leading-relaxed whitespace-pre-wrap">
                {schedule.remarks}
              </p>
            </div>
          )}
        </motion.div>

        {/* 返回按钮 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex justify-center mt-16"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/tour-dates')}
            className="px-12 py-4 bg-wangfeng-purple text-white rounded-full font-bold text-lg hover:bg-purple-700 transition-all shadow-glow"
          >
            ← 返回行程列表
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ScheduleDetail;
