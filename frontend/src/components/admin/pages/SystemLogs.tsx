import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ScrollText,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Calendar,
  Globe,
  Edit3,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminService, LogActionType, LogResourceType } from '@/services/admin';
import type { AdminLogResponse } from '@/services/admin';

const SystemLogs = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [logs, setLogs] = useState<AdminLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const logsData = await adminService.getLogs({ limit: 100 });
      setLogs(logsData);
    } catch (err: any) {
      console.error('加载日志数据失败:', err);
      setError(err.message || '加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const actionOptions = [
    { value: 'all', label: '全部操作' },
    { value: LogActionType.APPROVE, label: '审核通过' },
    { value: LogActionType.REJECT, label: '审核驳回' },
    { value: LogActionType.BAN, label: '封禁用户' },
    { value: LogActionType.UNBAN, label: '解封用户' },
    { value: LogActionType.CREATE, label: '创建' },
    { value: LogActionType.UPDATE, label: '更新' },
    { value: LogActionType.DELETE, label: '删除' },
    { value: LogActionType.LOGIN, label: '登录' },
  ];

  const resourceOptions = [
    { value: 'all', label: '全部资源' },
    { value: LogResourceType.ARTICLE, label: '文章' },
    { value: LogResourceType.USER, label: '用户' },
    { value: LogResourceType.COMMENT, label: '评论' },
    { value: LogResourceType.SCHEDULE, label: '行程' },
    { value: LogResourceType.SYSTEM, label: '系统' },
  ];

  const getActionIcon = (action: string) => {
    if (action.includes(LogActionType.APPROVE)) return CheckCircle;
    if (action.includes(LogActionType.REJECT)) return Edit3;
    if (action.includes(LogActionType.BAN)) return ShieldAlert;
    if (action.includes(LogActionType.DELETE)) return XCircle;
    return Info;
  };

  const formatActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      [LogActionType.APPROVE]: '通过审核',
      [LogActionType.REJECT]: '驳回内容',
      [LogActionType.BAN]: '封禁用户',
      [LogActionType.UNBAN]: '解封用户',
      [LogActionType.CREATE]: '创建',
      [LogActionType.UPDATE]: '更新',
      [LogActionType.DELETE]: '删除',
      [LogActionType.ROLE_CHANGE]: '修改角色',
      [LogActionType.LOGIN]: '登录',
      [LogActionType.LOGOUT]: '登出',
    };
    return actionMap[action] || action;
  };

  const formatResourceType = (type: string) => {
    const typeMap: Record<string, string> = {
      [LogResourceType.ARTICLE]: '文章',
      [LogResourceType.USER]: '用户',
      [LogResourceType.COMMENT]: '评论',
      [LogResourceType.SCHEDULE]: '行程',
      [LogResourceType.SYSTEM]: '系统',
    };
    return typeMap[type] || type;
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    const matchesResource = selectedResource === 'all' || log.resource_type === selectedResource;
    return matchesAction && matchesResource;
  });

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

  return (
    <div className="space-y-6">
      <Card
        className={cn(
          'border border-wangfeng-purple/40 backdrop-blur-md',
          isLight ? 'bg-white/90' : 'bg-black/60'
        )}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <div className="text-xs text-gray-500 w-full mb-1">操作类型:</div>
              {actionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedAction(option.value)}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-xs font-medium transition-all',
                    selectedAction === option.value
                      ? 'bg-wangfeng-purple text-white shadow-strong-glow'
                      : isLight
                      ? 'border border-wangfeng-purple/20 bg-white/80 text-gray-700 hover:border-wangfeng-purple'
                      : 'border border-wangfeng-purple/40 bg-black/40 text-gray-200 hover:border-wangfeng-purple/60'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="text-xs text-gray-500 w-full mb-1">资源类型:</div>
              {resourceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedResource(option.value)}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-xs font-medium transition-all',
                    selectedResource === option.value
                      ? 'bg-wangfeng-purple text-white shadow-strong-glow'
                      : isLight
                      ? 'border border-wangfeng-purple/20 bg-white/80 text-gray-700 hover:border-wangfeng-purple'
                      : 'border border-wangfeng-purple/40 bg-black/40 text-gray-200 hover:border-wangfeng-purple/60'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  'border border-wangfeng-purple/40 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white',
                  isLight ? 'bg-white/80' : 'bg-black/60'
                )}
              >
                <Filter className="mr-2 h-4 w-4" />
                筛选条件
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  'border border-wangfeng-purple/40 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white',
                  isLight ? 'bg-white/80' : 'bg-black/60'
                )}
              >
                <Download className="mr-2 h-4 w-4" />
                导出 CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={cn(
          'border border-wangfeng-purple/40 backdrop-blur-md',
          isLight ? 'bg-white/90' : 'bg-black/60'
        )}
      >
        <CardHeader className="flex flex-row items-center gap-2">
          <ScrollText className="h-5 w-5 text-wangfeng-purple" />
          <CardTitle className="text-lg font-semibold text-wangfeng-purple">系统审计日志</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无日志记录
              </div>
            ) : (
              filteredLogs.map((log) => {
                const Icon = getActionIcon(log.action);
                return (
                  <div
                    key={log.id}
                    className={cn(
                      'rounded-xl border p-4 transition-colors',
                      isLight
                        ? 'border-wangfeng-purple/20 bg-white/70 hover:bg-white/90'
                        : 'border-wangfeng-purple/30 bg-black/40 hover:bg-black/60'
                    )}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex flex-1 items-start gap-3">
                        <div className={cn(
                          "mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-wangfeng-purple/40",
                          isLight ? 'bg-white/70' : 'bg-black/60'
                        )}>
                          <Icon className="h-4 w-4 text-wangfeng-purple" />
                        </div>
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className={cn('text-sm font-semibold', isLight ? 'text-gray-800' : 'text-gray-100')}>
                              {log.description || `${formatActionText(log.action)} - ${formatResourceType(log.resource_type)}`}
                            </p>
                            <span className="rounded-full bg-wangfeng-purple/10 px-3 py-1 text-xs font-medium text-wangfeng-purple">
                              {formatResourceType(log.resource_type)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <span>操作人：{log.operator_username} ({log.operator_role})</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                            {log.ip_address && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3.5 w-3.5" />
                                {log.ip_address}
                              </span>
                            )}
                          </div>
                          {log.details && (
                            <p className="text-xs text-gray-400 mt-1 truncate">{log.details}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 md:text-right">
                        ID：{log.id.substring(0, 8)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemLogs;
