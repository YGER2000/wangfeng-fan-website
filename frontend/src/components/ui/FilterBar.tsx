import { Search, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { ReviewStatus } from './StatusBadge';
import { useState } from 'react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  // 搜索相关
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;

  // 分类筛选
  categories?: FilterOption[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;

  // 状态筛选
  showStatusFilter?: boolean;
  selectedStatus?: ReviewStatus | 'published' | null;
  onStatusChange?: (status: ReviewStatus | 'published' | null) => void;

  // 标签筛选
  availableTags?: FilterOption[];
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;

  // 样式
  className?: string;
}

const statusOptions = [
  { label: '已发布', value: 'published' },
  { label: '待审核', value: 'pending' },
  { label: '已驳回', value: 'rejected' },
];

const FilterBar = ({
  searchValue = '',
  searchPlaceholder = '搜索内容...',
  onSearchChange,
  categories = [],
  selectedCategory = 'all',
  onCategoryChange,
  showStatusFilter = false,
  selectedStatus = null,
  onStatusChange,
  availableTags = [],
  selectedTags = [],
  onTagsChange,
  className,
}: FilterBarProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);

  const handleClearSearch = () => {
    onSearchChange?.('');
  };

  const handleToggleTag = (tagValue: string) => {
    if (selectedTags.includes(tagValue)) {
      onTagsChange?.(selectedTags.filter((t) => t !== tagValue));
    } else {
      onTagsChange?.([...selectedTags, tagValue]);
    }
  };

  const handleClearAllFilters = () => {
    onSearchChange?.('');
    onCategoryChange?.('all');
    onStatusChange?.('all');
    onTagsChange?.([]);
  };

  const hasActiveFilters =
    searchValue ||
    (selectedCategory && selectedCategory !== 'all') ||
    (selectedStatus && selectedStatus !== 'all') ||
    selectedTags.length > 0;

  return (
    <div
      className={cn(
        'p-4 rounded-lg space-y-4',
        isLight
          ? 'bg-white border border-gray-200'
          : 'bg-black/40 border border-wangfeng-purple/30 backdrop-blur-sm',
        className
      )}
    >
      {/* 第一行：搜索框 + 清空按钮 */}
      <div className="flex items-center gap-3">
        {/* 搜索框 */}
        <div className="flex-1 relative">
          <Search
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
              isLight ? 'text-gray-400' : 'text-gray-500'
            )}
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              'w-full pl-10 pr-10 py-2 rounded-lg border outline-none transition-all',
              isLight
                ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-wangfeng-purple focus:ring-2 focus:ring-wangfeng-purple/20'
                : 'bg-black/60 border-wangfeng-purple/30 text-white placeholder-gray-500 focus:border-wangfeng-purple focus:ring-2 focus:ring-wangfeng-purple/20'
            )}
          />
          {searchValue && (
            <button
              onClick={handleClearSearch}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors',
                isLight
                  ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/10'
              )}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 清空所有筛选 */}
        {hasActiveFilters && (
          <button
            onClick={handleClearAllFilters}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              isLight
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            )}
          >
            <X className="w-4 h-4" />
            清空筛选
          </button>
        )}
      </div>

      {/* 第二行:分类、标签筛选(左侧) + 状态筛选(右侧固定) */}
      <div className="flex items-center justify-between gap-3">
        {/* 左侧:分类和标签筛选 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 分类筛选 */}
          {categories.length > 0 && onCategoryChange && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  isLight ? 'text-gray-700' : 'text-gray-300'
                )}
              >
                分类:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onCategoryChange('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    selectedCategory === 'all'
                      ? isLight
                        ? 'bg-wangfeng-purple text-white'
                        : 'bg-wangfeng-purple/80 text-white'
                      : isLight
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  )}
                >
                  全部
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => onCategoryChange(cat.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      selectedCategory === cat.value
                        ? isLight
                          ? 'bg-wangfeng-purple text-white'
                          : 'bg-wangfeng-purple/80 text-white'
                        : isLight
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 标签筛选 */}
          {availableTags.length > 0 && onTagsChange && (
            <div className="relative">
              <button
                onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  selectedTags.length > 0
                    ? isLight
                      ? 'bg-wangfeng-purple text-white'
                      : 'bg-wangfeng-purple/80 text-white'
                    : isLight
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                )}
              >
                <Filter className="w-4 h-4" />
                标签 {selectedTags.length > 0 && `(${selectedTags.length})`}
              </button>

              {/* 标签下拉菜单 */}
              {showTagsDropdown && (
                <>
                  {/* 遮罩层 */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowTagsDropdown(false)}
                  />
                  {/* 下拉内容 */}
                  <div
                    className={cn(
                      'absolute top-full left-0 mt-2 w-64 max-h-64 overflow-y-auto rounded-lg shadow-lg border z-20',
                      isLight
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-900 border-wangfeng-purple/30'
                    )}
                  >
                    <div className="p-2 space-y-1">
                      {availableTags.map((tag) => (
                        <label
                          key={tag.value}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors',
                            isLight
                              ? 'hover:bg-gray-100'
                              : 'hover:bg-white/10'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag.value)}
                            onChange={() => handleToggleTag(tag.value)}
                            className="w-4 h-4 rounded border-gray-300 text-wangfeng-purple focus:ring-wangfeng-purple"
                          />
                          <span
                            className={cn(
                              'text-sm',
                              isLight ? 'text-gray-700' : 'text-gray-300'
                            )}
                          >
                            {tag.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 右侧:状态筛选(固定位置) */}
        {showStatusFilter && onStatusChange && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={cn(
                'text-sm font-medium',
                isLight ? 'text-gray-700' : 'text-gray-300'
              )}
            >
              状态:
            </span>
            <div className="flex gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => onStatusChange(status.value as any)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                    selectedStatus === status.value
                      ? isLight
                        ? 'bg-wangfeng-purple text-white'
                        : 'bg-wangfeng-purple/80 text-white'
                      : isLight
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
