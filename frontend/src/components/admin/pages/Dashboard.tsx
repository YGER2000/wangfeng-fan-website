import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import {
  FileText,
  Calendar,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Users,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
  link?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color, link }) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const content = (
    <Card
      className={cn(
        'border-wangfeng-purple/40 transition-all hover:shadow-strong-glow',
        isLight ? 'bg-white/90' : 'bg-black/60'
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        <div className={cn('p-2 rounded-lg', color)}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-wangfeng-purple">{value}</div>
        {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
};

interface QueueItem {
  id: string;
  title: string;
  author: string;
  type: 'article' | 'tour';
  submittedAt: string;
  priority: 'high' | 'medium' | 'low';
}

interface AuditLog {
  id: string;
  action: string;
  operator: string;
  timestamp: string;
  type: 'danger' | 'warning' | 'info';
}

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const stats = [
    {
      title: '待审文章',
      value: 12,
      icon: <FileText className="w-5 h-5" />,
      color: 'bg-wangfeng-purple/20',
      link: '/admin/review',
      trend: '+3 篇新提交',
    },
    {
      title: '待审行程',
      value: 5,
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-blue-500/20',
      link: '/admin/schedules',
      trend: '本周新增 2 条',
    },
    {
      title: '评论举报',
      value: 8,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-red-500/20',
      link: '/admin/comments',
      trend: '待处理',
    },
    {
      title: '7日发布数',
      value: 45,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-green-500/20',
      trend: '比上周 +12%',
    },
  ];

  const queueItems: QueueItem[] = [
    {
      id: '1',
      title: '汪峰新专辑《存在》幕后制作故事',
      author: '音乐评论员',
      type: 'article',
      submittedAt: '2小时前',
      priority: 'high',
    },
    {
      id: '2',
      title: '2024巡演上海站',
      author: '行程管理员',
      type: 'tour',
      submittedAt: '5小时前',
      priority: 'high',
    },
    {
      id: '3',
      title: '从《怒放的生命》看汪峰的音乐理念',
      author: '资深乐迷',
      type: 'article',
      submittedAt: '1天前',
      priority: 'medium',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: '1',
      action: '批量删除了 15 条垃圾评论',
      operator: '管理员A',
      timestamp: '10分钟前',
      type: 'danger',
    },
    {
      id: '2',
      action: '修改了系统敏感词配置',
      operator: '超级管理员',
      timestamp: '1小时前',
      type: 'warning',
    },
    {
      id: '3',
      action: '审核通过文章《春天里》赏析',
      operator: '管理员B',
      timestamp: '2小时前',
      type: 'info',
    },
    {
      id: '4',
      action: '封禁用户 user_12345',
      operator: '管理员A',
      timestamp: '3小时前',
      type: 'danger',
    },
    {
      id: '5',
      action: '新增行程: 北京工体演唱会',
      operator: '行程管理员',
      timestamp: '5小时前',
      type: 'info',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          className={cn(
            'border-wangfeng-purple/40',
            isLight ? 'bg-white/90' : 'bg-black/60'
          )}
        >
          <CardHeader>
            <CardTitle className="text-wangfeng-purple flex items-center gap-2">
              <Clock className="w-5 h-5" />
              审核队列
            </CardTitle>
            <CardDescription>按优先级排序的待审内容</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {queueItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'p-4 rounded-lg border border-wangfeng-purple/30 hover:border-wangfeng-purple transition-colors cursor-pointer',
                    isLight ? 'bg-white/50' : 'bg-black/40'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('w-2 h-2 rounded-full', getPriorityColor(item.priority))} />
                        <span className="text-sm font-medium text-wangfeng-purple">
                          {item.type === 'article' ? '文章' : '行程'}
                        </span>
                      </div>
                      <h4 className={cn('font-medium mb-1', isLight ? 'text-gray-800' : 'text-gray-200')}>
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>作者: {item.author}</span>
                        <span>·</span>
                        <span>{item.submittedAt}</span>
                      </div>
                    </div>
                    <Link
                      to={item.type === 'article' ? `/admin/review/${item.id}` : `/admin/schedules/${item.id}`}
                      className="px-3 py-1 text-xs font-medium text-wangfeng-purple border border-wangfeng-purple/40 rounded-lg hover:bg-wangfeng-purple hover:text-white transition-colors"
                    >
                      查看
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link
                to="/admin/review"
                className="text-sm text-wangfeng-purple hover:underline"
              >
                查看全部待审内容 →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'border-wangfeng-purple/40',
            isLight ? 'bg-white/90' : 'bg-black/60'
          )}
        >
          <CardHeader>
            <CardTitle className="text-wangfeng-purple flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              最近操作日志
            </CardTitle>
            <CardDescription>高危操作记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    'p-3 rounded-lg border border-wangfeng-purple/20',
                    isLight ? 'bg-white/50' : 'bg-black/30'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getTypeIcon(log.type)}</div>
                    <div className="flex-1">
                      <p className={cn('text-sm', isLight ? 'text-gray-800' : 'text-gray-200')}>
                        {log.action}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{log.operator}</span>
                        <span>·</span>
                        <span>{log.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link
                to="/admin/audit"
                className="text-sm text-wangfeng-purple hover:underline"
              >
                查看完整日志 →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card
        className={cn(
          'border-wangfeng-purple/40',
          isLight ? 'bg-white/90' : 'bg-black/60'
        )}
      >
        <CardHeader>
          <CardTitle className="text-wangfeng-purple flex items-center gap-2">
            <Users className="w-5 h-5" />
            今日概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-wangfeng-purple">324</div>
              <div className="text-sm text-gray-500 mt-1">访问用户</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wangfeng-purple">86</div>
              <div className="text-sm text-gray-500 mt-1">新增评论</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wangfeng-purple">15</div>
              <div className="text-sm text-gray-500 mt-1">文章阅读</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wangfeng-purple">1.2k</div>
              <div className="text-sm text-gray-500 mt-1">页面浏览</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
