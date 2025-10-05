import { MessageCircle, Flag, Check, X, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const reportedComments = [
  {
    id: 'C-5521',
    author: '摇滚少年',
    content: '这首歌的现场版太燃了！有没有高清伴奏？',
    target: '《存在》现场记实',
    reportReason: '重复提问',
    time: '12-05 21:03',
    status: '待处理',
  },
  {
    id: 'C-5519',
    author: '峰迷阿汤',
    content: '求加场！上海场太难抢了吧！',
    target: '2024 巡演回顾',
    reportReason: '情绪激动词汇',
    time: '12-05 19:26',
    status: '已标记',
  },
];

const CommentCenter = () => {
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
          <h2 className="text-lg font-semibold text-wangfeng-purple">评论管理</h2>
          <p className="text-xs text-gray-500">集中处理被举报或命中敏感词的评论，维护良好社区氛围</p>
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
            敏感词设置
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
              举报统计
          </button>
        </div>
      </header>

      <div className="mt-6 overflow-hidden rounded-2xl border border-wangfeng-purple/30">
        <table className="min-w-full divide-y divide-wangfeng-purple/20">
          <thead className={cn(isLight ? 'bg-white/70' : 'bg-black/50')}>
            <tr className="text-xs uppercase tracking-wider text-wangfeng-purple">
              <th className="px-4 py-3 text-left">评论ID</th>
              <th className="px-4 py-3 text-left">内容</th>
              <th className="px-4 py-3 text-left">所属文章</th>
              <th className="px-4 py-3 text-left">举报原因</th>
              <th className="px-4 py-3 text-left">状态</th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody className={cn('text-sm', isLight ? 'bg-white/60 text-gray-700' : 'bg-black/40 text-gray-100')}>
            {reportedComments.map((comment) => (
              <tr key={comment.id} className="border-b border-wangfeng-purple/20 last:border-b-0">
                <td className="px-4 py-3 font-medium text-wangfeng-purple">{comment.id}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-wangfeng-purple/90">{comment.author}</p>
                  <p className="mt-1 text-xs text-gray-500">{comment.content}</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{comment.target}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Flag className="h-3.5 w-3.5 text-amber-400" />
                    {comment.reportReason}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium',
                      comment.status === '待处理'
                        ? 'bg-wangfeng-purple/10 text-wangfeng-purple'
                        : 'bg-emerald-500/20 text-emerald-300'
                    )}
                  >
                    {comment.status}
                  </span>
                  <p className="mt-1 text-[11px] text-gray-400">{comment.time}</p>
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={cn(
                        'flex items-center gap-1 rounded-lg border px-3 py-1 transition-colors',
                        isLight
                          ? 'border-wangfeng-purple/30 text-wangfeng-purple hover:bg-wangfeng-purple/10'
                          : 'border-wangfeng-purple/30 text-wangfeng-light hover:bg-wangfeng-purple/20'
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      查看原文
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-lg bg-wangfeng-purple px-3 py-1 text-white transition-colors hover:bg-wangfeng-purple/85"
                    >
                      <Check className="h-3.5 w-3.5" />
                      保留
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'flex items-center gap-1 rounded-lg border px-3 py-1 transition-colors',
                        isLight
                          ? 'border-red-400/50 text-red-400 hover:bg-red-100/20'
                          : 'border-red-400/50 text-red-300 hover:bg-red-500/10'
                      )}
                    >
                      <X className="h-3.5 w-3.5" />
                      隐藏
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-gray-500">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-3.5 w-3.5 text-wangfeng-purple" />
          今日新增评论 128 · 命中敏感词 4 条
        </div>
        <span>自动巡检每 30 分钟运行一次</span>
      </div>
    </div>
  );
};

export default CommentCenter;
