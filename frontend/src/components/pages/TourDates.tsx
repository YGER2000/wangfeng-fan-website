import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
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
  '音乐节',
  '商演',
  '综艺活动',
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
          <div className="bg-secondary-dark rounded-xl border border-wangfeng-purple/30 shadow-glow p-8">
            <h3 className="text-2xl font-bold text-wangfeng-purple mb-6 text-center">行程统计</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold theme-text-primary">
                  {schedule.length}
                </div>
                <div className="theme-text-muted">总行程数量</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-wangfeng-purple">
                  {schedule.filter((c) => c.isFuture).length}
                </div>
                <div className="theme-text-muted">即将举行</div>
              </div>
              <div>
                <div className="text-3xl font-bold theme-text-secondary">
                  {schedule.length - schedule.filter((c) => c.isFuture).length}
                </div>
                <div className="theme-text-muted">已完成行程</div>
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
                      : 'theme-bg-card theme-text-primary theme-border-primary hover:border-wangfeng-purple/60'
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
              const timelineNumber = item.id;
              const posterSrc = withBasePath(item.image ?? 'images/concerts/xiangxinweilai_poster.jpg');
              const isConcert = item.category === '演唱会';

              const card = (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    'p-6 rounded-xl border shadow-lg transition-all duration-300',
                    item.isFuture
                      ? 'bg-wangfeng-purple/20 border-wangfeng-purple/50 shadow-wangfeng-purple/25'
                      : 'theme-bg-card theme-border-primary shadow-gray-900/50'
                  )}
                >
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
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-3">
                      <h3 className="text-2xl font-bold text-wangfeng-purple animate-pulse-glow">
                        {item.city}
                      </h3>
                      {item.venue && (
                        <p className="theme-text-secondary text-sm">
                          📍 {item.venue}
                        </p>
                      )}
                      <p className="theme-text-primary font-medium leading-relaxed">
                        {item.theme}
                      </p>
                      {item.description && (
                        <p className="theme-text-secondary text-sm leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-wangfeng-purple/80">
                        <span className="h-2 w-2 rounded-full bg-wangfeng-purple"></span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                    <div className="md:w-36 lg:w-40 flex-shrink-0 mx-auto md:mx-0">
                      <div className="relative rounded-lg overflow-hidden border border-wangfeng-purple/40 shadow-lg aspect-[3/5]">
                        <img
                          src={posterSrc}
                          alt={`${item.theme} 海报`}
                          className="w-full h-full object-cover"
                        />
                      </div>
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
                        <div className="w-full max-w-md">
                          {card}
                        </div>
                      )}
                    </div>

                    {/* Timeline Dot - Always in center */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 flex items-center justify-center">
                        {isConcert ? (
                          <div className="w-12 h-12 bg-wangfeng-purple rounded-full border-4 theme-border-primary shadow-lg flex items-center justify-center">
                            <span className="theme-text-primary font-bold text-sm">{timelineNumber}</span>
                          </div>
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-wangfeng-purple border-4 theme-border-primary shadow-lg"></div>
                        )}
                      </div>
                    </div>

                    {/* Right side content or empty space */}
                    <div className="flex-1 flex justify-start">
                      {!isLeft && (
                        <div className="w-full max-w-md">
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
      </div>
    </div>
  );
};

export default TourDates;
