import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  Image as ImageIcon,
  Calendar,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  User,
  AlertTriangle,
  Images
} from 'lucide-react';
import { galleryAPI, PhotoGroup } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

type SortField = 'date' | 'title' | 'created_by';
type SortOrder = 'asc' | 'desc';
type ReviewFilter = 'all' | 'pending' | 'approved' | 'rejected';

const GALLERY_CATEGORIES = [
  { value: '巡演返图', label: '巡演返图' },
  { value: '工作花絮', label: '工作花絮' },
  { value: '日常生活', label: '日常生活' },
];

const AllGalleryList = () => {
  const { theme } = useTheme();
  const { currentRole } = useAuth();
  const navigate = useNavigate();
  const isLight = theme === 'white';

  const [galleries, setGalleries] = useState<PhotoGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // 筛选和排序状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 权限检查 - 只有管理员和超级管理员可以访问
  useEffect(() => {
    if (currentRole !== 'admin' && currentRole !== 'super_admin') {
      navigate('/admin/my-gallery');
    }
  }, [currentRole, navigate]);

  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const data = await galleryAPI.getAllPhotoGroups({ limit: 500 }, token);
      setGalleries(data);
    } catch (error) {
      console.error('加载图组失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 筛选和排序逻辑
  const filteredAndSortedGalleries = useMemo(() => {
    let result = [...galleries];

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        gallery =>
          gallery.title.toLowerCase().includes(query) ||
          (gallery.created_by && gallery.created_by.toLowerCase().includes(query))
      );
    }

    // 分类过滤
    if (selectedCategory !== 'all') {
      result = result.filter(gallery => gallery.category === selectedCategory);
    }

    // 审核状态过滤
    if (reviewFilter !== 'all') {
      result = result.filter(gallery => gallery.review_status === reviewFilter);
    }

    // 排序
    result.sort((a, b) => {
      let compareResult = 0;

      switch (sortField) {
        case 'date':
          compareResult = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'title':
          compareResult = a.title.localeCompare(b.title, 'zh-CN');
          break;
        case 'created_by':
          compareResult = (a.created_by || '').localeCompare(b.created_by || '', 'zh-CN');
          break;
      }

      return sortOrder === 'asc' ? compareResult : -compareResult;
    });

    return result;
  }, [galleries, searchQuery, selectedCategory, reviewFilter, sortField, sortOrder]);

  // 统计数据
  const stats = useMemo(() => {
    return {
      total: galleries.length,
      pending: galleries.filter(g => g.review_status === 'pending').length,
      approved: galleries.filter(g => g.review_status === 'approved').length,
      rejected: galleries.filter(g => g.review_status === 'rejected').length,
    };
  }, [galleries]);

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

  // 审核状态徽章
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'pending') {
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-500" />
          <span className={cn(
            "text-sm font-medium",
            isLight ? "text-yellow-700" : "text-yellow-400"
          )}>
            待审核
          </span>
        </div>
      );
    }
    if (status === 'approved') {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className={cn(
            "text-sm font-medium",
            isLight ? "text-green-700" : "text-green-400"
          )}>
            已发布
          </span>
        </div>
      );
    }
    if (status === 'rejected') {
      return (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className={cn(
            "text-sm font-medium",
            isLight ? "text-red-700" : "text-red-400"
          )}>
            已驳回
          </span>
        </div>
      );
    }
    return null;
  };

  // 处理审核跳转
  const handleReview = (gallery: PhotoGroup) => {
    navigate(`/admin/gallery/edit/${gallery.id}`, {
      state: { fromReview: true, backPath: '/admin/gallery/all' }
    });
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
          <div className="flex items-center gap-4">
            <Images className="h-6 w-6 text-wangfeng-purple" />
            <div>
              <h1 className={cn(
                "text-2xl font-bold",
                isLight ? "text-gray-900" : "text-white"
              )}>
                全部图组
              </h1>
              <p className={cn(
                "text-sm mt-0.5",
                isLight ? "text-gray-500" : "text-gray-400"
              )}>
                管理和审核所有用户提交的图组
              </p>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium",
              isLight ? "bg-gray-100 text-gray-700" : "bg-white/10 text-gray-300"
            )}>
              总计: {stats.total}
            </div>
            {stats.pending > 0 && (
              <div className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5",
                isLight ? "bg-yellow-100 text-yellow-700" : "bg-yellow-500/20 text-yellow-400"
              )}>
                <AlertTriangle className="h-3.5 w-3.5" />
                待审核: {stats.pending}
              </div>
            )}
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
                placeholder="搜索图组标题或创建者..."
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

          {/* 审核状态筛选 */}
          <div className="flex items-center gap-2">
            <Filter className={cn(
              "h-4 w-4",
              isLight ? "text-gray-600" : "text-gray-400"
            )} />
            <select
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value as ReviewFilter)}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2",
                isLight
                  ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                  : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
              )}
            >
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已发布</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>

          {/* 分类筛选 */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2",
                isLight
                  ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                  : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
              )}
            >
              <option value="all">全部分类</option>
              {GALLERY_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
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
          ) : filteredAndSortedGalleries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Images className={cn(
                "h-12 w-12 mb-4",
                isLight ? "text-gray-300" : "text-gray-600"
              )} />
              <p className={cn(
                "text-sm",
                isLight ? "text-gray-500" : "text-gray-400"
              )}>
                {searchQuery || selectedCategory !== 'all' || reviewFilter !== 'all'
                  ? '未找到匹配的图组'
                  : '暂无图组'}
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
                      封面
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
                      <button
                        onClick={() => toggleSort('created_by')}
                        className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                      >
                        创建者
                        <SortIcon field="created_by" />
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
                      状态
                    </th>
                    <th className={cn(
                      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                      isLight ? "text-gray-600" : "text-gray-400"
                    )}>
                      图片数
                    </th>
                    <th className={cn(
                      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                      isLight ? "text-gray-600" : "text-gray-400"
                    )}>
                      <button
                        onClick={() => toggleSort('date')}
                        className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                      >
                        日期
                        <SortIcon field="date" />
                      </button>
                    </th>
                    <th className={cn(
                      "px-6 py-3 text-right text-xs font-medium uppercase tracking-wider",
                      isLight ? "text-gray-600" : "text-gray-400"
                    )}>
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className={cn(
                  "divide-y",
                  isLight ? "divide-gray-200" : "divide-wangfeng-purple/10"
                )}>
                  {filteredAndSortedGalleries.map((gallery) => (
                    <tr
                      key={gallery.id}
                      className={cn(
                        "transition-colors",
                        isLight
                          ? "hover:bg-gray-50"
                          : "hover:bg-wangfeng-purple/5"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className={cn(
                          "w-16 h-16 rounded-lg overflow-hidden border",
                          isLight ? "border-gray-200 bg-gray-50" : "border-wangfeng-purple/20 bg-black/50"
                        )}>
                          {gallery.cover_image_thumb_url || gallery.cover_image_url ? (
                            <img
                              src={gallery.cover_image_thumb_url || gallery.cover_image_url}
                              alt={gallery.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className={cn(
                                "h-6 w-6",
                                isLight ? "text-gray-300" : "text-gray-600"
                              )} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleReview(gallery)}
                            className={cn(
                              "font-medium hover:text-wangfeng-purple transition-colors line-clamp-1 text-left",
                              isLight ? "text-gray-900" : "text-white"
                            )}
                          >
                            {gallery.title}
                          </button>
                          {gallery.tags && gallery.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {gallery.tags.slice(0, 2).map((tag, index) => (
                                <span
                                  key={index}
                                  className={cn(
                                    "px-2 py-0.5 rounded text-xs",
                                    isLight
                                      ? "bg-gray-100 text-gray-600"
                                      : "bg-wangfeng-purple/10 text-wangfeng-purple"
                                  )}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className={cn(
                            "h-4 w-4",
                            isLight ? "text-gray-400" : "text-gray-500"
                          )} />
                          <span className={cn(
                            "text-sm",
                            isLight ? "text-gray-700" : "text-gray-300"
                          )}>
                            {gallery.created_by || '未知'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-sm",
                          isLight ? "text-wangfeng-purple" : "text-wangfeng-purple"
                        )}>
                          {gallery.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={gallery.review_status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <ImageIcon className={cn(
                            "h-4 w-4",
                            isLight ? "text-gray-400" : "text-gray-500"
                          )} />
                          <span className={cn(
                            "text-sm",
                            isLight ? "text-gray-700" : "text-gray-300"
                          )}>
                            {gallery.photo_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className={cn(
                            "h-4 w-4",
                            isLight ? "text-gray-400" : "text-gray-500"
                          )} />
                          <span className={cn(
                            "text-sm",
                            isLight ? "text-gray-600" : "text-gray-400"
                          )}>
                            {gallery.display_date || new Date(gallery.date).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleReview(gallery)}
                          className={cn(
                            "text-sm font-medium hover:underline",
                            gallery.review_status === 'pending'
                              ? "text-yellow-600 hover:text-yellow-700"
                              : "text-wangfeng-purple hover:text-wangfeng-purple/80"
                          )}
                        >
                          {gallery.review_status === 'pending' ? '审核' : '查看'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllGalleryList;
