import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Calendar as CalendarIcon,
  MapPin,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { adminScheduleAPI, ScheduleItemResponse, ScheduleCategory } from '@/utils/api';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

type SortField = 'date' | 'created_at' | 'theme';
type SortOrder = 'asc' | 'desc';

const categoryOptions: Array<'all' | ScheduleCategory> = [
  'all',
  '演唱会',
  'livehouse',
  '音乐节',
  '商演拼盘',
  '综艺晚会',
  '直播',
  '商业活动',
  '其他'
];

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'published', label: '已发布' },
  { value: 'approved', label: '已审核' },
  { value: 'pending', label: '待审核' }
];

const ScheduleList = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [schedules, setSchedules] = useState<ScheduleItemResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // 筛选和排序状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ScheduleCategory>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const data = await adminScheduleAPI.getList({ limit: 100 });
      setSchedules(data);
    } catch (error) {
      console.error('加载行程失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取发布状态
  const getPublishStatus = (schedule: ScheduleItemResponse) => {
    if (schedule.is_published === 1) {
      return {
        text: '已发布',
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: isLight ? 'bg-green-50' : 'bg-green-500/10'
      };
    } else if (schedule.review_status === 'approved') {
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
  const filteredAndSortedSchedules = useMemo(() => {
    let result = [...schedules];

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        schedule =>
          schedule.theme.toLowerCase().includes(query) ||
          schedule.city.toLowerCase().includes(query) ||
          (schedule.venue && schedule.venue.toLowerCase().includes(query))
      );
    }

    // 分类过滤
    if (selectedCategory !== 'all') {
      result = result.filter(schedule => schedule.category === selectedCategory);
    }

    // 状态过滤
    if (selectedStatus !== 'all') {
      result = result.filter(schedule => {
        if (selectedStatus === 'published') return schedule.is_published === 1;
        if (selectedStatus === 'approved') return schedule.review_status === 'approved' && schedule.is_published !== 1;
        if (selectedStatus === 'pending') return schedule.review_status === 'pending';
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
          compareResult = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          break;
        case 'theme':
          compareResult = a.theme.localeCompare(b.theme, 'zh-CN');
          break;
      }

      return sortOrder === 'asc' ? compareResult : -compareResult;
    });

    return result;
  }, [schedules, searchQuery, selectedCategory, selectedStatus, sortField, sortOrder]);

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
            <CalendarIcon className="h-6 w-6 text-wangfeng-purple" />
            <h1 className={cn(
              "text-2xl font-bold",
              isLight ? "text-gray-900" : "text-white"
            )}>
              行程列表
            </h1>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              isLight
                ? "bg-gray-200 text-gray-700"
                : "bg-wangfeng-purple/20 text-wangfeng-purple"
            )}>
              {filteredAndSortedSchedules.length} 个
            </span>
          </div>

          <Link
            to="/admin/schedules/create"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            发布行程
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
                placeholder="搜索行程主题、城市或场馆..."
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
              onChange={(e) => setSelectedCategory(e.target.value as 'all' | ScheduleCategory)}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2",
                isLight
                  ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                  : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
              )}
            >
              {categoryOptions.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? '全部分类' : (category === 'livehouse' ? 'Livehouse' : category)}
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
          ) : filteredAndSortedSchedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <CalendarIcon className={cn(
                "h-12 w-12 mb-4",
                isLight ? "text-gray-300" : "text-gray-600"
              )} />
              <p className={cn(
                "text-sm",
                isLight ? "text-gray-500" : "text-gray-400"
              )}>
                {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' ? '未找到匹配的行程' : '暂无行程'}
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
                        onClick={() => toggleSort('theme')}
                        className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                      >
                        行程主题
                        <SortIcon field="theme" />
                      </button>
                    </th>
                    <th className={cn(
                      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                      isLight ? "text-gray-600" : "text-gray-400"
                    )}>
                      城市 / 场馆
                    </th>
                    <th className={cn(
                      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                      isLight ? "text-gray-600" : "text-gray-400"
                    )}>
                      <button
                        onClick={() => toggleSort('date')}
                        className="flex items-center gap-2 hover:text-wangfeng-purple transition-colors"
                      >
                        行程日期
                        <SortIcon field="date" />
                      </button>
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
                  {filteredAndSortedSchedules.map((schedule) => {
                    const status = getPublishStatus(schedule);
                    const StatusIcon = status.icon;

                    return (
                      <tr
                        key={schedule.id}
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
                              to={`/admin/schedules/edit/${schedule.id}`}
                              className={cn(
                                "font-medium hover:text-wangfeng-purple transition-colors line-clamp-1",
                                isLight ? "text-gray-900" : "text-white"
                              )}
                            >
                              {schedule.theme}
                            </Link>
                            {schedule.category && (
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded inline-block w-fit",
                                isLight
                                  ? "bg-wangfeng-purple/10 text-wangfeng-purple"
                                  : "bg-wangfeng-purple/20 text-wangfeng-purple"
                              )}>
                                {schedule.category === 'livehouse' ? 'Livehouse' : schedule.category}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <MapPin className={cn(
                                "h-3.5 w-3.5",
                                isLight ? "text-gray-400" : "text-gray-500"
                              )} />
                              <span className={cn(
                                "text-sm",
                                isLight ? "text-gray-900" : "text-gray-200"
                              )}>
                                {schedule.city}
                              </span>
                            </div>
                            {schedule.venue && (
                              <span className={cn(
                                "text-xs pl-5",
                                isLight ? "text-gray-500" : "text-gray-400"
                              )}>
                                {schedule.venue}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className={cn(
                              "h-4 w-4",
                              isLight ? "text-gray-400" : "text-gray-500"
                            )} />
                            <span className={cn(
                              "text-sm",
                              isLight ? "text-gray-700" : "text-gray-300"
                            )}>
                              {new Date(schedule.date).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                            status.bgColor
                          )}>
                            <StatusIcon className={cn("h-3.5 w-3.5", status.color)} />
                            <span className={cn("text-xs font-medium", status.color)}>
                              {status.text}
                            </span>
                          </div>
                        </td>
                        <td className={cn(
                          "px-6 py-4 text-sm",
                          isLight ? "text-gray-600" : "text-gray-400"
                        )}>
                          {schedule.created_at
                            ? new Date(schedule.created_at).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/admin/schedules/edit/${schedule.id}`}
                            className={cn(
                              "text-sm font-medium hover:underline",
                              isLight ? "text-wangfeng-purple" : "text-wangfeng-purple"
                            )}
                          >
                            编辑
                          </Link>
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
    </div>
  );
};

export default ScheduleList;
