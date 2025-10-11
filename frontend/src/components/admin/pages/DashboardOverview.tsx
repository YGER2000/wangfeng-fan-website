import { useState, useEffect } from 'react';
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
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { adminService } from '@/services/admin';
import type { DashboardStats, AdminLogResponse } from '@/services/admin';

const DashboardOverview = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AdminLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 获取统计数据
        const statsData = await adminService.getDashboardStats();
        setStats(statsData);

        // 获取最近的操作日志
        const logsData = await adminService.getRecentLogs(5);
        setRecentLogs(logsData);
      } catch (err: any) {
        console.error('加载仪表盘数据失败:', err);
        setError(err.message || '加载数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "rounded-2xl border p-6",
        isLight ? "bg-red-50 border-red-200 text-red-800" : "bg-red-900/20 border-red-500/30 text-red-200"
      )}>
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">加载失败</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statsCards = [
    {
      label: '待审核文章',
      value: stats.pending_articles,
      trend: `今日 +${stats.today_new_articles}`,
      description: '最近 24 小时新增',
      icon: FileText,
    },
    {
      label: '总用户数',
      value: stats.total_users,
      trend: `本周 +${stats.week_new_users}`,
      description: '活跃用户统计',
      icon: UsersRound,
    },
    {
      label: '文章总数',
      value: stats.total_articles,
      trend: `本月 +${stats.month_new_articles}`,
      description: '平台内容积累',
      icon: FileText,
    },
    {
      label: '评论总数',
      value: stats.total_comments,
      trend: `今日 +${stats.today_new_comments}`,
      description: '用户互动数据',
      icon: MessageSquareWarning,
    },
  ];

  const getActionIcon = (action: string) => {
    if (action.includes('approve') || action.includes('通过')) return CheckCircle2;
    if (action.includes('reject') || action.includes('驳回')) return Edit3;
    if (action.includes('ban') || action.includes('封禁')) return ShieldAlert;
    return Edit3;
  };

  const formatActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      'approve': '通过审核',
      'reject': '驳回内容',
      'ban': '封禁用户',
      'unban': '解封用户',
      'create': '创建',
      'update': '更新',
      'delete': '删除',
      'role_change': '修改角色',
    };
    return actionMap[action] || action;
  };

  const formatResourceType = (type: string) => {
    const typeMap: Record<string, string> = {
      'article': '文章',
      'user': '用户',
      'comment': '评论',
      'schedule': '行程',
      'system': '系统',
    };
    return typeMap[type] || type;
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} 小时前`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} 天前`;
  };

  const quickActions = [
    {
      label: '快速审核待审文章',
      description: '跳转至内容审核中心',
      icon: Clock,
      href: '/admin/review'
    },
    {
      label: '用户权限管理',
      description: '管理用户角色和状态',
      icon: UsersRound,
      href: '/admin/users'
    },
    {
      label: '查看系统日志',
      description: '审计操作记录',
      icon: ShieldAlert,
      href: '/admin/audit'
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((stat) => {
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
              <h2 className="text-lg font-semibold text-wangfeng-purple">系统概览</h2>
              <p className="text-xs text-gray-500">关键数据统计</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className={cn(
              'rounded-xl border border-wangfeng-purple/30 p-4',
              isLight ? 'bg-white/70' : 'bg-black/60'
            )}>
              <p className="text-xs text-gray-500">本周新增</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-wangfeng-purple">{stats.week_new_users}</span>
                <span className="text-xs text-gray-500">用户</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-wangfeng-purple">{stats.week_new_articles}</span>
                <span className="text-xs text-gray-500">文章</span>
              </div>
            </div>

            <div className={cn(
              'rounded-xl border border-wangfeng-purple/30 p-4',
              isLight ? 'bg-white/70' : 'bg-black/60'
            )}>
              <p className="text-xs text-gray-500">本月新增</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-wangfeng-purple">{stats.month_new_users}</span>
                <span className="text-xs text-gray-500">用户</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-wangfeng-purple">{stats.month_new_articles}</span>
                <span className="text-xs text-gray-500">文章</span>
              </div>
            </div>
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
              {recentLogs.length === 0 ? (
                <li className="text-sm text-gray-500 text-center py-4">暂无操作记录</li>
              ) : (
                recentLogs.map((item) => {
                  const Icon = getActionIcon(item.action);
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
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-wangfeng-purple/90 truncate">
                          {item.operator_username}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {formatActionText(item.action)} · {formatResourceType(item.resource_type)}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {formatTimeAgo(item.created_at)}
                        </p>
                      </div>
                    </li>
                  );
                })
              )}
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
                      'flex items-center justify-between gap-4 rounded-xl border border-wangfeng-purple/30 px-4 py-3 transition-all duration-200 hover:border-wangfeng-purple/60 cursor-pointer',
                      isLight ? 'bg-white/70 hover:bg-white/90' : 'bg-black/60 hover:bg-black/70'
                    )}
                    onClick={() => window.location.hash = action.href}
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
