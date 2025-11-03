import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  Calendar,
  Video,
  Image,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface DashboardStats {
  total_users: number;
  total_articles: number;
  total_comments: number;
  total_schedules: number;
  pending_articles: number;
  today_new_users: number;
  today_new_articles: number;
  today_new_comments: number;
  week_new_users: number;
  week_new_articles: number;
  week_new_comments: number;
  month_new_users: number;
  month_new_articles: number;
  month_new_comments: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
  link?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color, link, loading }) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const content = (
    <Card
      className={cn(
        'border transition-all',
        isLight
          ? 'bg-white border-gray-200 hover:border-wangfeng-purple/40'
          : 'bg-black/60 border-wangfeng-purple/40 hover:shadow-strong-glow',
        link && 'cursor-pointer'
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={cn(
          "text-sm font-medium",
          isLight ? "text-gray-600" : "text-gray-400"
        )}>{title}</CardTitle>
        <div className={cn('p-2 rounded-lg', color)}>{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-wangfeng-purple" />
            <span className="text-sm text-gray-500">加载中...</span>
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold text-wangfeng-purple">{value}</div>
            {trend && <p className={cn(
              "text-xs mt-1",
              isLight ? "text-gray-500" : "text-gray-500"
            )}>{trend}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
};

interface RecentActivity {
  id: string;
  action: string;
  operator_username: string;
  resource_type: string;
  description: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const { token } = useAuth();
  const isLight = theme === 'white';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingSchedules, setPendingSchedules] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [recentLogs, setRecentLogs] = useState<RecentActivity[]>([]);

  // 加载仪表盘数据
  useEffect(() => {
    loadDashboardData();
  }, [token]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 检查 token
      if (!token) {
        throw new Error('未登录或登录已过期，请重新登录');
      }

      console.log('[Dashboard] 开始加载数据...');
      console.log('[Dashboard] Token:', token ? token.substring(0, 20) + '...' : 'null');

      // 加载统计数据
      const statsResponse = await fetch('http://localhost:1994/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[Dashboard] Stats API 响应状态:', statsResponse.status);

      if (!statsResponse.ok) {
        const errorData = await statsResponse.json().catch(() => ({}));
        console.error('[Dashboard] Stats API 错误:', errorData);
        throw new Error(errorData.detail || `加载统计数据失败 (${statsResponse.status})`);
      }

      const statsData = await statsResponse.json();
      console.log('[Dashboard] Stats 数据:', statsData);
      setStats(statsData);

      // 加载待审核行程数量
      const schedulesResponse = await fetch('http://localhost:1994/api/admin/schedules?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json();
        const pending = schedulesData.items.filter((s: any) => s.review_status === 'pending').length;
        setPendingSchedules(pending);
      }

      // 加载视频总数
      const videosCountResponse = await fetch('http://localhost:1994/api/videos/count');
      if (videosCountResponse.ok) {
        const videosData = await videosCountResponse.json();
        setTotalVideos(videosData.count);
      }

      // 加载最近操作日志
      const logsResponse = await fetch('http://localhost:1994/api/admin/logs?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setRecentLogs(logsData.items || []);
      }
    } catch (err: any) {
      console.error('加载仪表盘数据失败:', err);
      setError(err.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'article':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'schedule':
        return <Calendar className="w-4 h-4 text-green-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-500" />;
      case 'user':
        return <Users className="w-4 h-4 text-orange-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return '刚刚';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (error) {
    const isAuthError = error.includes('未登录') || error.includes('登录已过期') || error.includes('Not authenticated');

    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className={cn("text-lg font-medium mb-2", isLight ? "text-gray-900" : "text-white")}>
            {isAuthError ? '需要登录' : '加载失败'}
          </p>
          <p className={cn("mb-6 text-sm", isLight ? "text-gray-600" : "text-gray-400")}>
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            {isAuthError ? (
              <Link
                to="/admin"
                className="px-4 py-2 bg-wangfeng-purple text-white rounded-lg hover:bg-wangfeng-purple/90 transition-colors"
              >
                前往登录
              </Link>
            ) : (
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-wangfeng-purple text-white rounded-lg hover:bg-wangfeng-purple/90 transition-colors"
              >
                重试
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="待审文章"
          value={stats?.pending_articles ?? 0}
          icon={<FileText className="w-5 h-5" />}
          color="bg-wangfeng-purple/20"
          link="/admin/articles/list"
          trend={`今日新增 ${stats?.today_new_articles ?? 0} 篇`}
          loading={loading}
        />
        <StatCard
          title="待审行程"
          value={pendingSchedules}
          icon={<Calendar className="w-5 h-5" />}
          color="bg-blue-500/20"
          link="/admin/manage/schedules/list"
          trend={`本周新增 ${stats?.week_new_articles ?? 0} 条`}
          loading={loading}
        />
        <StatCard
          title="待审视频"
          value="—"
          icon={<Video className="w-5 h-5" />}
          color="bg-purple-500/20"
          link="/admin/videos/list"
          trend="(暂未实现审核功能)"
          loading={loading}
        />
        <StatCard
          title="待审图片"
          value="—"
          icon={<Image className="w-5 h-5" />}
          color="bg-green-500/20"
          link="/admin/gallery/list"
          trend="(暂未实现审核功能)"
          loading={loading}
        />
      </div>

      {/* 内容统计 */}
      <Card
        className={cn(
          'border',
          isLight ? 'bg-white border-gray-200' : 'bg-black/60 border-wangfeng-purple/40'
        )}
      >
        <CardHeader>
          <CardTitle className="text-wangfeng-purple flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            内容统计
          </CardTitle>
          <CardDescription>各类型内容的总数统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-wangfeng-purple">
                {loading ? '...' : stats?.total_articles ?? 0}
              </div>
              <div className="text-sm text-gray-500 mt-2">总文章数</div>
              <Link
                to="/admin/articles/list"
                className="text-xs text-wangfeng-purple hover:underline mt-1 inline-block"
              >
                查看详情 →
              </Link>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-wangfeng-purple">
                {loading ? '...' : stats?.total_schedules ?? 0}
              </div>
              <div className="text-sm text-gray-500 mt-2">总行程数</div>
              <Link
                to="/admin/manage/schedules/list"
                className="text-xs text-wangfeng-purple hover:underline mt-1 inline-block"
              >
                查看详情 →
              </Link>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-wangfeng-purple">
                {loading ? '...' : totalVideos}
              </div>
              <div className="text-sm text-gray-500 mt-2">总视频数</div>
              <Link
                to="/admin/videos/list"
                className="text-xs text-wangfeng-purple hover:underline mt-1 inline-block"
              >
                查看详情 →
              </Link>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-wangfeng-purple">
                {loading ? '...' : stats?.total_users ?? 0}
              </div>
              <div className="text-sm text-gray-500 mt-2">总用户数</div>
              <div className="text-xs text-gray-400 mt-1">(暂无管理页面)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 近期增长趋势 */}
        <Card
          className={cn(
            'border',
            isLight ? 'bg-white border-gray-200' : 'bg-black/60 border-wangfeng-purple/40'
          )}
        >
          <CardHeader>
            <CardTitle className="text-wangfeng-purple flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              近期增长趋势
            </CardTitle>
            <CardDescription>文章和用户的增长统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={cn(
                'p-4 rounded-lg border',
                isLight ? 'bg-gray-50 border-gray-200' : 'bg-black/40 border-wangfeng-purple/30'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('text-sm font-medium', isLight ? 'text-gray-700' : 'text-gray-300')}>
                    今日新增
                  </span>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-wangfeng-purple">
                      {loading ? '...' : stats?.today_new_articles ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">文章</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-wangfeng-purple">
                      {loading ? '...' : stats?.today_new_users ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">用户</div>
                  </div>
                </div>
              </div>

              <div className={cn(
                'p-4 rounded-lg border',
                isLight ? 'bg-gray-50 border-gray-200' : 'bg-black/40 border-wangfeng-purple/30'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('text-sm font-medium', isLight ? 'text-gray-700' : 'text-gray-300')}>
                    本周新增
                  </span>
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-wangfeng-purple">
                      {loading ? '...' : stats?.week_new_articles ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">文章</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-wangfeng-purple">
                      {loading ? '...' : stats?.week_new_users ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">用户</div>
                  </div>
                </div>
              </div>

              <div className={cn(
                'p-4 rounded-lg border',
                isLight ? 'bg-gray-50 border-gray-200' : 'bg-black/40 border-wangfeng-purple/30'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('text-sm font-medium', isLight ? 'text-gray-700' : 'text-gray-300')}>
                    本月新增
                  </span>
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-wangfeng-purple">
                      {loading ? '...' : stats?.month_new_articles ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">文章</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-wangfeng-purple">
                      {loading ? '...' : stats?.month_new_users ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">用户</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 最近操作日志 */}
        <Card
          className={cn(
            'border',
            isLight ? 'bg-white border-gray-200' : 'bg-black/60 border-wangfeng-purple/40'
          )}
        >
          <CardHeader>
            <CardTitle className="text-wangfeng-purple flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              最近操作日志
            </CardTitle>
            <CardDescription>最近的管理操作记录</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="h-8 w-8 animate-spin text-wangfeng-purple" />
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <XCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">暂无操作记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      isLight ? 'bg-gray-50 border-gray-200' : 'bg-black/30 border-wangfeng-purple/20'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getLogIcon(log.resource_type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm line-clamp-2', isLight ? 'text-gray-900' : 'text-gray-200')}>
                          {log.description || log.action}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span className="truncate">{log.operator_username}</span>
                          <span>·</span>
                          <span className="whitespace-nowrap">{formatTimeAgo(log.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-center">
              <Link
                to="/admin-old/audit"
                className="text-sm text-wangfeng-purple hover:underline"
              >
                查看完整日志 →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 刷新按钮 */}
      <div className="flex justify-center">
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            loading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          {loading ? '加载中...' : '刷新数据'}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
