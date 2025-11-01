// -*- coding: utf-8 -*-
/**
 * 文章审核列表
 * 用途: 管理员审核待发布的文章
 * 显示: 仅 pending 状态的文章
 * 功能: 查看、编辑、批准、拒绝
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  User,
  AlertTriangle,
  Edit2,
  MoreHorizontal,
} from 'lucide-react';
import { articleAPI, Article } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { getPrimaryCategories } from '@/config/categories';

type SortField = 'created_at' | 'title' | 'author';
type SortOrder = 'asc' | 'desc';

const ReviewArticleList = () => {
  const { theme } = useTheme();
  const { currentRole } = useAuth();
  const navigate = useNavigate();
  const isLight = theme === 'white';

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选和排序状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const primaryCategories = getPrimaryCategories();

  // 权限检查 - 只有ADMIN+可以访问
  useEffect(() => {
    if (currentRole !== 'admin' && currentRole !== 'super_admin') {
      navigate('/admin/dashboard');
    }
  }, [currentRole, navigate]);

  // 加载待审核的文章
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      // 获取所有文章，然后筛选pending状态
      const data = await articleAPI.getAllArticles({ limit: 500 }, token);
      const pendingArticles = data.filter((a: Article) => a.review_status === 'pending');
      setArticles(pendingArticles);
    } catch (err) {
      console.error('加载审核文章失败:', err);
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

    // 排序
    result.sort((a, b) => {
      let aVal, bVal;
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
  }, [articles, searchQuery, selectedCategory, sortField, sortOrder]);

  const handleEditForReview = (articleId: string) => {
    navigate(`/admin/articles/review/${articleId}`);
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
          <h1 className="text-2xl font-bold">文章审核</h1>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{articles.length} 篇待审核</span>
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
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">没有待审核的文章</p>
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
                      onClick={() => toggleSort('created_at')}
                      className="flex items-center gap-2 hover:text-wangfeng-purple"
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
                      isLight
                        ? 'hover:bg-gray-50'
                        : 'hover:bg-wangfeng-purple/5'
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                        <span className="line-clamp-2 font-medium">{article.title}</span>
                      </div>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{article.author}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-500">
                        {new Date(article.created_at || '').toLocaleDateString('zh-CN')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEditForReview(article.id)}
                        className={cn(
                          'inline-flex items-center gap-2 px-3 py-1 rounded font-medium transition-all',
                          isLight
                            ? 'bg-wangfeng-purple text-white hover:bg-wangfeng-dark'
                            : 'bg-wangfeng-purple/20 text-wangfeng-light hover:bg-wangfeng-purple/30'
                        )}
                      >
                        <Edit2 className="w-4 h-4" />
                        审核
                      </button>
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

export default ReviewArticleList;
