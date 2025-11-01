import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Video as VideoIcon,
  Calendar,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Eye,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { videoAPI, Video } from '@/utils/api';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

type SortField = 'publish_date' | 'created_at' | 'title';
type SortOrder = 'asc' | 'desc';

const categoryOptions = [
  { value: 'all', label: '全部分类' },
  { value: '演出现场', label: '演出现场' },
  { value: '单曲现场', label: '单曲现场' },
  { value: '综艺节目', label: '综艺节目' },
  { value: '歌曲mv', label: '歌曲MV' },
  { value: '访谈节目', label: '访谈节目' },
  { value: '纪录片', label: '纪录片' },
  { value: '其他', label: '其他' }
];

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'published', label: '已发布' },
  { value: 'approved', label: '已审核' },
  { value: 'pending', label: '待审核' }
];

const VideoList = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // 筛选和排序状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('publish_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const data = await videoAPI.getList({ limit: 100 });
      setVideos(data);
    } catch (error) {
      console.error('加载视频失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取发布状态
  const getPublishStatus = (video: Video) => {
    if (video.is_published === 1) {
      return {
        text: '已发布',
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: isLight ? 'bg-green-50' : 'bg-green-500/10'
      };
    } else if (video.review_status === 'approved') {
      return {
        text: '已审核',
        icon: Clock,
        color: 'text-blue-500',
        bgColor: isLight ? 'bg-blue-50' : 'bg-blue-500/10'
      };
    } else {
      return {
        text: '待审核',
        icon: XCircle,
        color: 'text-yellow-500',
        bgColor: isLight ? 'bg-yellow-50' : 'bg-yellow-500/10'
      };
    }
  };

  // 筛选和排序逻辑
  const filteredAndSortedVideos = useMemo(() => {
    let result = [...videos];

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        video =>
          video.title.toLowerCase().includes(query) ||
          video.author.toLowerCase().includes(query) ||
          (video.description && video.description.toLowerCase().includes(query))
      );
    }

    // 分类过滤
    if (selectedCategory !== 'all') {
      result = result.filter(video => video.category === selectedCategory);
    }

    // 状态过滤
    if (selectedStatus !== 'all') {
      result = result.filter(video => {
        if (selectedStatus === 'published') return video.is_published === 1;
        if (selectedStatus === 'approved') return video.review_status === 'approved' && video.is_published !== 1;
        if (selectedStatus === 'pending') return video.review_status === 'pending';
        return true;
      });
    }

    // 排序
    result.sort((a, b) => {
      let compareResult = 0;

      switch (sortField) {
        case 'publish_date':
          compareResult = new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime();
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
  }, [videos, searchQuery, selectedCategory, selectedStatus, sortField, sortOrder]);

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

  // 生成B站链接
  const getBilibiliUrl = (bvid: string) => {
    return `https://www.bilibili.com/video/${bvid}`;
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
            <VideoIcon className="h-6 w-6 text-wangfeng-purple" />
            <h1 className={cn(
              "text-2xl font-bold",
              isLight ? "text-gray-900" : "text-white"
            )}>
              视频列表
            </h1>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              isLight
                ? "bg-gray-200 text-gray-700"
                : "bg-wangfeng-purple/20 text-wangfeng-purple"
            )}>
              {filteredAndSortedVideos.length} 个
            </span>
          </div>

          <Link
            to="/admin/videos/create"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            添加视频
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
                placeholder="搜索视频标题、作者或描述..."
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
                <option key={category.value} value={category.value}>{category.label}</option>
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
          ) : filteredAndSortedVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <VideoIcon className={cn(
                "h-12 w-12 mb-4",
                isLight ? "text-gray-300" : "text-gray-600"
              )} />
              <p className={cn(
                "text-sm",
                isLight ? "text-gray-500" : "text-gray-400"
              )}>
                {searchQuery || selectedCategory !== 'all' ? '未找到匹配的视频' : '暂无视频'}
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
                      BVID
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
                        onClick={() => toggleSort('publish_date')}
                        className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                      >
                        发布日期
                        <SortIcon field="publish_date" />
                      </button>
                    </th>
                    <th className={cn(
                      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                      isLight ? "text-gray-600" : "text-gray-400"
                    )}>
                      <button
                        onClick={() => toggleSort('created_at')}
                        className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                      >
                        创建时间
                        <SortIcon field="created_at" />
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
                  {filteredAndSortedVideos.map((video) => (
                    <tr
                      key={video.id}
                      className={cn(
                        "transition-colors",
                        isLight
                          ? "hover:bg-gray-50"
                          : "hover:bg-wangfeng-purple/5"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className={cn(
                            "font-medium line-clamp-2",
                            isLight ? "text-gray-900" : "text-white"
                          )}>
                            {video.title}
                          </div>
                          {video.description && (
                            <div className={cn(
                              "text-xs line-clamp-1",
                              isLight ? "text-gray-500" : "text-gray-400"
                            )}>
                              {video.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-sm",
                        isLight ? "text-gray-700" : "text-gray-300"
                      )}>
                        {video.author}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          isLight
                            ? "bg-wangfeng-purple/10 text-wangfeng-purple"
                            : "bg-wangfeng-purple/20 text-wangfeng-purple"
                        )}>
                          {video.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={getBilibiliUrl(video.bvid)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-1 text-sm hover:text-wangfeng-purple transition-colors",
                            isLight ? "text-blue-600" : "text-blue-400"
                          )}
                        >
                          {video.bvid}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const status = getPublishStatus(video);
                          const StatusIcon = status.icon;
                          return (
                            <div className="flex items-center gap-2">
                              <StatusIcon className={cn("h-4 w-4", status.color)} />
                              <span className={cn(
                                "text-sm font-medium",
                                status.color
                              )}>
                                {status.text}
                              </span>
                            </div>
                          );
                        })()}
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
                            {new Date(video.publish_date).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-sm",
                        isLight ? "text-gray-600" : "text-gray-400"
                      )}>
                        {new Date(video.created_at).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <a
                            href={getBilibiliUrl(video.bvid)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "text-sm font-medium hover:underline",
                              isLight ? "text-blue-600" : "text-blue-400"
                            )}
                          >
                            查看
                          </a>
                          <Link
                            to={`/admin/videos/edit/${video.id}`}
                            className={cn(
                              "text-sm font-medium hover:underline",
                              isLight ? "text-wangfeng-purple" : "text-wangfeng-purple"
                            )}
                          >
                            编辑
                          </Link>
                        </div>
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

export default VideoList;
