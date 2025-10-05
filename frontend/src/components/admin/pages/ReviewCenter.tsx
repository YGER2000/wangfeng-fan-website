import { FileText, CalendarDays, User, Check, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const ReviewCenter = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const postQueue = [
    {
      id: 'P-301',
      title: '汪峰音乐会灯光复盘',
      author: '影行者',
      summary: '从灯光设计视角拆解本次巡演舞台亮点。',
      submittedAt: '12-05 22:10',
      wordCount: 1834,
    },
    {
      id: 'P-299',
      title: '粉丝共创稿 · 峰迷故事集②',
      author: '峰迷晓歌',
      summary: '聚焦 6 位粉丝与汪峰作品的情感关联。',
      submittedAt: '12-05 20:06',
      wordCount: 2460,
    },
  ];

  const scheduleQueue = [
    {
      id: 'T-118',
      city: '上海',
      venue: '虹口足球场',
      date: '2025-03-18',
      status: '新增站点',
    },
    {
      id: 'T-117',
      city: '成都',
      venue: '凤凰山体育公园',
      date: '2025-03-01',
      status: '时间调整',
    },
  ];

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
          {postQueue.map((item) => (
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
                    <span>{item.id}</span>
                    <span>提交时间 · {item.submittedAt}</span>
                    <span>字数 · {item.wordCount}</span>
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-wangfeng-purple">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{item.summary}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                    <User className="h-3.5 w-3.5" />
                    <span>{item.author}</span>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-40">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-lg bg-wangfeng-purple px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-wangfeng-purple/85"
                  >
                    <Check className="h-4 w-4" />
                    通过并发布
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
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
          ))}
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
          {scheduleQueue.map((item) => (
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
                  <span>{item.id}</span>
                </div>
                <span className="rounded-full bg-wangfeng-purple/10 px-3 py-1 text-wangfeng-purple">
                  {item.status}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-wangfeng-purple">
                {item.city} · {item.venue}
              </h3>
              <p className="mt-1 text-sm text-gray-400">演出日期：{item.date}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className={cn(
                    'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isLight
                      ? 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/85'
                      : 'bg-wangfeng-purple/30 text-wangfeng-light hover:bg-wangfeng-purple/40'
                  )}
                >
                  发布排期
                </button>
                <button
                  type="button"
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    isLight
                      ? 'border-wangfeng-purple/40 text-wangfeng-purple hover:bg-wangfeng-purple/10'
                      : 'border-wangfeng-purple/30 text-wangfeng-light hover:bg-wangfeng-purple/20'
                  )}
                >
                  请求修改
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ReviewCenter;
