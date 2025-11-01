import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  Eye,
  Calendar,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { articleAPI, Article } from '@/utils/api';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { getPrimaryCategories } from '@/config/categories';

type SortField = 'published_at' | 'view_count' | 'title';
type SortOrder = 'asc' | 'desc';

const ArticleList = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // 筛选和排序状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('published_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 获取所有可用的一级分类
  const primaryCategories = getPrimaryCategories();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const data = await articleAPI.getList({ limit: 100, published_only: false });
      setArticles(data);
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 筛选和排序逻辑
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
      let compareResult = 0;

      switch (sortField) {
        case 'published_at':
          compareResult = new Date(a.published_at).getTime() - new Date(b.published_at).getTime();
          break;
        case 'view_count':
          compareResult = (a.view_count || 0) - (b.view_count || 0);
          break;
        case 'title':
          compareResult = a.title.localeCompare(b.title, 'zh-CN');
          break;
      }

      return sortOrder === 'asc' ? compareResult : -compareResult;
    });

    return result;
  }, [articles, searchQuery, selectedCategory, sortField, sortOrder]);

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
            <FileText className="h-6 w-6 text-wangfeng-purple" />
            <h1 className={cn(
              "text-2xl font-bold",
              isLight ? "text-gray-900" : "text-white"
            )}>
              文章列表
            </h1>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              isLight
                ? "bg-gray-200 text-gray-700"
                : "bg-wangfeng-purple/20 text-wangfeng-purple"
            )}>
              {filteredAndSortedArticles.length} 篇
            </span>
          </div>

          <Link
            to="/admin/articles/create"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            发布文章
          </Link>
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
                placeholder="搜索文章标题或作者..."
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

          {/* 分类筛选 */}
          <div className="flex items-center gap-2">
            <Filter className={cn(
              "h-4 w-4",
              isLight ? "text-gray-600" : "text-gray-400"
            )} />
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
              {primaryCategories.map(category => (
                <option key={category} value={category}>{category}</option>
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
          ) : filteredAndSortedArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <FileText className={cn(
                "h-12 w-12 mb-4",
                isLight ? "text-gray-300" : "text-gray-600"
              )} />
              <p className={cn(
                "text-sm",
                isLight ? "text-gray-500" : "text-gray-400"
              )}>
                {searchQuery || selectedCategory !== 'all' ? '未找到匹配的文章' : '暂无文章'}
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
                      作者
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
                      <button
                        onClick={() => toggleSort('view_count')}
                        className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                      >
                        浏览量
                        <SortIcon field="view_count" />
                      </button>
                    </th>
                    <th className={cn(
                      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                      isLight ? "text-gray-600" : "text-gray-400"
                    )}>
                      <button
                        onClick={() => toggleSort('published_at')}
                        className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                      >
                        发布时间
                        <SortIcon field="published_at" />
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
                  {filteredAndSortedArticles.map((article) => (
                    <tr
                      key={article.id}
                      className={cn(
                        "transition-colors",
                        isLight
                          ? "hover:bg-gray-50"
                          : "hover:bg-wangfeng-purple/5"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <Link
                            to={`/admin/articles/edit/${article.id}`}
                            className={cn(
                              "font-medium hover:text-wangfeng-purple transition-colors line-clamp-1",
                              isLight ? "text-gray-900" : "text-white"
                            )}
                          >
                            {article.title}
                          </Link>
                          {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {article.tags.slice(0, 2).map((tag, index) => (
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
                      <td className={cn(
                        "px-6 py-4 text-sm",
                        isLight ? "text-gray-700" : "text-gray-300"
                      )}>
                        {article.author}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={cn(
                            "text-sm font-medium",
                            isLight ? "text-wangfeng-purple" : "text-wangfeng-purple"
                          )}>
                            {article.category_primary}
                          </span>
                          {article.category_secondary && (
                            <span className={cn(
                              "text-xs",
                              isLight ? "text-gray-500" : "text-gray-400"
                            )}>
                              {article.category_secondary}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {article.review_status === 'pending' && (
                            <>
                              <Clock className="h-4 w-4 text-yellow-500" />
                              <span className={cn(
                                "text-sm font-medium",
                                isLight ? "text-yellow-700" : "text-yellow-400"
                              )}>
                                待审核
                              </span>
                            </>
                          )}
                          {article.review_status === 'approved' && (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className={cn(
                                "text-sm font-medium",
                                isLight ? "text-green-700" : "text-green-400"
                              )}>
                                已发布
                              </span>
                            </>
                          )}
                          {article.review_status === 'rejected' && (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className={cn(
                                "text-sm font-medium",
                                isLight ? "text-red-700" : "text-red-400"
                              )}>
                                已驳回
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Eye className={cn(
                            "h-4 w-4",
                            isLight ? "text-gray-400" : "text-gray-500"
                          )} />
                          <span className={cn(
                            "text-sm",
                            isLight ? "text-gray-700" : "text-gray-300"
                          )}>
                            {article.view_count || 0}
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
                            {new Date(article.published_at).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/admin/articles/edit/${article.id}`}
                          className={cn(
                            "text-sm font-medium hover:underline",
                            isLight ? "text-wangfeng-purple" : "text-wangfeng-purple"
                          )}
                        >
                          编辑
                        </Link>
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

export default ArticleList;
