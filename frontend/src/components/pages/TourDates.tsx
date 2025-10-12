import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
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
  // 将UTC时间转换为北京时间 (UTC+8)
  return new Date(now.getTime() + 8 * 60 * 60 * 1000);
};

const isScheduleUpcoming = (scheduleDate: string) => {
  const beijingNow = getBeiJingTime();
  const normalizedDate = normalizeDateString(scheduleDate);
  const eventDateTime = new Date(normalizedDate + 'T23:59:59');
  const eventEndDate = new Date(eventDateTime);
  eventEndDate.setDate(eventEndDate.getDate() + 1);
  eventEndDate.setHours(0, 0, 0, 0);

  console.log(`行程: ${scheduleDate}, 北京时间: ${beijingNow.toLocaleString('zh-CN')}, 结束时间: ${eventEndDate.toLocaleString('zh-CN')}, 即将举行: ${beijingNow < eventEndDate}`);

  return beijingNow < eventEndDate;
};

const TourDates = () => {
  const [schedule, setSchedule] = useState<Array<ScheduleItemResponse & { isFuture?: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'全部' | ScheduleCategory>('全部');
  const [selectedSchedule, setSelectedSchedule] = useState<(ScheduleItemResponse & { isFuture?: boolean }) | null>(null);

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

  return (
    <div className="min-h-screen bg-transparent theme-text-primary py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bebas tracking-wider theme-text-primary mb-4">
            汪峰 <span className="text-wangfeng-purple animate-pulse-glow">行程信息</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple mb-6">
            从巡演到综艺，全景记录汪峰的每一步脚印
          </h2>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="bg-black/70 rounded-2xl border border-wangfeng-purple/40 shadow-glow p-8 backdrop-blur-sm">
            <h3 className="text-3xl font-bold text-wangfeng-purple mb-8 text-center tracking-wider">行程统计</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-black/50 rounded-xl border border-wangfeng-purple/30 p-6 transition-all duration-300 hover:shadow-glow hover:border-wangfeng-purple/50">
                <div className="text-5xl font-bold text-white mb-3">
                  {schedule.length}
                </div>
                <div className="text-lg text-wangfeng-purple/80 font-medium">总行程数量</div>
              </div>
              <div className="bg-black/50 rounded-xl border border-wangfeng-purple/30 p-6 transition-all duration-300 hover:shadow-glow hover:border-wangfeng-purple/50">
                <div className="text-5xl font-bold text-wangfeng-purple mb-3 animate-pulse-glow">
                  {schedule.filter((c) => c.isFuture).length}
                </div>
                <div className="text-lg text-wangfeng-purple/80 font-medium">即将举行</div>
              </div>
              <div className="bg-black/50 rounded-xl border border-wangfeng-purple/30 p-6 transition-all duration-300 hover:shadow-glow hover:border-wangfeng-purple/50">
                <div className="text-5xl font-bold text-gray-300 mb-3">
                  {schedule.length - schedule.filter((c) => c.isFuture).length}
                </div>
                <div className="text-lg text-wangfeng-purple/80 font-medium">已完成行程</div>
              </div>
            </div>
          </div>
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

        <div className="max-w-6xl mx-auto relative">
          {/* Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-wangfeng-purple"></div>
          
          {/* Concert Items */}
          <div className="space-y-12">
            {filteredSchedule.map((item, index) => {
              const isLeft = index % 2 === 0;
              // 使用压缩图显示在列表中，如果没有压缩图则使用原图
              const posterSrc = withBasePath(item.image_thumb ?? item.image ?? 'images/concerts/xiangxinweilai_poster.jpg');

              const card = (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedSchedule(item)}
                  className={cn(
                    'p-6 rounded-xl border shadow-lg transition-all duration-300 cursor-pointer flex',
                    item.isFuture
                      ? 'bg-wangfeng-purple/20 border-wangfeng-purple/50 shadow-wangfeng-purple/25'
                      : 'theme-bg-card theme-border-primary shadow-gray-900/50'
                  )}
                >
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center mb-3">
                      <div
                        className={cn(
                          'px-3 py-1 rounded-full text-sm font-bold',
                          item.isFuture
                            ? 'bg-wangfeng-purple text-white'
                            : 'bg-gray-700 theme-text-secondary'
                        )}
                      >
                        {new Date(item.date).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      {item.isFuture && (
                        <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                          即将举行
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-2xl font-bold text-wangfeng-purple animate-pulse-glow">
                        {item.city}
                      </h3>
                      {item.venue && (
                        <p className="theme-text-secondary text-sm">
                          📍 {item.venue}
                        </p>
                      )}
                      <p className="theme-text-primary font-medium leading-relaxed line-clamp-2">
                        {item.theme}
                      </p>
                      {item.description && (
                        <p className="theme-text-secondary text-sm leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-wangfeng-purple/80 mt-auto">
                        <span className="h-2 w-2 rounded-full bg-wangfeng-purple"></span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-32 lg:w-36 flex-shrink-0 ml-6">
                    <div className="relative rounded-lg overflow-hidden border border-wangfeng-purple/40 shadow-lg h-full aspect-[2/3]">
                      <img
                        src={posterSrc}
                        alt={`${item.theme} 海报`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </motion.div>
              );

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="relative"
                >
                  <div className="flex items-center justify-center gap-8">
                    {/* Left side content or empty space */}
                    <div className="flex-1 flex justify-end">
                      {isLeft && (
                        <div className="w-full max-w-xl">
                          {card}
                        </div>
                      )}
                    </div>

                    {/* Timeline Dot - Always in center */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-wangfeng-purple border-4 theme-border-primary shadow-lg"></div>
                      </div>
                    </div>

                    {/* Right side content or empty space */}
                    <div className="flex-1 flex justify-start">
                      {!isLeft && (
                        <div className="w-full max-w-xl">
                          {card}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>

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
                className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-wangfeng-purple/40 shadow-strong-glow theme-bg-card p-8"
              >
                {/* 关闭按钮 */}
                <button
                  onClick={() => setSelectedSchedule(null)}
                  className="absolute right-4 top-4 p-2 rounded-lg transition-colors hover:bg-white/10"
                >
                  <X className="h-6 w-6 theme-text-primary" />
                </button>

                {/* 标题和状态 */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-4xl font-bebas tracking-wider text-wangfeng-purple">
                      {selectedSchedule.city}
                    </h2>
                    {selectedSchedule.isFuture && (
                      <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full animate-pulse-glow">
                        即将举行
                      </span>
                    )}
                  </div>
                  <p className="text-sm theme-text-muted">
                    {new Date(selectedSchedule.date).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* 左侧：海报（原图） */}
                  <div className="flex flex-col gap-4">
                    <div className="relative rounded-xl overflow-hidden border border-wangfeng-purple/40 shadow-lg">
                      <img
                        src={withBasePath(selectedSchedule.image ?? 'images/concerts/xiangxinweilai_poster.jpg')}
                        alt={`${selectedSchedule.theme} 海报`}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-wangfeng-purple/80">
                      <span className="h-2 w-2 rounded-full bg-wangfeng-purple"></span>
                      <span>{selectedSchedule.category}</span>
                    </div>
                  </div>

                  {/* 右侧：详细信息 */}
                  <div className="flex flex-col gap-6">
                    <div>
                      <h3 className="text-sm font-bold text-wangfeng-purple mb-2">行程主题</h3>
                      <p className="theme-text-primary text-lg leading-relaxed">
                        {selectedSchedule.theme}
                      </p>
                    </div>

                    {selectedSchedule.venue && (
                      <div>
                        <h3 className="text-sm font-bold text-wangfeng-purple mb-2">场馆地点</h3>
                        <p className="theme-text-primary flex items-start gap-2">
                          <span className="text-wangfeng-purple">📍</span>
                          <span>{selectedSchedule.venue}</span>
                        </p>
                      </div>
                    )}

                    {selectedSchedule.description && (
                      <div>
                        <h3 className="text-sm font-bold text-wangfeng-purple mb-2">补充说明</h3>
                        <p className="theme-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedSchedule.description}
                        </p>
                      </div>
                    )}

                    <div className="mt-auto pt-6 border-t theme-border-primary">
                      <button
                        onClick={() => setSelectedSchedule(null)}
                        className="w-full px-6 py-3 bg-wangfeng-purple text-white rounded-lg font-semibold hover:bg-wangfeng-purple/80 transition-colors"
                      >
                        关闭
                      </button>
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

export default TourDates;
