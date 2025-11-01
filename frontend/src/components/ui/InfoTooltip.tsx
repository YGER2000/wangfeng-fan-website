import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  content: string;
  isLight: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * 可复用的信息提示组件
 * 将信息提示与提示图标融合，悬停时显示提示内容
 *
 * 使用示例：
 * <InfoTooltip
 *   content="这是一个提示信息"
 *   isLight={isLight}
 *   position="top"
 * />
 */
const InfoTooltip = ({
  content,
  isLight,
  position = 'top',
  className
}: InfoTooltipProps) => {
  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 transform -translate-y-1/2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45',
    left: 'left-full top-1/2 transform -translate-y-1/2 w-2 h-2 rotate-45',
    right: 'right-full top-1/2 transform -translate-y-1/2 w-2 h-2 rotate-45'
  };

  return (
    <div className={cn("group relative inline-flex items-center", className)}>
      <button
        type="button"
        className={cn(
          "p-1 rounded-full transition-colors",
          isLight
            ? "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            : "text-gray-500 hover:bg-white/10 hover:text-gray-300"
        )}
        title="更多信息"
      >
        <span className="text-sm">ⓘ</span>
      </button>

      {/* Tooltip 提示框 */}
      <div className={cn(
        "invisible group-hover:visible absolute z-50 px-3 py-2 rounded-lg text-xs whitespace-normal max-w-xs",
        positionClasses[position],
        isLight
          ? "bg-gray-900 text-white"
          : "bg-gray-800 text-gray-100"
      )}>
        {content}
        {/* Tooltip 箭头 */}
        <div className={cn(
          "absolute",
          arrowClasses[position],
          isLight ? "bg-gray-900" : "bg-gray-800"
        )} />
      </div>
    </div>
  );
};

export default InfoTooltip;
