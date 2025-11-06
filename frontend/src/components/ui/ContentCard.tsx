import { useState } from 'react';
import { Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusBadge, { ReviewStatus } from './StatusBadge';
import { useTheme } from '@/contexts/ThemeContext';

export type ContentType = 'article' | 'video' | 'gallery';

interface ContentCardProps {
  id: string;
  type: ContentType;
  title: string;
  coverImage?: string;
  category?: string;
  description?: string;
  publishDate?: string;
  author?: string;
  status: ReviewStatus;
  isPublished?: boolean;
  rejectionReason?: string | null;
  onEdit: (id: string) => void;
  onView?: (id: string) => void;
  className?: string;
}

const ContentCard = ({
  id,
  type,
  title,
  coverImage,
  category,
  description,
  publishDate,
  author,
  status,
  isPublished = false,
  rejectionReason,
  onEdit,
  onView,
  className,
}: ContentCardProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [imageFailed, setImageFailed] = useState(false);

  // 生成渐变色
  const gradients = [
    'from-purple-400/70 via-purple-500/70 to-purple-600/75',
    'from-blue-400/70 via-purple-400/70 to-pink-500/75',
    'from-indigo-400/70 via-purple-400/70 to-purple-500/75',
    'from-violet-400/70 via-purple-500/70 to-fuchsia-500/75',
    'from-purple-500/70 via-indigo-500/70 to-blue-600/75',
    'from-pink-400/70 via-purple-400/70 to-indigo-500/75',
  ];

  const getGradientColors = (title: string): string => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = ((hash << 5) - hash) + title.charCodeAt(i);
      hash |= 0;
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  // 将HTML内容转换为纯文本
  const stripHtml = (html: string | undefined): string => {
    if (!html) return '暂无描述';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '暂无描述';
  };

  const shouldUseGradient = !coverImage || imageFailed;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border transition-all duration-300',
        isLight
          ? 'bg-white border-gray-200 hover:border-wangfeng-purple/50'
          : 'bg-black/40 border-wangfeng-purple/30 hover:border-wangfeng-purple/50 backdrop-blur-sm',
        className
      )}
    >
      {/* 封面区域 - 16:9 比例 */}
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        {shouldUseGradient ? (
          <div
            className={cn(
              'w-full h-full bg-gradient-to-br flex items-center justify-center p-2 transition-transform duration-300 group-hover:scale-105',
              getGradientColors(title)
            )}
          >
            <h3 className="text-white text-sm font-bold text-center leading-tight line-clamp-3">
              {title}
            </h3>
          </div>
        ) : (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageFailed(true)}
            referrerPolicy={type === 'video' ? 'no-referrer' : undefined}
            crossOrigin={type === 'video' ? 'anonymous' : undefined}
          />
        )}

        {/* 状态徽章 - 左上角 */}
        <div className="absolute top-1.5 left-1.5">
          <StatusBadge
            status={status}
            isPublished={isPublished}
            rejectionReason={rejectionReason}
            size="sm"
          />
        </div>

        {/* 分类标签 - 右上角 */}
        {category && (
          <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded">
            {category}
          </div>
        )}

        {/* Hover时显示的编辑按钮 */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-wangfeng-purple text-white rounded-lg hover:bg-wangfeng-purple/90 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">编辑</span>
          </button>
        </div>
      </div>

      {/* 内容区域 - 固定高度 88px (59 * 1.5) */}
      <div className="p-3" style={{ height: '88px' }}>
        {/* 标题 - 单行 */}
        <h3
          className={cn(
            'font-bold mb-2 truncate transition-colors text-sm',
            isLight ? 'text-gray-900 group-hover:text-wangfeng-purple' : 'text-white group-hover:text-wangfeng-purple'
          )}
          style={{ height: '21px', lineHeight: '21px' }}
        >
          {title}
        </h3>

        {/* 描述 - 一行 */}
        <div className="mb-2 overflow-hidden" style={{ height: '20px' }}>
          <p
            className={cn(
              'text-xs truncate',
              isLight ? 'text-gray-600' : 'text-gray-400'
            )}
            style={{ lineHeight: '20px' }}
          >
            {stripHtml(description)}
          </p>
        </div>

        {/* 作者和日期 - 底部 */}
        <div
          className={cn(
            'flex items-center justify-between text-xs',
            isLight ? 'text-gray-500' : 'text-gray-400'
          )}
          style={{ height: '20px', lineHeight: '20px' }}
        >
          <span className="truncate mr-1">{author || '未知作者'}</span>
          <span className="whitespace-nowrap">{publishDate || '未知日期'}</span>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
