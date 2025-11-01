import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  Video as VideoIcon,
  Eye,
  Calendar,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  User,
  AlertTriangle,
  Play
} from 'lucide-react';
import { videoAPI, Video } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

type SortField = 'publish_date' | 'title' | 'author';
type SortOrder = 'asc' | 'desc';
type ReviewFilter = 'all' | 'pending' | 'approved' | 'rejected';

const VIDEO_CATEGORIES = [
  { value: '演出现场', label: '演出现场' },
  { value: '单曲现场', label: '单曲现场' },
  { value: '综艺节目', label: '综艺节目' },
  { value: '歌曲mv', label: '歌曲mv' },
  { value: '访谈节目', label: '访谈节目' },
  { value: '纪录片', label: '纪录片' },
  { value: '其他', label: '其他' },
];

const AllVideoList = () => {
  const { theme } = useTheme();
  const { currentRole } = useAuth();
  const navigate = useNavigate();
  const isLight = theme === 'white';

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // 筛选和排序状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [sortField, setSortField] = useState<SortField>('publish_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 权限检查 - 只有管理员和超级管理员可以访问
  useEffect(() => {
    if (currentRole !== 'admin' && currentRole !== 'super_admin') {
      navigate('/admin/my-videos');
    }
  }, [currentRole, navigate]);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const data = await videoAPI.getAllVideos({ limit: 500 }, token);
      setVideos(data);
    } catch (error) {
      console.error('加载视频失败:', error);
    } finally {
      setLoading(false);
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
          video.author.toLowerCase().includes(query)
      );
    }

    // 分类过滤
    if (selectedCategory !== 'all') {
      result = result.filter(video => video.category === selectedCategory);
    }

    // 审核状态过滤
    if (reviewFilter !== 'all') {
      result = result.filter(video => video.review_status === reviewFilter);
    }

    // 排序
    result.sort((a, b) => {
      let compareResult = 0;

      switch (sortField) {
        case 'publish_date':
          compareResult = new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime();
          break;
        case 'title':
          compareResult = a.title.localeCompare(b.title, 'zh-CN');
          break;
        case 'author':
          compareResult = a.author.localeCompare(b.author, 'zh-CN');
          break;
      }

      return sortOrder === 'asc' ? compareResult : -compareResult;
    });

    return result;
  }, [videos, searchQuery, selectedCategory, reviewFilter, sortField, sortOrder]);

  // 统计数据
  const stats = useMemo(() => {
    return {
      total: videos.length,
      pending: videos.filter(v => v.review_status === 'pending').length,
      approved: videos.filter(v => v.review_status === 'approved').length,
      rejected: videos.filter(v => v.review_status === 'rejected').length,
    };
  }, [videos]);

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

  // 审核状态徽章
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'pending') {
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-500" />
          <span className={cn(
            "text-sm font-medium",
            isLight ? "text-yellow-700" : "text-yellow-400"
          )}>
            待审核
          </span>
        </div>
      );
    }
    if (status === 'approved') {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className={cn(
            "text-sm font-medium",
            isLight ? "text-green-700" : "text-green-400"
          )}>
            已发布
          </span>
        </div>
      );
    }
    if (status === 'rejected') {
      return (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className={cn(
            "text-sm font-medium",
            isLight ? "text-red-700" : "text-red-400"
          )}>
            已驳回
          </span>
        </div>
      );
    }
    return null;
  };

  // 处理审核跳转
  const handleReview = (video: Video) => {
    navigate(`/admin/videos/edit/${video.id}`, {
      state: { fromReview: true, backPath: '/admin/videos/all' }
    });
  };

  // 获取B站视频链接
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
          <div className="flex items-center gap-4">
            <VideoIcon className="h-6 w-6 text-wangfeng-purple" />
            <div>
              <h1 className={cn(
                "text-2xl font-bold",
                isLight ? "text-gray-900" : "text-white"
              )}>
                全部视频
              </h1>
              <p className={cn(
                "text-sm mt-0.5",
                isLight ? "text-gray-500" : "text-gray-400"
              )}>
                管理和审核所有用户提交的视频
              </p>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium",
              isLight ? "bg-gray-100 text-gray-700" : "bg-white/10 text-gray-300"
            )}>
              总计: {stats.total}
            </div>
            {stats.pending > 0 && (
              <div className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5",
                isLight ? "bg-yellow-100 text-yellow-700" : "bg-yellow-500/20 text-yellow-400"
              )}>
                <AlertTriangle className="h-3.5 w-3.5" />
                待审核: {stats.pending}
              </div>
            )}
          </div>
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
                placeholder="搜索视频标题或作者..."
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

          {/* 审核状态筛选 */}
          <div className="flex items-center gap-2">
            <Filter className={cn(
              "h-4 w-4",
              isLight ? "text-gray-600" : "text-gray-400"
            )} />
            <select
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value as ReviewFilter)}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2",
                isLight
                  ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                  : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
              )}
            >
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已发布</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>

          {/* 分类筛选 */}
          <div className="flex items-center gap-2">
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
              {VIDEO_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
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
                {searchQuery || selectedCategory !== 'all' || reviewFilter !== 'all'
                  ? '未找到匹配的视频'
                  : '暂无视频'}
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
                      <button
                        onClick={() => toggleSort('author')}
                        className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                      >
                        作者
                        <SortIcon field="author" />
                      </button>
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
                      B站ID
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
                          <button
                            onClick={() => handleReview(video)}
                            className={cn(
                              "font-medium hover:text-wangfeng-purple transition-colors line-clamp-1 text-left",
                              isLight ? "text-gray-900" : "text-white"
                            )}
                          >
                            {video.title}
                          </button>
                          {video.tags && video.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {video.tags.slice(0, 2).map((tag, index) => (
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className={cn(
                            "h-4 w-4",
                            isLight ? "text-gray-400" : "text-gray-500"
                          )} />
                          <span className={cn(
                            "text-sm",
                            isLight ? "text-gray-700" : "text-gray-300"
                          )}>
                            {video.author}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-sm",
                          isLight ? "text-wangfeng-purple" : "text-wangfeng-purple"
                        )}>
                          {video.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={video.review_status} />
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={getBilibiliUrl(video.bvid)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "text-sm flex items-center gap-1.5 hover:text-wangfeng-purple transition-colors",
                            isLight ? "text-gray-700" : "text-gray-300"
                          )}
                        >
                          <Play className="h-3.5 w-3.5" />
                          {video.bvid}
                        </a>
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
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleReview(video)}
                          className={cn(
                            "text-sm font-medium hover:underline",
                            video.review_status === 'pending'
                              ? "text-yellow-600 hover:text-yellow-700"
                              : "text-wangfeng-purple hover:text-wangfeng-purple/80"
                          )}
                        >
                          {video.review_status === 'pending' ? '审核' : '查看'}
                        </button>
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

export default AllVideoList;
