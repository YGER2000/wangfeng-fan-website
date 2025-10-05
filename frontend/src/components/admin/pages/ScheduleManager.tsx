import { CalendarCheck2, MapPin, Globe2, Link2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const upcomingSchedules = [
  {
    id: 'TOUR-100',
    city: '北京',
    venue: '国家体育馆',
    date: '2025-02-18',
    status: '已发布',
    ticketUrl: 'https://tickets.example.com/beijing',
  },
  {
    id: 'TOUR-101',
    city: '深圳',
    venue: '大运中心体育馆',
    date: '2025-03-02',
    status: '待发布',
    ticketUrl: '',
  },
  {
    id: 'TOUR-102',
    city: '杭州',
    venue: '奥体中心体育馆',
    date: '2025-03-16',
    status: '调整中',
    ticketUrl: '',
  },
];

const ScheduleManager = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  return (
    <div
      className={cn(
        'rounded-2xl border border-wangfeng-purple/40 p-6 shadow-glow backdrop-blur-md',
        isLight ? 'bg-white/85 text-gray-800' : 'bg-black/55 text-gray-100'
      )}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-wangfeng-purple">行程管理</h2>
          <p className="text-xs text-gray-500">
            支持快速发布、上下线演出排期，确保前端展示实时同步
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            className={cn(
              'rounded-xl border px-3 py-2 font-medium transition-colors',
              isLight
                ? 'border-wangfeng-purple/40 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white'
                : 'border-wangfeng-purple/30 text-wangfeng-light hover:bg-wangfeng-purple/20'
            )}
          >
            新增行程
          </button>
          <button
            type="button"
            className={cn(
              'rounded-xl border px-3 py-2 font-medium transition-colors',
              isLight
                ? 'border-wangfeng-purple/20 text-gray-600 hover:bg-wangfeng-purple/10 hover:text-wangfeng-purple'
                : 'border-wangfeng-purple/20 text-gray-300 hover:bg-wangfeng-purple/20 hover:text-wangfeng-light'
            )}
          >
            批量导入
          </button>
        </div>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {upcomingSchedules.map((schedule) => (
          <div
            key={schedule.id}
            className={cn(
              'flex flex-col gap-4 rounded-xl border border-wangfeng-purple/30 p-5 transition-all hover:border-wangfeng-purple/60 hover:shadow-strong-glow',
              isLight ? 'bg-white/75' : 'bg-black/50'
            )}
          >
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="h-3.5 w-3.5 text-wangfeng-purple" />
                <span>{schedule.id}</span>
              </div>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  schedule.status === '已发布'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : schedule.status === '待发布'
                    ? 'bg-wangfeng-purple/10 text-wangfeng-purple'
                    : 'bg-amber-500/20 text-amber-300'
                )}
              >
                {schedule.status}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-wangfeng-purple">
                {schedule.city}
              </h3>
              <p className="mt-1 text-sm text-gray-400">{schedule.venue}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              <span>{schedule.date}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5" />
              <span>中国</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Globe2 className="h-3.5 w-3.5" />
              <span>{schedule.ticketUrl ? '已配置票务链接' : '暂未配置票务链接'}</span>
            </div>
            <div className="mt-auto flex gap-2 text-xs font-medium">
              <button
                type="button"
                className={cn(
                  'flex-1 rounded-lg px-3 py-2 transition-colors',
                  isLight
                    ? 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/85'
                    : 'bg-wangfeng-purple/25 text-wangfeng-light hover:bg-wangfeng-purple/35'
                )}
              >
                {schedule.status === '已发布' ? '下线行程' : '发布行程'}
              </button>
              <button
                type="button"
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 transition-colors',
                  isLight
                    ? 'border-wangfeng-purple/40 text-wangfeng-purple hover:bg-wangfeng-purple/10'
                    : 'border-wangfeng-purple/30 text-wangfeng-light hover:bg-wangfeng-purple/20'
                )}
              >
                编辑排期
              </button>
            </div>
            {schedule.ticketUrl && (
              <a
                href={schedule.ticketUrl}
                className="flex items-center gap-1 text-xs text-wangfeng-purple underline-offset-2 hover:underline"
              >
                <Link2 className="h-3.5 w-3.5" />
                票务详情链接
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleManager;
