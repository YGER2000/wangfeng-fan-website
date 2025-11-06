import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, withBasePath } from '@/lib/utils';
import {
  scheduleAPI,
  ScheduleItemResponse,
  ScheduleCategory as ApiScheduleCategory,
} from '@/utils/api';

type ScheduleCategory = ApiScheduleCategory;

const categories: Array<'全部' | ScheduleCategory> = [
  '全部',
  '演唱会',
  'livehouse',
  '音乐节',
  '商演拼盘',
  '综艺晚会',
  '直播',
  '商业活动',
  '其他',
];

const normalizeDateString = (date: string) => {
  const parts = date.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return date;
};

// 获取北京时间
const getBeiJingTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 8 * 60 * 60 * 1000);
};

const isScheduleUpcoming = (scheduleDate: string) => {
  const beijingNow = getBeiJingTime();
  const normalizedDate = normalizeDateString(scheduleDate);
  const eventDateTime = new Date(normalizedDate + 'T23:59:59');
  const eventEndDate = new Date(eventDateTime);
  eventEndDate.setDate(eventEndDate.getDate() + 1);
  eventEndDate.setHours(0, 0, 0, 0);

  return beijingNow < eventEndDate;
};

// 获取月份键 (YYYY-MM)
const getMonthKey = (date: string): string => {
  const [year, month] = date.split('-');
  return `${year}-${month}`;
};

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

const TourDates = () => {
  const [schedule, setSchedule] = useState<Array<ScheduleItemResponse & { isFuture?: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'全部' | ScheduleCategory>('全部');
  const [selectedSchedule, setSelectedSchedule] = useState<(ScheduleItemResponse & { isFuture?: boolean }) | null>(null);
  const [posterIndex, setPosterIndex] = useState(0);
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const timelineRef = useRef<HTMLDivElement>(null);

  // 获取海报列表（优先使用 images，否则用单个 image）
  const getPosterList = (): string[] => {
    if (!selectedSchedule) return [];
    if (selectedSchedule.images && selectedSchedule.images.length > 0) {
      return selectedSchedule.images;
    }
    return selectedSchedule.image ? [selectedSchedule.image] : [];
  };

  const posterList = getPosterList();
  const totalPosters = posterList.length || 1;
  const currentPoster = posterList[posterIndex] || selectedSchedule?.image;

  // 海报导航函数
  const handlePrevPoster = () => {
    setPosterIndex(Math.max(0, posterIndex - 1));
  };

  const handleNextPoster = () => {
    setPosterIndex(Math.min(totalPosters - 1, posterIndex + 1));
  };

  const handleMonthClick = (monthKey: string) => {
    // 滚动到该月份的卡片
    const element = monthRefs.current.get(monthKey);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    const loadConcerts = async () => {
      try {
        const data = await scheduleAPI.list();

        const scheduleWithStatus = data.map((item) => {
          const normalizedDate = normalizeDateString(item.date);
          return {
            ...item,
            date: normalizedDate,
            category: item.category ?? '演唱会',
            image: item.image ?? 'images/concerts/xiangxinweilai_poster.jpg',
            isFuture: isScheduleUpcoming(normalizedDate),
          };
        });

        scheduleWithStatus.sort((a, b) => {
          const timeA = new Date(a.date).getTime();
          const timeB = new Date(b.date).getTime();
          return timeB - timeA;
        });

        setSchedule(scheduleWithStatus);
        setLoading(false);
      } catch (error) {
        console.error('Error loading concerts:', error);
        setLoading(false);
      }
    };

    loadConcerts();
  }, []);

  const filteredSchedule = useMemo(() => {
    if (selectedCategory === '全部') {
      return schedule;
    }
    return schedule.filter((item) => item.category === selectedCategory);
  }, [schedule, selectedCategory]);

  // 按月份分组已过滤的行程
  const groupedSchedules = useMemo(() => {
    const grouped = new Map<string, (ScheduleItemResponse & { isFuture?: boolean })[]>();
    filteredSchedule.forEach((item) => {
      const monthKey = getMonthKey(item.date);
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, []);
      }
      grouped.get(monthKey)!.push(item);
    });

    // 按月份降序排列
    const sortedEntries = Array.from(grouped.entries()).sort(([a], [b]) => {
      return b.localeCompare(a);
    });

    return new Map(sortedEntries);
  }, [filteredSchedule]);

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

  // 格式化月份显示文本
  const formatMonthDisplay = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    return `${year}年${parseInt(month)}月`;
  };

  return (
    <div className="min-h-screen bg-transparent theme-text-primary py-20">
      <div className="container mx-auto px-4">
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
              汪峰 <span className="text-wangfeng-purple">行程信息</span>
            </motion.h1>
            <motion.div
              className="absolute -top-4 -right-4 text-wangfeng-purple/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-12 h-12 md:w-16 md:h-16" />
            </motion.div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple mb-6">
            从巡演到综艺，全景记录汪峰的每一步脚印
          </h2>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'px-4 py-2 rounded-full border transition-all duration-300 text-sm md:text-base',
                    isActive
                      ? 'bg-wangfeng-purple text-white border-wangfeng-purple shadow-glow'
                      : 'bg-transparent theme-border-primary theme-text-secondary hover:border-wangfeng-purple hover:text-wangfeng-purple'
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* 时间轴+卡片布局 */}
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-12 md:gap-16">
            {/* 左侧：时间轴 - 动态生成，只显示有数据的月份 */}
            <div className="relative w-20 flex-shrink-0" ref={timelineRef}>
              {/* 竖线 */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-wangfeng-purple/30 transform -translate-x-1/2"></div>

              {/* 月份点 - 按照右侧卡片的顺序显示 */}
              <div className="relative min-h-screen">
                {Array.from(groupedSchedules.entries()).map(([monthKey, monthSchedules], idx) => {
                  return (
                    <TimelinePoint
                      key={monthKey}
                      monthKey={monthKey}
                      monthSchedules={monthSchedules}
                      monthRefs={monthRefs}
                      handleMonthClick={handleMonthClick}
                      formatMonthDisplay={formatMonthDisplay}
                      idx={idx}
                    />
                  );
                })}
              </div>
            </div>

            {/* 右侧：卡片网格 - 按月份显示 */}
            <div className="flex-1">
              <div className="space-y-16">
                {Array.from(groupedSchedules.entries()).map(([monthKey, monthSchedules]) => {
                  return (
                    <motion.div
                      key={monthKey}
                      ref={(el) => {
                        if (el) {
                          monthRefs.current.set(monthKey, el);
                        }
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      className="scroll-mt-20"
                    >
                      {/* 月份标题 */}
                      <div className="mb-8">
                        <h3 className="text-3xl font-bebas tracking-wider text-wangfeng-purple">
                          {formatMonthDisplay(monthKey)}
                        </h3>
                        <div className="h-0.5 w-12 bg-wangfeng-purple mt-2"></div>
                      </div>

                      {/* 卡片网格 - 左右布局，总比例 5:4，左3:4海报，右2:4详细信息 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {monthSchedules.map((item) => {
                          const posterSrc = withBasePath(
                            item.image_thumb ?? item.image ?? 'images/concerts/xiangxinweilai_poster.jpg'
                          );

                          return (
                            <motion.div
                              key={item.id}
                              whileHover={{ scale: 1.02 }}
                              onClick={() => {
                                setSelectedSchedule(item);
                                setPosterIndex(0);
                              }}
                              className={cn(
                                'rounded-lg overflow-hidden border shadow-lg transition-all duration-300 cursor-pointer group flex schedule-card'
                              )}
                              style={{ aspectRatio: '4/4' }}
                            >
                              {/* 左侧：海报图片 - 3:4 比例 */}
                              <div className="relative w-3/4 overflow-hidden bg-gray-900 flex-shrink-0">
                                <img
                                  src={posterSrc}
                                  alt={`${item.theme} 海报`}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>

                              {/* 右侧：详细信息 - 1:4 比例 */}
                              <div className="w-1/4 p-2 flex flex-col">
                                {/* 上部：分类标签 */}
                                <div className="flex justify-center pb-2">
                                  <span className={cn(
                                    'text-xs font-bold text-white px-2 py-1 rounded',
                                    getCategoryColor(item.category)
                                  )}>
                                    {item.category}
                                  </span>
                                </div>

                                {/* 中部：城市名称（纵向文字） */}
                                <div className="flex-grow flex flex-col justify-center items-center py-2">
                                  <div className="flex flex-col items-center gap-0">
                                    {item.city.split('').map((char, idx) => (
                                      <h4 key={idx} className="font-black text-wangfeng-purple text-3xl leading-tight">
                                        {char}
                                      </h4>
                                    ))}
                                  </div>
                                </div>

                                {/* 下部：时间 */}
                                <div className="flex justify-center pt-1">
                                  <p className="text-xs theme-text-secondary text-center">
                                    {new Date(item.date).toLocaleDateString('zh-CN', {
                                      month: 'numeric',
                                      day: 'numeric',
                                    })}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 如果没有结果 */}
        {filteredSchedule.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="theme-text-secondary text-lg">
              暂无该分类下的行程信息
            </p>
          </motion.div>
        )}

        {/* 详情弹窗 */}
        {selectedSchedule && typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => setSelectedSchedule(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-wangfeng-purple/40 shadow-strong-glow theme-bg-card"
              >
                {/* 关闭按钮 */}
                <button
                  onClick={() => setSelectedSchedule(null)}
                  className="absolute right-6 top-6 p-2 z-10 rounded-lg transition-colors hover:bg-white/10"
                >
                  <X className="h-6 w-6 theme-text-primary" />
                </button>

                {/* 主体：左右布局 */}
                <div className="flex h-full overflow-y-auto">
                  {/* 左侧：海报和导航 - 宽度约 55% */}
                  <div className="w-3/5 flex flex-col items-center justify-center bg-gradient-to-b from-wangfeng-purple/5 to-transparent p-8 relative">
                    {/* 海报容器 */}
                    <div className="relative w-full max-w-sm aspect-[3/4] rounded-xl overflow-hidden shadow-strong-glow border border-wangfeng-purple/40 bg-gray-900 group">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={posterIndex}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          src={withBasePath(currentPoster ?? 'images/concerts/xiangxinweilai_poster.jpg')}
                          alt={`${selectedSchedule.theme} 海报`}
                          className="w-full h-full object-cover"
                        />
                      </AnimatePresence>

                      {/* 海报计数器 */}
                      <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 text-white text-xs rounded-full backdrop-blur">
                        {posterIndex + 1}/{totalPosters}
                      </div>

                      {/* 导航按钮 - 仅当有多张海报时显示 */}
                      {totalPosters > 1 && (
                        <>
                          {/* 上一张按钮 */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={handlePrevPoster}
                            disabled={posterIndex === 0}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            aria-label="上一张海报"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </motion.button>

                          {/* 下一张按钮 */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={handleNextPoster}
                            disabled={posterIndex === totalPosters - 1}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            aria-label="下一张海报"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 右侧：详细信息 - 宽度约 45% */}
                  <div className="w-2/5 flex flex-col p-8 overflow-y-auto">
                    {/* 顶部：分类标签 */}
                    <div className="mb-6">
                      <span className={cn(
                        'inline-block px-4 py-2 text-xs font-bold text-white rounded-full',
                        getCategoryColor(selectedSchedule.category)
                      )}>
                        {selectedSchedule.category}
                      </span>
                    </div>

                    {/* 城市和日期 */}
                    <div className="mb-8 pb-6 border-b border-wangfeng-purple/20">
                      <h2 className="text-5xl font-bebas tracking-wider text-wangfeng-purple mb-3">
                        {selectedSchedule.city}
                      </h2>
                      <p className="text-sm theme-text-muted">
                        {new Date(selectedSchedule.date).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    {/* 中部：详细信息 */}
                    <div className="flex-grow space-y-6">
                      {/* 行程主题 */}
                      <div>
                        <h3 className="text-xs font-bold text-wangfeng-purple uppercase tracking-widest mb-3">
                          行程主题
                        </h3>
                        <p className="theme-text-primary text-base leading-relaxed">
                          {selectedSchedule.theme}
                        </p>
                      </div>

                      {/* 场馆地点 */}
                      {selectedSchedule.venue && (
                        <div>
                          <h3 className="text-xs font-bold text-wangfeng-purple uppercase tracking-widest mb-3">
                            场馆地点
                          </h3>
                          <div className="flex items-start gap-3">
                            <span className="text-wangfeng-purple text-lg mt-0.5">📍</span>
                            <p className="theme-text-primary text-base leading-relaxed">
                              {selectedSchedule.venue}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 补充说明 */}
                      {selectedSchedule.description && (
                        <div>
                          <h3 className="text-xs font-bold text-wangfeng-purple uppercase tracking-widest mb-3">
                            补充说明
                          </h3>
                          <p className="theme-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                            {selectedSchedule.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 底部：按钮 */}
                    <div className="mt-8 pt-6 border-t border-wangfeng-purple/20">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const dateStr = selectedSchedule.date.replace(/-/g, '');
                          const cleanedTheme = selectedSchedule.theme.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s-]/g, '').trim();
                          const theme = cleanedTheme.substring(0, 20).replace(/\s+/g, '-').toLowerCase();
                          const slug = `${dateStr}-${theme}`;

                          window.scrollTo(0, 0);
                          window.location.href = `/#/article/${slug}`;
                        }}
                        className="w-full px-6 py-3 bg-gradient-to-r from-wangfeng-purple to-wangfeng-light text-white rounded-lg font-semibold hover:shadow-glow transition-all"
                      >
                        查看详情
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      </div>
    </div>
  );
};

// 时间轴点组件 - 使用 Intersection Observer 来动态跟踪位置
interface TimelinePointProps {
  monthKey: string;
  monthSchedules: Array<ScheduleItemResponse & { isFuture?: boolean }>;
  monthRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  handleMonthClick: (monthKey: string) => void;
  formatMonthDisplay: (monthKey: string) => string;
  idx: number;
}

const TimelinePoint = ({
  monthKey,
  monthSchedules,
  monthRefs,
  handleMonthClick,
  formatMonthDisplay,
  idx,
}: TimelinePointProps) => {
  const [offsetTop, setOffsetTop] = useState(0);
  const pointRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      const monthElement = monthRefs.current.get(monthKey);
      if (monthElement && pointRef.current) {
        // 获取卡片相对于视口的位置
        const rect = monthElement.getBoundingClientRect();
        // 计算卡片的中点
        const middle = rect.height / 2;
        // 设置点的位置为相对于其容器的位置
        setOffsetTop(rect.top - (pointRef.current.parentElement?.getBoundingClientRect().top || 0) + middle);
      }
    };

    // 初始更新
    updatePosition();

    // 监听滚动事件
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [monthKey, monthRefs]);

  return (
    <motion.div
      ref={pointRef}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: idx * 0.1 }}
      style={{
        position: 'absolute',
        top: `${offsetTop}px`,
        width: '100%',
        transform: 'translateY(-50%)',
      }}
    >
      {/* 时间轴点 - 可点击 */}
      <button
        onClick={() => handleMonthClick(monthKey)}
        className="absolute left-1/2 transform -translate-x-1/2 group"
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          {/* 外圈脉冲动画（仅在该月有未来行程时显示） */}
          {monthSchedules.some((s) => s.isFuture) && (
            <motion.div
              className="absolute inset-0 rounded-full bg-wangfeng-purple/20"
              animate={{ scale: [1, 1.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          {/* 中心点 */}
          <div className="w-4 h-4 rounded-full bg-wangfeng-purple border-2 border-white shadow-lg shadow-wangfeng-purple/50 hover:scale-125 transition-transform" />
        </div>
      </button>

      {/* 月份标签 */}
      <div className="absolute left-1/2 transform -translate-x-1/2 ml-12 whitespace-nowrap -translate-y-1/2">
        <p className="text-sm font-bold text-wangfeng-purple">
          {formatMonthDisplay(monthKey)}
        </p>
        <p className="text-xs theme-text-muted">
          {monthSchedules.length} 场
        </p>
      </div>
    </motion.div>
  );
};

export default TourDates;
