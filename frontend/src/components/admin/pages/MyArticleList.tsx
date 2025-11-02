import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, RefreshCw } from 'lucide-react';
import { articleAPI, Article } from '@/utils/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import ContentCard from '@/components/ui/ContentCard';
import FilterBar from '@/components/ui/FilterBar';
import { getPrimaryCategories } from '@/config/categories';
import { ReviewStatus } from '@/components/ui/StatusBadge';

const MyArticleList = () => {
  const { theme } = useTheme();
  const { currentRole } = useAuth();
  const navigate = useNavigate();
  const isLight = theme === 'white';

  const canManage = currentRole === 'admin' || currentRole === 'super_admin';
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // 筛选状态
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus | 'published' | 'draft' | null>(null);

  // 获取分类列表
  const primaryCategories = getPrimaryCategories();
  const categoryOptions = primaryCategories.map(cat => ({
    label: cat,
    value: cat,
  }));

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const data = await articleAPI.getMyArticles({
        limit: 500
      }, token);
      setArticles(data);
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 筛选文章
  const filteredArticles = articles.filter((article) => {
    // 搜索过滤
    if (searchValue) {
      const query = searchValue.toLowerCase();
      const matchesSearch =
        article.title.toLowerCase().includes(query) ||
        article.excerpt?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // 分类过滤
    if (selectedCategory !== 'all' && article.category_primary !== selectedCategory) {
      return false;
    }

    // 状态过滤
    if (selectedStatus === 'published') {
      return article.is_published;
    } else if (selectedStatus === 'draft') {
      return article.review_status === 'draft';
    } else if (selectedStatus) {
      return article.review_status === selectedStatus;
    }

    return true;
  });

  const handleEdit = (id: string) => {
    navigate(`/admin/articles/edit/${id}`, {
      state: { backPath: '/admin/my-articles' },
    });
  };

  const handleCreate = () => {
    if (!canManage) return;
    navigate('/admin/articles/create', {
      state: { backPath: '/admin/my-articles' },
    });
  };

  return (
    <div
      className={cn(
        'h-full flex flex-col',
        isLight ? 'bg-gray-50' : 'bg-transparent'
      )}
    >
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
              我的文章
            </h1>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                isLight
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-wangfeng-purple/20 text-wangfeng-purple'
              )}
            >
              {filteredArticles.length} 篇
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
            {canManage && (
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                创建文章
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex-shrink-0 px-6 py-4">
        <FilterBar
          searchValue={searchValue}
          searchPlaceholder="搜索文章标题或内容..."
          onSearchChange={setSearchValue}
          categories={categoryOptions}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          showStatusFilter={true}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />
      </div>

      {/* 主要内容区域 - 卡片网格 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple"></div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <FileText
              className={cn(
                'h-12 w-12 mb-4',
                isLight ? 'text-gray-300' : 'text-gray-600'
              )}
            />
            <p
              className={cn(
                'text-sm mb-4',
                isLight ? 'text-gray-500' : 'text-gray-400'
              )}
            >
              {searchValue || selectedCategory !== 'all' || selectedStatus
                ? '未找到匹配的文章'
                : '还没有创建任何文章'}
            </p>
            {!searchValue && selectedCategory === 'all' && !selectedStatus && canManage && (
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                创建第一篇文章
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredArticles.map((article) => (
              <ContentCard
                key={article.id}
                id={article.id}
                type="article"
                title={article.title}
                coverImage={article.cover_url}
                category={article.category_primary}
                description={article.excerpt}
                author={article.author}
                publishDate={new Date(article.published_at).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
                status={article.review_status as ReviewStatus}
                isPublished={article.is_published}
                rejectionReason={null}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyArticleList;
