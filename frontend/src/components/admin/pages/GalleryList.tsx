import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Image as ImageIcon,
  Calendar,
  ChevronUp,
  ChevronDown,
  Eye,
  User,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { buildApiUrl } from '@/config/api';

interface PhotoGroup {
  id: string;
  title: string;
  category: string;
  date: string;
  display_date: string;
  year: string;
  description?: string;
  cover_image_url?: string;
  cover_image_thumb_url?: string;
  is_published: boolean;
  review_status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
  author_id?: string;
}

type SortField = 'date' | 'created_at' | 'title';
type SortOrder = 'asc' | 'desc';

const categoryOptions = [
  { value: 'all', label: '全部分类' },
  { value: '巡演返图', label: '巡演返图' },
  { value: '工作花絮', label: '工作花絮' },
  { value: '日常生活', label: '日常生活' }
];

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'published', label: '已发布' }
];

const GalleryList = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // 筛选和排序状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    loadPhotoGroups();
  }, []);

  const loadPhotoGroups = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildApiUrl('/gallery/admin/groups?limit=100'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('加载图组失败');
      }

      const data = await response.json();
      setPhotoGroups(data);
    } catch (error) {
      console.error('加载图组失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 筛选和排序逻辑
  const filteredAndSortedPhotoGroups = useMemo(() => {
    let result = [...photoGroups];

    // 管理中心只显示已发布和待审核 - 草稿和已驳回在"我的图片"中显示
    result = result.filter(group =>
      group.review_status === 'pending' || group.is_published === true
    );

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        group =>
          group.title.toLowerCase().includes(query) ||
          (group.description && group.description.toLowerCase().includes(query))
      );
    }

    // 分类过滤
    if (selectedCategory !== 'all') {
      result = result.filter(group => group.category === selectedCategory);
    }

    // 状态过滤
    if (selectedStatus !== 'all') {
      result = result.filter(group => {
        if (selectedStatus === 'published') return group.is_published === true;
        if (selectedStatus === 'pending') return group.review_status === 'pending';
        return true;
      });
    }

    // 排序
    result.sort((a, b) => {
      let compareResult = 0;

      switch (sortField) {
        case 'date':
          compareResult = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'created_at':
          compareResult = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'title':
          compareResult = a.title.localeCompare(b.title, 'zh-CN');
          break;
      }

      return sortOrder === 'asc' ? compareResult : -compareResult;
    });

    return result;
  }, [photoGroups, searchQuery, selectedCategory, selectedStatus, sortField, sortOrder]);

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
            <ImageIcon className="h-6 w-6 text-wangfeng-purple" />
            <h1 className={cn(
              "text-2xl font-bold",
              isLight ? "text-gray-900" : "text-white"
            )}>
              图组列表
            </h1>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              isLight
                ? "bg-gray-200 text-gray-700"
                : "bg-wangfeng-purple/20 text-wangfeng-purple"
            )}>
              {filteredAndSortedPhotoGroups.length} 个
            </span>
          </div>

          <Link
            to="/admin/gallery/upload"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            上传图组
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
                placeholder="搜索图组标题或描述..."
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
              {categoryOptions.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* 状态筛选 */}
          <div className="flex items-center gap-2">
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
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 主要内容区域 - 卡片展示 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple"></div>
          </div>
        ) : filteredAndSortedPhotoGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <ImageIcon className={cn(
              "h-12 w-12 mb-4",
              isLight ? "text-gray-300" : "text-gray-600"
            )} />
            <p className={cn(
              "text-sm",
              isLight ? "text-gray-500" : "text-gray-400"
            )}>
              {searchQuery || selectedCategory !== 'all' ? '未找到匹配的图组' : '暂无图组'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedPhotoGroups.map((group) => (
              <div
                key={group.id}
                className={cn(
                  "rounded-lg border overflow-hidden transition-all hover:shadow-lg",
                  isLight
                    ? "bg-white border-gray-200 hover:border-wangfeng-purple"
                    : "bg-black/40 border-wangfeng-purple/20 hover:border-wangfeng-purple"
                )}
              >
                {/* 封面图 */}
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  {group.cover_image_thumb_url ? (
                    <img
                      src={group.cover_image_thumb_url}
                      alt={group.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className={cn(
                        "h-12 w-12",
                        isLight ? "text-gray-400" : "text-gray-600"
                      )} />
                    </div>
                  )}

                  {/* 状态标签 */}
                  <div className="absolute top-2 right-2">
                    {group.is_published ? (
                      <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        已发布
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                        <Clock className="h-3 w-3" />
                        待审核
                      </div>
                    )}
                  </div>
                </div>

                {/* 信息 */}
                <div className="p-4">
                  <h3 className={cn(
                    "font-semibold mb-2 line-clamp-1",
                    isLight ? "text-gray-900" : "text-white"
                  )}>
                    {group.title}
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        isLight
                          ? "bg-wangfeng-purple/10 text-wangfeng-purple"
                          : "bg-wangfeng-purple/20 text-wangfeng-purple"
                      )}>
                        {group.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className={cn(
                        "h-3.5 w-3.5",
                        isLight ? "text-gray-400" : "text-gray-500"
                      )} />
                      <span className={cn(
                        "text-xs",
                        isLight ? "text-gray-600" : "text-gray-400"
                      )}>
                        {group.display_date || new Date(group.date).toLocaleDateString('zh-CN')}
                      </span>
                    </div>

                    {group.author_id && (
                      <div className="flex items-center gap-1.5">
                        <User className={cn(
                          "h-3.5 w-3.5",
                          isLight ? "text-gray-400" : "text-gray-500"
                        )} />
                        <span className={cn(
                          "text-xs",
                          isLight ? "text-gray-600" : "text-gray-400"
                        )}>
                          创建者ID: {group.author_id.slice(0, 8)}...
                        </span>
                      </div>
                    )}

                    {group.description && (
                      <p className={cn(
                        "text-xs line-clamp-2",
                        isLight ? "text-gray-500" : "text-gray-400"
                      )}>
                        {group.description}
                      </p>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      to={group.is_published ? `/admin/gallery/edit-publish/${group.id}` : `/admin/gallery/edit/${group.id}`}
                      className={cn(
                        "flex-1 text-center px-3 py-1.5 rounded border text-xs font-medium transition-colors",
                        isLight
                          ? "border-wangfeng-purple text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white"
                          : "border-wangfeng-purple text-wangfeng-purple hover:bg-wangfeng-purple/20"
                      )}
                    >
                      编辑
                    </Link>
                    <Link
                      to={`/gallery/${group.id}`}
                      target="_blank"
                      className={cn(
                        "px-3 py-1.5 rounded border text-xs font-medium transition-colors flex items-center gap-1",
                        isLight
                          ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                          : "border-wangfeng-purple/30 text-gray-400 hover:bg-wangfeng-purple/10"
                      )}
                    >
                      <Eye className="h-3 w-3" />
                      预览
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryList;
