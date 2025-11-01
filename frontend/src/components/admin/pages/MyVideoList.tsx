import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Video as VideoIcon } from 'lucide-react';
import { videoAPI, Video } from '@/utils/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import ContentCard from '@/components/ui/ContentCard';
import FilterBar from '@/components/ui/FilterBar';
import { ReviewStatus } from '@/components/ui/StatusBadge';

// 视频分类选项
const videoCategories = [
  { label: '演出现场', value: '演出现场' },
  { label: '单曲现场', value: '单曲现场' },
  { label: '综艺节目', value: '综艺节目' },
  { label: '歌曲mv', value: '歌曲mv' },
  { label: '访谈节目', value: '访谈节目' },
  { label: '纪录片', value: '纪录片' },
  { label: '其他', value: '其他' },
];

const MyVideoList = () => {
  const { theme } = useTheme();
  const { currentRole } = useAuth();
  const navigate = useNavigate();
  const isLight = theme === 'white';

  const canManage = currentRole === 'admin' || currentRole === 'super_admin';
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // 筛选状态
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus | 'published' | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const data = await videoAPI.getMyVideos({ limit: 500 }, token);
      setVideos(data);
    } catch (error) {
      console.error('加载视频失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 筛选视频
  const filteredVideos = videos.filter((video) => {
    // 搜索过滤
    if (searchValue) {
      const query = searchValue.toLowerCase();
      const matchesSearch =
        video.title.toLowerCase().includes(query) ||
        video.description?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // 分类过滤
    if (selectedCategory !== 'all' && video.category !== selectedCategory) {
      return false;
    }

    // 状态过滤
    if (selectedStatus === 'published') {
      return video.is_published === 1;
    } else if (selectedStatus) {
      return video.review_status === selectedStatus;
    }

    return true;
  });

  const handleEdit = (id: string) => {
    navigate(`/admin/videos/edit/${id}`, {
      state: { backPath: '/admin/my-videos' },
    });
  };

  const handleCreate = () => {
    if (!canManage) return;
    navigate('/admin/videos/create');
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
            <VideoIcon className="h-6 w-6 text-wangfeng-purple" />
            <h1
              className={cn(
                'text-2xl font-bold',
                isLight ? 'text-gray-900' : 'text-white'
              )}
            >
              我的视频
            </h1>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                isLight
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-wangfeng-purple/20 text-wangfeng-purple'
              )}
            >
              {filteredVideos.length} 个
            </span>
          </div>

          {canManage && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              上传视频
            </button>
          )}
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex-shrink-0 px-6 py-4">
        <FilterBar
          searchValue={searchValue}
          searchPlaceholder="搜索视频标题或描述..."
          onSearchChange={setSearchValue}
          categories={videoCategories}
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
        ) : filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <VideoIcon
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
                ? '未找到匹配的视频'
                : '还没有上传任何视频'}
            </p>
            {!searchValue && selectedCategory === 'all' && !selectedStatus && canManage && (
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                上传第一个视频
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVideos.map((video) => (
              <ContentCard
                key={video.id}
                id={video.id}
                type="video"
                title={video.title}
                coverImage={video.cover_thumb || video.cover_local || video.cover_url}
                category={video.category}
                description={video.description}
                author={video.author}
                publishDate={new Date(video.publish_date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
                status={video.review_status as ReviewStatus}
                isPublished={video.review_status === 'approved' && video.is_published === 1}
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

export default MyVideoList;
