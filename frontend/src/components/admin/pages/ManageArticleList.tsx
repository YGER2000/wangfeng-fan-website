// -*- coding: utf-8 -*-
/**
 * 文章管理列表
 * 用途: 管理员管理已发布的文章
 * 显示: 所有已发布的文章
 * 功能: 查看、编辑、删除(仅SUPER_ADMIN)
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  Eye,
  Calendar,
  Trash2,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { articleAPI, Article } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { getPrimaryCategories } from '@/config/categories';

type SortField = 'published_at' | 'view_count' | 'title' | 'author';
type SortOrder = 'asc' | 'desc';

const ManageArticleList = () => {
  const { theme } = useTheme();
  const { currentRole: role } = useAuth();
  const navigate = useNavigate();
  const isLight = theme === 'white';
  const isSuperAdmin = role === 'super_admin';

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 筛选和排序状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('published');
  const [sortField, setSortField] = useState<SortField>('published_at');
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
      // 筛选已发布的文章
      const publishedArticles = data.filter((a: Article) => a.is_published);
      setArticles(publishedArticles);
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

    // 状态过滤
    if (statusFilter !== 'all') {
      if (statusFilter === 'published') {
        result = result.filter(article => article.is_published);
      } else if (statusFilter === 'draft') {
        result = result.filter(article => !article.is_published);
      }
    }

    // 排序
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'published_at':
          aVal = new Date(a.published_at || a.created_at || 0).getTime();
          bVal = new Date(b.published_at || b.created_at || 0).getTime();
          break;
        case 'view_count':
          aVal = a.view_count || 0;
          bVal = b.view_count || 0;
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

  const handleEditForManage = (articleId: string) => {
    navigate(`/admin/articles/edit/${articleId}?isManage=true`);
  };

  const handleDelete = async (articleId: string) => {
    try {
      setDeleting(true);
      const token = localStorage.getItem('access_token');
      await articleAPI.deleteArticle(articleId, token);
      setArticles(articles.filter(a => a.id !== articleId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败，请重试');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div
      className={cn(
        'h-full flex flex-col overflow-hidden',
        isLight ? 'bg-white' : 'bg-black/40'
      )}
    >
      {/* 标题栏 */}
      <div
        className={cn(
          'p-6 border-b',
          isLight ? 'border-gray-200 bg-white' : 'border-wangfeng-purple/20 bg-black/40'
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">文章管理</h1>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/10 text-green-600">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">{articles.length} 篇已发布</span>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex gap-4 flex-wrap">
          {/* 搜索 */}
          <div
            className={cn(
              'flex-1 min-w-48 flex items-center gap-2 px-4 py-2 rounded-lg border',
              isLight
                ? 'bg-white border-gray-300'
                : 'bg-black/30 border-wangfeng-purple/30'
            )}
          >
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索标题或作者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'flex-1 bg-transparent outline-none text-sm',
                isLight ? 'text-gray-900' : 'text-white'
              )}
            />
          </div>

          {/* 分类筛选 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={cn(
              'px-4 py-2 rounded-lg border text-sm font-medium',
              isLight
                ? 'bg-white border-gray-300 text-gray-900'
                : 'bg-black/30 border-wangfeng-purple/30 text-white'
            )}
          >
            <option value="all">全部分类</option>
            {primaryCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* 刷新按钮 */}
          <button
            onClick={loadArticles}
            disabled={loading}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all',
              isLight
                ? 'bg-wangfeng-purple text-white hover:bg-wangfeng-dark'
                : 'bg-wangfeng-purple/20 text-wangfeng-light hover:bg-wangfeng-purple/30'
            )}
          >
            刷新
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-wangfeng-purple border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div
              className={cn(
                'p-4 rounded-lg border',
                isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/30'
              )}
            >
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        ) : filteredAndSortedArticles.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">没有文章</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* 表头 */}
              <thead
                className={cn(
                  'sticky top-0 border-b',
                  isLight
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-black/50 border-wangfeng-purple/20'
                )}
              >
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">
                    <button
                      onClick={() => toggleSort('title')}
                      className="flex items-center gap-2 hover:text-wangfeng-purple"
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
                  <th className="px-6 py-3 text-left font-semibold">分类</th>
                  <th className="px-6 py-3 text-left font-semibold">
                    <button
                      onClick={() => toggleSort('author')}
                      className="flex items-center gap-2 hover:text-wangfeng-purple"
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
                  <th className="px-6 py-3 text-left font-semibold">
                    <button
                      onClick={() => toggleSort('published_at')}
                      className="flex items-center gap-2 hover:text-wangfeng-purple"
                    >
                      发布时间
                      {sortField === 'published_at' &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left font-semibold">
                    <button
                      onClick={() => toggleSort('view_count')}
                      className="flex items-center gap-2 hover:text-wangfeng-purple"
                    >
                      浏览
                      {sortField === 'view_count' &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right font-semibold">操作</th>
                </tr>
              </thead>

              {/* 表体 */}
              <tbody
                className={cn(
                  isLight ? 'divide-y divide-gray-200' : 'divide-y divide-wangfeng-purple/10'
                )}
              >
                {filteredAndSortedArticles.map((article) => (
                  <tr
                    key={article.id}
                    className={cn(
                      'transition-colors',
                      deleteConfirm === article.id ? (isLight ? 'bg-red-50' : 'bg-red-500/10') : (isLight ? 'hover:bg-gray-50' : 'hover:bg-wangfeng-purple/5')
                    )}
                  >
                    <td className="px-6 py-4">
                      <span className="line-clamp-2 font-medium">{article.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-block px-2 py-1 rounded text-xs font-medium',
                          isLight
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-blue-500/20 text-blue-300'
                        )}
                      >
                        {article.category_primary || article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">{article.author}</td>
                    <td className="px-6 py-4">
                      <span className="text-gray-500">
                        {new Date(article.published_at || article.created_at || '').toLocaleDateString('zh-CN')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800">
                        <Eye className="w-3 h-3" />
                        {article.view_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {deleteConfirm === article.id ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleDelete(article.id)}
                            disabled={deleting}
                            className="px-3 py-1 rounded text-xs font-medium bg-red-500 text-white hover:bg-red-600"
                          >
                            确认删除
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            disabled={deleting}
                            className={cn(
                              'px-3 py-1 rounded text-xs font-medium',
                              isLight ? 'bg-gray-200 text-gray-700' : 'bg-gray-700 text-gray-200'
                            )}
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEditForManage(article.id)}
                            className={cn(
                              'inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all',
                              isLight
                                ? 'bg-wangfeng-purple text-white hover:bg-wangfeng-dark'
                                : 'bg-wangfeng-purple/20 text-wangfeng-light hover:bg-wangfeng-purple/30'
                            )}
                          >
                            <Edit2 className="w-3 h-3" />
                            编辑
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => setDeleteConfirm(article.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-3 h-3" />
                              删除
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 底部统计 */}
      {filteredAndSortedArticles.length > 0 && (
        <div
          className={cn(
            'p-4 border-t text-sm text-gray-500 text-center',
            isLight ? 'border-gray-200 bg-white' : 'border-wangfeng-purple/20 bg-black/40'
          )}
        >
          显示 {filteredAndSortedArticles.length} / {articles.length} 篇文章
        </div>
      )}
    </div>
  );
};

export default ManageArticleList;
