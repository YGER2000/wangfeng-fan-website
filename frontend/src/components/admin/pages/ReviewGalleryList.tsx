// -*- coding: utf-8 -*-
/**
 * 图片管理列表（集审核和管理于一体）
 * 用途: 管理员审核待审核的图片组，编辑已发布的图片组
 * 显示: 所有审核状态的图片组（pending、approved、rejected）
 * 功能:
 *   - 待审核(pending): 显示"审核"按钮
 *   - 已发布(approved): 显示"编辑"按钮
 *   - 已拒绝(rejected): 显示"重新审核"按钮
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronUp,
  ChevronDown,
  Edit2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { galleryAPI, PhotoGroup } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import FilterBar from '@/components/ui/FilterBar';

// 图组分类选项
const galleryCategories = [
  { label: '巡演返图', value: '巡演返图' },
  { label: '工作花絮', value: '工作花絮' },
  { label: '日常生活', value: '日常生活' },
];

type SortField = 'created_at' | 'title';
type SortOrder = 'asc' | 'desc';

const columnWidths = {
  category: 'w-32',
  date: 'w-36',
  submittedAt: 'w-44',
  status: 'w-32',
  actions: 'w-28',
};

const ReviewGalleryList = () => {
  const { theme } = useTheme();
  const { currentRole: role } = useAuth();
  const navigate = useNavigate();
  const isLight = theme === 'white';

  const [galleries, setGalleries] = useState<PhotoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选和排序状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 权限检查 - 只有ADMIN+可以访问
  useEffect(() => {
    if (role !== 'admin' && role !== 'super_admin') {
      navigate('/admin/dashboard');
    }
  }, [role, navigate]);

  // 加载所有图片组
  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      const data = await galleryAPI.getAllPhotoGroups({ limit: 500 }, token);
      setGalleries(data);
    } catch (err) {
      console.error('加载图片组失败:', err);
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 筛选和排序
  const filteredAndSortedGalleries = useMemo(() => {
    let result = [...galleries];

    // 仅展示待审核和已发布的图片组
    result = result.filter(
      (gallery) => gallery.review_status === 'pending' || gallery.review_status === 'approved'
    );

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        gallery =>
          gallery.title.toLowerCase().includes(query)
      );
    }

    // 分类过滤
    if (selectedCategory !== 'all') {
      result = result.filter(gallery => gallery.category === selectedCategory);
    }

    // 审核状态过滤
    if (statusFilter !== null) {
      result = result.filter(gallery => gallery.review_status === statusFilter);
    }

    // 排序
    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'created_at':
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
          break;
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [galleries, searchQuery, selectedCategory, statusFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleReview = (galleryId: string) => {
    navigate(`/admin/gallery/review/${galleryId}`);
  };

  const handleEditPublish = (galleryId: string) => {
    navigate(`/admin/gallery/edit-publish/${galleryId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: '待审核',
          icon: Clock,
          color: 'text-orange-600',
          bg: isLight ? 'bg-orange-50' : 'bg-orange-500/10',
        };
      case 'approved':
        return {
          label: '已发布',
          icon: CheckCircle,
          color: 'text-green-600',
          bg: isLight ? 'bg-green-50' : 'bg-green-500/10',
        };
      case 'rejected':
        return {
          label: '已拒绝',
          icon: XCircle,
          color: 'text-red-600',
          bg: isLight ? 'bg-red-50' : 'bg-red-500/10',
        };
      default:
        return {
          label: status,
          icon: AlertCircle,
          color: 'text-gray-600',
          bg: isLight ? 'bg-gray-50' : 'bg-gray-500/10',
        };
    }
  };

  const getActionButton = (gallery: PhotoGroup) => {
    if (gallery.review_status === 'pending') {
      return (
        <button
          onClick={() => handleReview(gallery.id)}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all',
            isLight
              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
          )}
        >
          <Edit2 className="w-4 h-4" />
          审核
        </button>
      );
    } else if (gallery.review_status === 'approved') {
      return (
        <button
          onClick={() => handleEditPublish(gallery.id)}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all',
            isLight
              ? 'bg-green-50 text-green-600 hover:bg-green-100'
              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
          )}
        >
          <Edit2 className="w-4 h-4" />
          编辑
        </button>
      );
    } else if (gallery.review_status === 'rejected') {
      return (
        <button
          onClick={() => handleReview(gallery.id)}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all',
            isLight
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
          )}
        >
          <Edit2 className="w-4 h-4" />
          重新审核
        </button>
      );
    }
  };

  if (role !== 'admin' && role !== 'super_admin') {
    return null;
  }

  return (
    <div className={cn(
      'h-full flex flex-col',
      isLight ? 'bg-gray-50' : 'bg-transparent'
    )}>
      {/* 顶部标题栏 */}
      <div
        className={cn(
          'flex-shrink-0 border-b px-6 py-4',
          isLight ? 'bg-white border-gray-200' : 'bg-black/40 border-wangfeng-purple/20'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-6 w-6 text-wangfeng-purple" />
            <h1
              className={cn(
                'text-2xl font-bold',
                isLight ? 'text-gray-900' : 'text-white'
              )}
            >
              图片管理
            </h1>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                isLight
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-wangfeng-purple/20 text-wangfeng-purple'
              )}
            >
              {filteredAndSortedGalleries.length} 组
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadGalleries}
              disabled={loading}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                isLight
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
                  : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-50'
              )}
              title="刷新图片列表"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex-shrink-0 px-6 py-4">
        <FilterBar
          searchValue={searchQuery}
          searchPlaceholder="搜索图组标题..."
          onSearchChange={setSearchQuery}
          categories={galleryCategories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          showStatusFilter={true}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={[
            { label: '待审核', value: 'pending' },
            { label: '已发布', value: 'approved' },
          ]}
        />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className={cn(
                'w-12 h-12 rounded-full border-4 border-transparent animate-spin mx-auto mb-4',
                isLight
                  ? 'border-t-wangfeng-purple border-r-wangfeng-purple'
                  : 'border-t-wangfeng-light border-r-wangfeng-light'
              )} />
              <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>加载中...</p>
            </div>
          </div>
        ) : error ? (
          <div className={cn(
            'p-4 rounded-lg border flex items-center gap-3',
            isLight
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          )}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        ) : filteredAndSortedGalleries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <AlertCircle className={cn(
              'w-16 h-16 mx-auto mb-4',
              isLight ? 'text-gray-400' : 'text-gray-600'
            )} />
            <p className={cn(
              'text-lg font-medium',
              isLight ? 'text-gray-600' : 'text-gray-400'
            )}>
              没有图片组
            </p>
          </div>
        ) : (
          <div className={cn(
            'border rounded-lg overflow-hidden',
            isLight ? 'border-gray-200' : 'border-wangfeng-purple/30'
          )}>
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className={cn(
                  'border-b',
                  isLight
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-black/30 border-wangfeng-purple/30'
                )}>
                  <th className="px-6 py-3 text-left font-semibold min-w-[360px]">
                    <button
                      onClick={() => handleSort('title')}
                      className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                    >
                      标题
                      {sortField === 'title' &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </button>
                  </th>
                  <th className={cn('px-6 py-3 text-left font-semibold whitespace-nowrap', columnWidths.category)}>
                    分类
                  </th>
                  <th className={cn('px-6 py-3 text-left font-semibold whitespace-nowrap', columnWidths.date)}>
                    日期
                  </th>
                  <th className={cn('px-6 py-3 text-left font-semibold whitespace-nowrap', columnWidths.submittedAt)}>
                    <button
                      onClick={() => handleSort('created_at')}
                      className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                    >
                      提交时间
                      {sortField === 'created_at' &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </button>
                  </th>
                  <th className={cn('px-6 py-3 text-left font-semibold whitespace-nowrap', columnWidths.status)}>状态</th>
                  <th className={cn('px-6 py-3 text-right font-semibold whitespace-nowrap', columnWidths.actions)}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedGalleries.map((gallery) => {
                  const statusInfo = getStatusBadge(gallery.review_status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr
                      key={gallery.id}
                      className={cn(
                        'border-b transition-colors',
                        isLight
                          ? 'border-gray-200 hover:bg-gray-50'
                          : 'border-wangfeng-purple/20 hover:bg-wangfeng-purple/5'
                      )}
                    >
                      <td className="px-6 py-4 min-w-[360px]">
                        <div className="flex items-start gap-3">
                          {gallery.cover_image_thumb_url && (
                            <img
                              src={gallery.cover_image_thumb_url}
                              alt={gallery.title}
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div>
                            <p className={cn(
                              'font-medium truncate',
                              isLight ? 'text-gray-900' : 'text-white'
                            )}>
                              {gallery.title}
                            </p>
                            <p className={cn(
                              'text-xs',
                              isLight ? 'text-gray-500' : 'text-gray-400'
                            )}>
                              {gallery.photo_count || 0} 张照片
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={cn('px-6 py-4 whitespace-nowrap', columnWidths.category)}>
                        <p className={isLight ? 'text-gray-700' : 'text-gray-300'}>
                          {gallery.category}
                        </p>
                      </td>
                      <td className={cn('px-6 py-4 whitespace-nowrap', columnWidths.date)}>
                        <p className={cn(
                          'text-sm',
                          isLight ? 'text-gray-600' : 'text-gray-400'
                        )}>
                          {gallery.display_date || gallery.date}
                        </p>
                      </td>
                      <td className={cn('px-6 py-4 whitespace-nowrap', columnWidths.submittedAt)}>
                        <p className={cn(
                          'text-sm',
                          isLight ? 'text-gray-600' : 'text-gray-400'
                        )}>
                          {new Date(gallery.created_at).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>
                      <td className={cn('px-6 py-4 whitespace-nowrap', columnWidths.status)}>
                        <div className={cn(
                          'inline-flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium',
                          statusInfo.bg,
                          statusInfo.color
                        )}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </div>
                      </td>
                      <td className={cn('px-6 py-4 whitespace-nowrap', columnWidths.actions)}>
                        <div className="flex items-center justify-end gap-2">
                          {getActionButton(gallery)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewGalleryList;
