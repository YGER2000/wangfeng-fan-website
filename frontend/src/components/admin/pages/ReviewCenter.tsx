import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Video,
  CalendarDays,
  Image,
  Search,
  Filter,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ClipboardCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import SimpleToast, { ToastType } from '@/components/ui/SimpleToast';

// 审核项统一接口
interface ReviewItem {
  id: string;
  type: 'article' | 'video' | 'schedule' | 'gallery';
  title: string;
  description?: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  author?: string;
  createdAt: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
}

type SortField = 'createdAt' | 'title' | 'type';
type SortOrder = 'asc' | 'desc';

const ReviewCenter = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const navigate = useNavigate();

  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast 提示
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // 筛选和排序状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 统计数据
  const statistics = useMemo(() => {
    const all = reviewItems.length;
    const pending = reviewItems.filter(item => item.reviewStatus === 'pending').length;
    const approved = reviewItems.filter(item => item.reviewStatus === 'approved').length;
    const rejected = reviewItems.filter(item => item.reviewStatus === 'rejected').length;
    return { all, pending, approved, rejected };
  }, [reviewItems]);

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:1994/api/admin/reviews/?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('加载审核数据失败');
      }

      const data = await response.json();
      setReviewItems(data);
    } catch (err: any) {
      console.error('加载审核数据失败:', err);
      setToast({ message: err.message || '加载数据失败,请稍后重试', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 筛选和排序逻辑
  const filteredAndSortedItems = useMemo(() => {
    let result = [...reviewItems];

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.title.toLowerCase().includes(query) ||
          (item.author && item.author.toLowerCase().includes(query))
      );
    }

    // 类型过滤
    if (selectedType !== 'all') {
      result = result.filter(item => item.type === selectedType);
    }

    // 状态过滤
    if (selectedStatus !== 'all') {
      result = result.filter(item => item.reviewStatus === selectedStatus);
    }

    // 排序
    result.sort((a, b) => {
      let compareResult = 0;

      switch (sortField) {
        case 'createdAt':
          compareResult = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'title':
          compareResult = a.title.localeCompare(b.title, 'zh-CN');
          break;
        case 'type':
          compareResult = a.type.localeCompare(b.type);
          break;
      }

      return sortOrder === 'asc' ? compareResult : -compareResult;
    });

    return result;
  }, [reviewItems, searchQuery, selectedType, selectedStatus, sortField, sortOrder]);

  // 切换排序
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 排序图标
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-wangfeng-purple" />
    ) : (
      <ChevronDown className="h-4 w-4 text-wangfeng-purple" />
    );
  };

  const handleItemClick = (item: ReviewItem) => {
    const backPathMap: Record<string, string> = {
      article: '/admin/articles/all',
      video: '/admin/videos/all',
      gallery: '/admin/gallery/all',
      schedule: '/admin/manage/schedules/list',
    };

    const backPath = backPathMap[item.type] || '/admin/reviews';
    const navOptions = { state: { fromReview: true, backPath } };

    switch (item.type) {
      case 'article':
        navigate(`/admin/articles/edit/${item.id}`, navOptions);
        break;
      case 'video':
        navigate(`/admin/videos/edit/${item.id}`, navOptions);
        break;
      case 'schedule':
        navigate(`/admin/manage/schedules/edit/${item.id}`, navOptions);
        break;
      case 'gallery':
        navigate(`/admin/gallery/edit/${item.id}`, navOptions);
        break;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      article: '文章',
      video: '视频',
      schedule: '行程',
      gallery: '图组',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'schedule':
        return <CalendarDays className="h-4 w-4" />;
      case 'gallery':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: '待审核', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400' },
      approved: { label: '已通过', className: 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400' },
      rejected: { label: '已驳回', className: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', badge.className)}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <div className={cn(
      "h-full flex flex-col",
      isLight ? "bg-gray-50" : "bg-transparent"
    )}>
      {/* 顶部标题栏 */}
      <div className={cn(
        "flex-shrink-0 border-b px-6 py-4",
        isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-6 w-6 text-wangfeng-purple" />
            <h1 className={cn(
              "text-2xl font-bold",
              isLight ? "text-gray-900" : "text-white"
            )}>
              审核中心
            </h1>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              isLight
                ? "bg-gray-200 text-gray-700"
                : "bg-wangfeng-purple/20 text-wangfeng-purple"
            )}>
              {filteredAndSortedItems.length} 项
            </span>
          </div>

          {/* 统计信息 */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={cn(isLight ? "text-gray-600" : "text-gray-400")}>待审核</span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">{statistics.pending}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(isLight ? "text-gray-600" : "text-gray-400")}>已通过</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{statistics.approved}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(isLight ? "text-gray-600" : "text-gray-400")}>已驳回</span>
              <span className="font-semibold text-red-600 dark:text-red-400">{statistics.rejected}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选和搜索栏 */}
      <div className={cn(
        "flex-shrink-0 border-b px-6 py-4",
        isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
      )}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1">
            <div className="relative">
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                isLight ? "text-gray-400" : "text-gray-500"
              )} />
              <input
                type="text"
                placeholder="搜索标题或作者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2",
                  isLight
                    ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                    : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                )}
              />
            </div>
          </div>

          {/* 类型筛选 */}
          <div className="flex items-center gap-2">
            <Filter className={cn(
              "h-4 w-4",
              isLight ? "text-gray-600" : "text-gray-400"
            )} />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2",
                isLight
                  ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                  : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
              )}
            >
              <option value="all">全部类型</option>
              <option value="article">文章</option>
              <option value="video">视频</option>
              <option value="schedule">行程</option>
              <option value="gallery">图组</option>
            </select>
          </div>

          {/* 状态筛选 */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2",
                isLight
                  ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                  : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
              )}
            >
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>
        </div>
      </div>

      {/* 主要内容区域 - 表格 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className={cn(
          "rounded-lg border overflow-hidden",
          isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
        )}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple"></div>
            </div>
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <ClipboardCheck className={cn(
                "h-12 w-12 mb-4",
                isLight ? "text-gray-300" : "text-gray-600"
              )} />
              <p className={cn(
                "text-sm",
                isLight ? "text-gray-500" : "text-gray-400"
              )}>
                {searchQuery || selectedType !== 'all' || selectedStatus !== 'all' ? '未找到匹配的审核项' : '暂无审核项'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={cn(
                  "border-b",
                  isLight
                    ? "bg-gray-50 border-gray-200"
                    : "bg-black/20 border-wangfeng-purple/20"
                )}>
                  <tr>
                    <th className={cn(
                      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                      isLight ? "text-gray-600" : "text-gray-400"
                    )}>
                      <button
                        onClick={() => toggleSort('type')}
                        className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                      >
                        类型
                        <SortIcon field="type" />
                      </button>
                    </th>
                    <th className={cn(
                      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                      isLight ? "text-gray-600" : "text-gray-400"
                    )}>
                      <button
                        onClick={() => toggleSort('title')}
                        className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                      >
                        标题
                        <SortIcon field="title" />
                      </button>
                    </th>
                    <th className={cn(
                      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                      isLight ? "text-gray-600" : "text-gray-400"
                    )}>
                      分类
                    </th>
                    <th className={cn(
                      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                      isLight ? "text-gray-600" : "text-gray-400"
                    )}>
                      作者
                    </th>
                    <th className={cn(
                      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                      isLight ? "text-gray-600" : "text-gray-400"
                    )}>
                      <button
                        onClick={() => toggleSort('createdAt')}
                        className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                      >
                        提交时间
                        <SortIcon field="createdAt" />
                      </button>
                    </th>
                    <th className={cn(
                      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                      isLight ? "text-gray-600" : "text-gray-400"
                    )}>
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className={cn(
                  "divide-y",
                  isLight ? "divide-gray-200" : "divide-wangfeng-purple/10"
                )}>
                  {filteredAndSortedItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isLight
                          ? "hover:bg-gray-50"
                          : "hover:bg-white/5"
                      )}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
                            isLight
                              ? "bg-wangfeng-purple/10 text-wangfeng-purple"
                              : "bg-wangfeng-purple/20 text-wangfeng-purple"
                          )}>
                            {getTypeIcon(item.type)}
                            {getTypeLabel(item.type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.coverImage && (
                            <img
                              src={item.coverImage}
                              alt={item.title}
                              className="w-10 h-10 rounded object-cover"
                              onError={(e) => {
                                // 如果图片加载失败，隐藏图片元素
                                e.currentTarget.style.display = 'none';
                              }}
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="max-w-md">
                            <div className={cn(
                              "font-medium truncate",
                              isLight ? "text-gray-900" : "text-gray-100"
                            )}>
                              {item.title}
                            </div>
                            {item.description && (
                              <div className={cn(
                                "text-xs truncate mt-0.5",
                                isLight ? "text-gray-500" : "text-gray-400"
                              )}>
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.category && (
                          <span className={cn(
                            "text-sm",
                            isLight ? "text-gray-600" : "text-gray-400"
                          )}>
                            {item.category}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "text-sm",
                          isLight ? "text-gray-600" : "text-gray-400"
                        )}>
                          {item.author || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "text-sm",
                          isLight ? "text-gray-600" : "text-gray-400"
                        )}>
                          {formatDate(item.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.reviewStatus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast 提示 */}
      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ReviewCenter;
