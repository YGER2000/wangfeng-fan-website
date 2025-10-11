import { useState, useEffect } from 'react';
import { FileText, CalendarDays, User, Check, X, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { adminService, ReviewStatus } from '@/services/admin';
import type { ArticleAdminResponse, ScheduleAdminResponse } from '@/services/admin';

const ReviewCenter = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const [articles, setArticles] = useState<ArticleAdminResponse[]>([]);
  const [schedules, setSchedules] = useState<ScheduleAdminResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取待审核文章
      const articlesData = await adminService.getArticles({
        status: ReviewStatus.PENDING,
        limit: 50,
      });
      setArticles(articlesData);

      // 获取待发布的行程
      const schedulesData = await adminService.getSchedules({
        limit: 50,
      });
      // 只显示未发布的行程
      const unpublishedSchedules = schedulesData.filter(s => !s.is_published);
      setSchedules(unpublishedSchedules);
    } catch (err: any) {
      console.error('加载审核数据失败:', err);
      setError(err.message || '加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveArticle = async (articleId: string) => {
    try {
      setProcessingId(articleId);
      await adminService.approveArticle(articleId, {
        review_notes: '文章内容优质，通过审核',
      });
      // 刷新列表
      await loadReviewData();
    } catch (err: any) {
      console.error('审核通过失败:', err);
      alert(err.message || '操作失败，请稍后重试');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectArticle = async (articleId: string) => {
    const reason = prompt('请输入驳回原因：');
    if (!reason || reason.trim() === '') {
      alert('驳回原因不能为空');
      return;
    }

    try {
      setProcessingId(articleId);
      await adminService.rejectArticle(articleId, {
        review_notes: reason,
      });
      // 刷新列表
      await loadReviewData();
    } catch (err: any) {
      console.error('驳回文章失败:', err);
      alert(err.message || '操作失败，请稍后重试');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  };

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
      <section
        className={cn(
          'rounded-2xl border border-wangfeng-purple/40 p-6 shadow-glow backdrop-blur-md',
          isLight ? 'bg-white/85 text-gray-800' : 'bg-black/55 text-gray-100'
        )}
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-wangfeng-purple">文章待审核</h2>
            <p className="text-xs text-gray-500">审核时可根据需要微调标题、标签和摘要</p>
          </div>
          <button
            type="button"
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors',
              isLight
                ? 'border-wangfeng-purple/30 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white'
                : 'border-wangfeng-purple/40 text-wangfeng-light hover:bg-wangfeng-purple/20'
            )}
          >
            查看历史记录
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </header>

        <div className="mt-4 space-y-4">
          {articles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无待审核文章
            </div>
          ) : (
            articles.map((item) => (
              <article
                key={item.id}
                className={cn(
                  'rounded-xl border border-wangfeng-purple/30 p-4 transition-all hover:border-wangfeng-purple/60 hover:shadow-strong-glow',
                  isLight ? 'bg-white/75' : 'bg-black/50'
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FileText className="h-3.5 w-3.5 text-wangfeng-purple" />
                      <span>{item.slug}</span>
                      <span>提交时间 · {formatDate(item.created_at)}</span>
                      <span>分类 · {item.category_primary} / {item.category_secondary}</span>
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-wangfeng-purple">{item.title}</h3>
                    {item.excerpt && (
                      <p className="mt-2 text-sm text-gray-500">{item.excerpt}</p>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                      <User className="h-3.5 w-3.5" />
                      <span>{item.author}</span>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-40">
                    <button
                      type="button"
                      onClick={() => handleApproveArticle(item.id)}
                      disabled={processingId === item.id}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg bg-wangfeng-purple px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-wangfeng-purple/85",
                        processingId === item.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Check className="h-4 w-4" />
                      {processingId === item.id ? '处理中...' : '通过并发布'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectArticle(item.id)}
                      disabled={processingId === item.id}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                        processingId === item.id && "opacity-50 cursor-not-allowed",
                        isLight
                          ? 'border-wangfeng-purple/40 text-wangfeng-purple hover:bg-wangfeng-purple/10'
                          : 'border-wangfeng-purple/30 text-wangfeng-light hover:bg-wangfeng-purple/20'
                      )}
                    >
                      <X className="h-4 w-4" />
                      驳回并备注
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section
        className={cn(
          'rounded-2xl border border-wangfeng-purple/40 p-6 shadow-glow backdrop-blur-md',
          isLight ? 'bg-white/85 text-gray-800' : 'bg-black/55 text-gray-100'
        )}
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-wangfeng-purple">行程待审核</h2>
            <p className="text-xs text-gray-500">确认时间、城市信息及票务链接是否准确</p>
          </div>
          <button
            type="button"
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors',
              isLight
                ? 'border-wangfeng-purple/30 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white'
                : 'border-wangfeng-purple/40 text-wangfeng-light hover:bg-wangfeng-purple/20'
            )}
          >
            导出排期
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </header>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {schedules.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-gray-500">
              暂无待审核行程
            </div>
          ) : (
            schedules.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'rounded-xl border border-wangfeng-purple/30 p-4 transition-all hover:border-wangfeng-purple/60 hover:shadow-strong-glow',
                  isLight ? 'bg-white/75' : 'bg-black/50'
                )}
              >
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-wangfeng-purple" />
                    <span>{item.theme}</span>
                  </div>
                  <span className="rounded-full bg-wangfeng-purple/10 px-3 py-1 text-wangfeng-purple">
                    待发布
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-wangfeng-purple">
                  {item.city} · {item.venue || '待定'}
                </h3>
                <p className="mt-1 text-sm text-gray-400">演出日期：{item.date}</p>
                {item.source && (
                  <p className="mt-1 text-xs text-gray-500 truncate">来源链接：{item.source}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled
                    className={cn(
                      'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors opacity-50 cursor-not-allowed',
                      isLight
                        ? 'bg-wangfeng-purple text-white'
                        : 'bg-wangfeng-purple/30 text-wangfeng-light'
                    )}
                  >
                    发布排期
                  </button>
                  <button
                    type="button"
                    disabled
                    className={cn(
                      'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors opacity-50 cursor-not-allowed',
                      isLight
                        ? 'border-wangfeng-purple/40 text-wangfeng-purple'
                        : 'border-wangfeng-purple/30 text-wangfeng-light'
                    )}
                  >
                    请求修改
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default ReviewCenter;
