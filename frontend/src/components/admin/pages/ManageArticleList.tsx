// -*- coding: utf-8 -*-
/**
 * 文章管理列表（集审核和管理于一体）
 * 用途: 管理员审核待审核的文章，编辑已发布的文章
 * 显示: 所有审核状态的文章（pending、approved、rejected）
 * 功能:
 *   - 待审核(pending): 显示"审核"按钮
 *   - 已发布(approved): 显示"编辑"按钮
 *   - 已拒绝(rejected): 显示"重新审核"按钮
 *   - 删除功能已移至编辑界面第三步
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronUp,
  ChevronDown,
  Edit2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { articleAPI, Article } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { getPrimaryCategories } from '@/config/categories';
import FilterBar from '@/components/ui/FilterBar';

type SortField = 'created_at' | 'title' | 'author';
type SortOrder = 'asc' | 'desc';

const columnWidths = {
  category: 'w-32',
  author: 'w-40',
  date: 'w-36',
  status: 'w-32',
  actions: 'w-28',
};

const ManageArticleList = () => {
  const { theme } = useTheme();
  const { currentRole: role } = useAuth();
  const navigate = useNavigate();
  const isLight = theme === 'white';

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选和排序状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'draft' | 'published' | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const primaryCategories = getPrimaryCategories();

  // 权限检查 - 只有ADMIN+可以访问
  useEffect(() => {
    if (role !== 'admin' && role !== 'super_admin') {
      navigate('/admin/dashboard');
    }
  }, [role, navigate]);

  // 加载所有文章
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      const data = await articleAPI.getAllArticles({ limit: 500 }, token);
      setArticles(data);
    } catch (err) {
      console.error('加载文章失败:', err);
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 筛选和排序
  const filteredAndSortedArticles = useMemo(() => {
    let result = [...articles];

    // 【重要】仅显示待审核和已发布的文章（过滤掉草稿和已驳回）
    result = result.filter(
      (article) => article.review_status === 'pending' || article.review_status === 'approved'
    );

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        article =>
          article.title.toLowerCase().includes(query) ||
          article.author.toLowerCase().includes(query)
      );
    }

    // 分类过滤
    if (selectedCategory !== 'all') {
      result = result.filter(article => article.category_primary === selectedCategory);
    }

    // 审核状态过滤
    if (statusFilter !== null) {
      result = result.filter(article => article.review_status === statusFilter);
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
        case 'author':
          aVal = a.author.toLowerCase();
          bVal = b.author.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [articles, searchQuery, selectedCategory, statusFilter, sortField, sortOrder]);

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleReview = (articleId: string) => {
    // 待审核文章进入审核页面
    navigate(`/admin/articles/review/${articleId}`);
  };

  const handleEditPublish = (articleId: string) => {
    // 已发布文章进入编辑发布页面
    navigate(`/admin/articles/edit-publish/${articleId}`);
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

  const getActionButton = (article: Article) => {
    if (article.review_status === 'pending') {
      return (
        <button
          onClick={() => handleReview(article.id)}
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
    } else if (article.review_status === 'approved') {
      return (
        <button
          onClick={() => handleEditPublish(article.id)}
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
    } else if (article.review_status === 'rejected') {
      return (
        <button
          onClick={() => handleReview(article.id)}
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
            <FileText className="h-6 w-6 text-wangfeng-purple" />
            <h1
              className={cn(
                'text-2xl font-bold',
                isLight ? 'text-gray-900' : 'text-white'
              )}
            >
              文章管理
            </h1>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                isLight
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-wangfeng-purple/20 text-wangfeng-purple'
              )}
            >
              {filteredAndSortedArticles.length} 篇
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadArticles}
              disabled={loading}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                isLight
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
                  : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-50'
              )}
              title="刷新文章列表"
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
          searchPlaceholder="搜索文章标题或作者..."
          onSearchChange={setSearchQuery}
          categories={primaryCategories.map(cat => ({
            label: cat,
            value: cat,
          }))}
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
        ) : filteredAndSortedArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <AlertCircle className={cn(
              'w-16 h-16 mx-auto mb-4',
              isLight ? 'text-gray-400' : 'text-gray-600'
            )} />
            <p className={cn(
              'text-lg font-medium',
              isLight ? 'text-gray-600' : 'text-gray-400'
            )}>
              没有文章
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
                  <th className="px-6 py-3 text-left font-semibold min-w-[320px]">
                    <button
                      onClick={() => handleToggleSort('title')}
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
                  <th className={cn('px-6 py-3 text-left font-semibold whitespace-nowrap', columnWidths.author)}>
                    <button
                      onClick={() => handleToggleSort('author')}
                      className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                    >
                      作者
                      {sortField === 'author' &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </button>
                  </th>
                  <th className={cn('px-6 py-3 text-left font-semibold whitespace-nowrap', columnWidths.date)}>
                    <button
                      onClick={() => handleToggleSort('created_at')}
                      className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                    >
                      创建时间
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
                {filteredAndSortedArticles.map((article) => {
                  const statusInfo = getStatusBadge(article.review_status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr
                      key={article.id}
                      className={cn(
                        'border-b transition-colors',
                        isLight
                          ? 'border-gray-200 hover:bg-gray-50'
                          : 'border-wangfeng-purple/20 hover:bg-wangfeng-purple/5'
                      )}
                    >
                      <td className="px-6 py-4 min-w-[320px]">
                        <p className={cn(
                          'font-medium truncate',
                          isLight ? 'text-gray-900' : 'text-white'
                        )}>
                          {article.title}
                        </p>
                      </td>
                      <td className={cn('px-6 py-4 whitespace-nowrap', columnWidths.category)}>
                        <p className={isLight ? 'text-gray-700' : 'text-gray-300'}>
                          {article.category_primary}
                        </p>
                      </td>
                      <td className={cn('px-6 py-4 whitespace-nowrap', columnWidths.author)}>
                        <p className={isLight ? 'text-gray-700' : 'text-gray-300'}>
                          {article.author}
                        </p>
                      </td>
                      <td className={cn('px-6 py-4 whitespace-nowrap', columnWidths.date)}>
                        <p className={cn(
                          'text-xs',
                          isLight ? 'text-gray-600' : 'text-gray-400'
                        )}>
                          {new Date(article.created_at).toLocaleDateString('zh-CN')}
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
                          {getActionButton(article)}
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

export default ManageArticleList;
