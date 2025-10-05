import {
  FileText,
  CalendarCheck2,
  MessageSquareWarning,
  UsersRound,
  ExternalLink,
  Clock,
  Edit3,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const DashboardOverview = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const stats = [
    {
      label: '待审核文章',
      value: 12,
      trend: '+3',
      description: '最近 24 小时新增',
      icon: FileText,
    },
    {
      label: '待审核行程',
      value: 4,
      trend: '+1',
      description: '含 2 个高优',
      icon: CalendarCheck2,
    },
    {
      label: '评论举报',
      value: 6,
      trend: '-2',
      description: '本周较上周',
      icon: MessageSquareWarning,
    },
    {
      label: '活跃作者',
      value: 18,
      trend: '+5',
      description: '过去 7 日发布内容',
      icon: UsersRound,
    },
  ];

  const reviewQueue = [
    {
      id: 'POST-1208',
      title: '新专辑发行背后的故事',
      author: 'Rocky',
      submitAt: '2024-12-05 21:36',
      priority: '高',
    },
    {
      id: 'POST-1209',
      title: '巡演幕后花絮合集',
      author: '行者无疆',
      submitAt: '2024-12-05 20:18',
      priority: '中',
    },
    {
      id: 'TOUR-099',
      title: '2025 北京演唱会排期更新',
      author: '舞台统筹组',
      submitAt: '2024-12-05 19:02',
      priority: '高',
    },
  ];

  const activity = [
    {
      id: '1',
      actor: '管理员 · Lynn',
      action: '通过文章',
      target: '《汪峰经典歌曲赏析》',
      time: '10 分钟前',
      icon: CheckCircle2,
    },
    {
      id: '2',
      actor: '系统',
      action: '检测到异常登录',
      target: 'IP · 上海',
      time: '43 分钟前',
      icon: ShieldAlert,
    },
    {
      id: '3',
      actor: '管理员 · Jet',
      action: '驳回行程',
      target: '《巡演站点调整》',
      time: '1 小时前',
      icon: Edit3,
    },
  ];

  const quickActions = [
    { label: '快速审核高优稿件', description: '跳转至高优先级队列', icon: Clock },
    { label: '新建行程模板', description: '批量导入演出排期', icon: CalendarCheck2 },
    { label: '查看敏感词命中', description: '联动评论风控中心', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={cn(
                'relative overflow-hidden rounded-2xl border border-wangfeng-purple/40 p-5 shadow-glow transition-all duration-300 hover:translate-y-[-2px] hover:shadow-strong-glow',
                isLight ? 'bg-white/85 text-gray-800' : 'bg-black/50 text-gray-100'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-wangfeng-purple/80">{stat.label}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-wangfeng-purple">{stat.value}</span>
                    <span className="text-xs text-emerald-400">{stat.trend}</span>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">{stat.description}</p>
                </div>
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl border border-wangfeng-purple/50 text-wangfeng-purple/90 backdrop-blur',
                    isLight ? 'bg-white/70' : 'bg-black/60'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-wangfeng-purple/60 to-transparent"
              />
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div
          className={cn(
            'xl:col-span-2 rounded-2xl border border-wangfeng-purple/40 p-6 shadow-glow backdrop-blur-md',
            isLight ? 'bg-white/85 text-gray-800' : 'bg-black/50 text-gray-100'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-wangfeng-purple">待处理队列</h2>
              <p className="text-xs text-gray-500">优先处理高优先级的审核请求</p>
            </div>
            <button
              type="button"
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium',
                isLight
                  ? 'border-wangfeng-purple/30 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white'
                  : 'border-wangfeng-purple/40 text-wangfeng-light hover:bg-wangfeng-purple/20'
              )}
            >
              查看全部
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {reviewQueue.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex flex-col gap-3 rounded-xl border border-wangfeng-purple/30 p-4 transition-all duration-300 hover:border-wangfeng-purple/60 hover:shadow-strong-glow sm:flex-row sm:items-center sm:justify-between',
                  isLight ? 'bg-white/70' : 'bg-black/60'
                )}
              >
                <div>
                  <p className="text-xs text-gray-500">{item.id}</p>
                  <h3 className="mt-1 text-sm font-semibold text-wangfeng-purple">{item.title}</h3>
                  <p className="text-xs text-gray-400">提交人：{item.author}</p>
                </div>
                <div className="flex w-full items-end justify-between gap-3 text-xs sm:w-auto sm:flex-col sm:items-end">
                  <span className="rounded-full bg-wangfeng-purple/10 px-3 py-1 text-wangfeng-purple/90">
                    优先级·{item.priority}
                  </span>
                  <span className="text-gray-500">{item.submitAt}</span>
                  <button
                    type="button"
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-1 font-medium transition-colors',
                      isLight
                        ? 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80'
                        : 'bg-wangfeng-purple/20 text-wangfeng-light hover:bg-wangfeng-purple/30'
                    )}
                  >
                    进入审核
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div
            className={cn(
              'rounded-2xl border border-wangfeng-purple/40 p-6 shadow-glow backdrop-blur-md',
              isLight ? 'bg-white/85 text-gray-800' : 'bg-black/50 text-gray-100'
            )}
          >
            <h2 className="text-lg font-semibold text-wangfeng-purple">最新动态</h2>
            <ul className="mt-4 space-y-4">
              {activity.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id} className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl border border-wangfeng-purple/40 text-wangfeng-purple',
                        isLight ? 'bg-white/70' : 'bg-black/60'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-wangfeng-purple/90">{item.actor}</p>
                      <p className="text-xs text-gray-400">{item.action} · {item.target}</p>
                      <p className="text-[11px] text-gray-500">{item.time}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div
            className={cn(
              'rounded-2xl border border-wangfeng-purple/40 p-6 shadow-glow backdrop-blur-md',
              isLight ? 'bg-white/85 text-gray-800' : 'bg-black/50 text-gray-100'
            )}
          >
            <h2 className="text-lg font-semibold text-wangfeng-purple">快速操作</h2>
            <ul className="mt-4 space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <li
                    key={action.label}
                    className={cn(
                      'flex items-center justify-between gap-4 rounded-xl border border-wangfeng-purple/30 px-4 py-3 transition-all duration-200 hover:border-wangfeng-purple/60',
                      isLight ? 'bg-white/70' : 'bg-black/60'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-wangfeng-purple" />
                      <div>
                        <p className="text-sm font-medium text-wangfeng-purple">{action.label}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </div>
                    <TrendingUp className="h-4 w-4 text-wangfeng-purple/80" />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardOverview;
