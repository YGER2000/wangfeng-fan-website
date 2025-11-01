import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { galleryAPI, PhotoGroup } from '@/utils/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import ContentCard from '@/components/ui/ContentCard';
import FilterBar from '@/components/ui/FilterBar';
import { ReviewStatus } from '@/components/ui/StatusBadge';

// 图组分类选项
const galleryCategories = [
  { label: '巡演返图', value: '巡演返图' },
  { label: '工作花絮', value: '工作花絮' },
  { label: '日常生活', value: '日常生活' },
];

const MyGalleryList = () => {
  const { theme } = useTheme();
  const { currentRole } = useAuth();
  const navigate = useNavigate();
  const isLight = theme === 'white';

  const canManage = currentRole === 'admin' || currentRole === 'super_admin';
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // 筛选状态
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus | 'published' | null>(null);

  useEffect(() => {
    loadPhotoGroups();
  }, []);

  const loadPhotoGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const data = await galleryAPI.getMyPhotoGroups({ limit: 500 }, token);
      setPhotoGroups(data);
    } catch (error) {
      console.error('加载图组失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 筛选图组
  const filteredPhotoGroups = photoGroups.filter((group) => {
    // 搜索过滤
    if (searchValue) {
      const query = searchValue.toLowerCase();
      const matchesSearch =
        group.title.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // 分类过滤
    if (selectedCategory !== 'all' && group.category !== selectedCategory) {
      return false;
    }

    // 状态过滤
    if (selectedStatus === 'published') {
      return group.is_published;
    } else if (selectedStatus) {
      return group.review_status === selectedStatus;
    }

    return true;
  });

  const handleEdit = (id: string) => {
    navigate(`/admin/gallery/edit/${id}`, {
      state: { backPath: '/admin/my-gallery' },
    });
  };

  const handleCreate = () => {
    if (!canManage) return;
    navigate('/admin/gallery/upload');
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
            <ImageIcon className="h-6 w-6 text-wangfeng-purple" />
            <h1
              className={cn(
                'text-2xl font-bold',
                isLight ? 'text-gray-900' : 'text-white'
              )}
            >
              我的图片
            </h1>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                isLight
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-wangfeng-purple/20 text-wangfeng-purple'
              )}
            >
              {filteredPhotoGroups.length} 组
            </span>
          </div>

          {canManage && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              上传图组
            </button>
          )}
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex-shrink-0 px-6 py-4">
        <FilterBar
          searchValue={searchValue}
          searchPlaceholder="搜索图组标题或描述..."
          onSearchChange={setSearchValue}
          categories={galleryCategories}
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
        ) : filteredPhotoGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <ImageIcon
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
                ? '未找到匹配的图组'
                : '还没有上传任何图组'}
            </p>
            {!searchValue && selectedCategory === 'all' && !selectedStatus && canManage && (
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                上传第一个图组
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPhotoGroups.map((group) => (
              <ContentCard
                key={group.id}
                id={group.id}
                type="gallery"
                title={group.title}
                coverImage={group.cover_image_thumb_url || group.cover_image_url}
                category={group.category}
                description={group.description}
                author={group.author || '未知作者'}
                publishDate={group.display_date}
                status={(group.review_status || 'pending') as ReviewStatus}
                isPublished={group.is_published}
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

export default MyGalleryList;
