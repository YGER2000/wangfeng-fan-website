import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export type ReviewStatus = 'approved' | 'pending' | 'rejected';

interface StatusBadgeProps {
  status: ReviewStatus;
  isPublished?: boolean;
  rejectionReason?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge = ({
  status,
  isPublished = false,
  rejectionReason,
  className,
  size = 'md'
}: StatusBadgeProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // 确定最终显示状态
  const displayStatus = isPublished ? 'published' : status;

  // 尺寸配置
  const sizeConfig = {
    sm: {
      container: 'px-2 py-0.5 text-xs gap-1',
      icon: 'h-3 w-3',
    },
    md: {
      container: 'px-2.5 py-1 text-xs gap-1.5',
      icon: 'h-3.5 w-3.5',
    },
    lg: {
      container: 'px-3 py-1.5 text-sm gap-2',
      icon: 'h-4 w-4',
    },
  };

  const currentSize = sizeConfig[size];

  // 状态配置
  const statusConfig = {
    published: {
      icon: CheckCircle,
      text: '已发布',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    approved: {
      icon: Clock,
      text: '已审核',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    pending: {
      icon: Clock,
      text: '待审核',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    rejected: {
      icon: XCircle,
      text: '驳回',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  };

  const config = statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  // 是否显示tooltip
  const hasTooltip = displayStatus === 'rejected' && rejectionReason;

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'inline-flex items-center rounded-full font-medium border transition-all',
          currentSize.container,
          config.bgColor,
          config.color,
          config.borderColor,
          hasTooltip && 'cursor-help',
          className
        )}
        onMouseEnter={() => hasTooltip && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Icon className={currentSize.icon} />
        <span>{config.text}</span>
      </div>

      {/* Tooltip - 驳回理由 */}
      {hasTooltip && showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-xs whitespace-normal">
          <div className="font-semibold mb-1">驳回理由:</div>
          <div>{rejectionReason}</div>
          {/* 小箭头 */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusBadge;
