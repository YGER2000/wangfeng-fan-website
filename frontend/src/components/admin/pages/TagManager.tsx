import { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Tag as TagIcon,
  Trash2,
  Edit,
  Music,
  Disc
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface Tag {
  id: number;
  name: string;
  created_at: string;
}

const TagManager = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'album' | 'song'>('all');
  
  // 新增标签相关状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await fetch('http://localhost:1994/api/tags');
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error('加载标签失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 筛选标签
  const filteredTags = useMemo(() => {
    let result = [...tags];

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tag => tag.name.toLowerCase().includes(query));
    }

    // 类型过滤
    if (filterType === 'album') {
      result = result.filter(tag => tag.name.startsWith('专辑：'));
    } else if (filterType === 'song') {
      result = result.filter(tag => tag.name.startsWith('单曲：'));
    }

    return result;
  }, [tags, searchQuery, filterType]);

  // 统计数据
  const stats = useMemo(() => {
    const total = tags.length;
    const albums = tags.filter(tag => tag.name.startsWith('专辑：')).length;
    const songs = tags.filter(tag => tag.name.startsWith('单曲：')).length;
    const others = total - albums - songs;
    
    return { total, albums, songs, others };
  }, [tags]);

  // 删除标签
  const handleDelete = async (tagId: number, tagName: string) => {
    if (!window.confirm(`确定要删除标签"${tagName}"吗？`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:1994/api/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTags(tags.filter(tag => tag.id !== tagId));
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除标签失败:', error);
      alert('删除失败');
    }
  };

  // 添加标签
  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      alert('请输入标签名称');
      return;
    }

    setAddingTag(true);
    try {
      const response = await fetch('http://localhost:1994/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTagName }),
      });

      if (response.ok) {
        const newTag = await response.json();
        setTags([...tags, newTag]);
        setNewTagName('');
        setShowAddModal(false);
      } else {
        alert('添加失败');
      }
    } catch (error) {
      console.error('添加标签失败:', error);
      alert('添加失败');
    } finally {
      setAddingTag(false);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={cn(
      "h-full flex flex-col",
      isLight ? "bg-gray-50" : "bg-black"
    )}>
      {/* 顶部标题栏 */}
      <div className={cn(
        "flex-shrink-0 border-b px-6 py-4",
        isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TagIcon className="h-6 w-6 text-wangfeng-purple" />
            <div>
              <h1 className={cn("text-xl font-bold", isLight ? "text-gray-900" : "text-white")}>
                标签管理
              </h1>
              <p className={cn("text-sm mt-0.5", isLight ? "text-gray-500" : "text-gray-400")}>
                管理所有内容标签
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            新增标签
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className={cn(
            "rounded-lg p-4 border",
            isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
          )}>
            <div className={cn("text-sm", isLight ? "text-gray-600" : "text-gray-400")}>
              总标签数
            </div>
            <div className={cn("text-2xl font-bold mt-1", isLight ? "text-gray-900" : "text-white")}>
              {stats.total}
            </div>
          </div>

          <div className={cn(
            "rounded-lg p-4 border",
            isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
          )}>
            <div className={cn("text-sm flex items-center gap-1", isLight ? "text-gray-600" : "text-gray-400")}>
              <Disc className="h-4 w-4" />
              专辑标签
            </div>
            <div className={cn("text-2xl font-bold mt-1", isLight ? "text-gray-900" : "text-white")}>
              {stats.albums}
            </div>
          </div>

          <div className={cn(
            "rounded-lg p-4 border",
            isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
          )}>
            <div className={cn("text-sm flex items-center gap-1", isLight ? "text-gray-600" : "text-gray-400")}>
              <Music className="h-4 w-4" />
              单曲标签
            </div>
            <div className={cn("text-2xl font-bold mt-1", isLight ? "text-gray-900" : "text-white")}>
              {stats.songs}
            </div>
          </div>

          <div className={cn(
            "rounded-lg p-4 border",
            isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
          )}>
            <div className={cn("text-sm", isLight ? "text-gray-600" : "text-gray-400")}>
              其他标签
            </div>
            <div className={cn("text-2xl font-bold mt-1", isLight ? "text-gray-900" : "text-white")}>
              {stats.others}
            </div>
          </div>
        </div>
      </div>

      {/* 筛选工具栏 */}
      <div className={cn(
        "flex-shrink-0 border-b px-6 py-4",
        isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
      )}>
        <div className="flex items-center gap-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
              isLight ? "text-gray-400" : "text-gray-500"
            )} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索标签..."
              className={cn(
                "w-full pl-10 pr-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2",
                isLight
                  ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                  : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
              )}
            />
          </div>

          {/* 类型筛选 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filterType === 'all'
                  ? "bg-wangfeng-purple text-white"
                  : isLight
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-black/50 text-gray-400 hover:bg-wangfeng-purple/10"
              )}
            >
              全部
            </button>
            <button
              onClick={() => setFilterType('album')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1",
                filterType === 'album'
                  ? "bg-wangfeng-purple text-white"
                  : isLight
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-black/50 text-gray-400 hover:bg-wangfeng-purple/10"
              )}
            >
              <Disc className="h-4 w-4" />
              专辑
            </button>
            <button
              onClick={() => setFilterType('song')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1",
                filterType === 'song'
                  ? "bg-wangfeng-purple text-white"
                  : isLight
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-black/50 text-gray-400 hover:bg-wangfeng-purple/10"
              )}
            >
              <Music className="h-4 w-4" />
              单曲
            </button>
          </div>
        </div>
      </div>

      {/* 标签列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple mx-auto mb-4"></div>
              <p className={cn("text-sm", isLight ? "text-gray-600" : "text-gray-400")}>
                加载中...
              </p>
            </div>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <TagIcon className={cn(
                "h-12 w-12 mx-auto mb-4",
                isLight ? "text-gray-400" : "text-gray-600"
              )} />
              <p className={cn("text-sm", isLight ? "text-gray-600" : "text-gray-400")}>
                暂无标签
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                className={cn(
                  "rounded-lg border p-4 transition-all duration-200 hover:shadow-lg group",
                  isLight
                    ? "bg-white border-gray-200 hover:border-wangfeng-purple"
                    : "bg-black/40 border-wangfeng-purple/20 hover:border-wangfeng-purple"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {tag.name.startsWith('专辑：') ? (
                        <Disc className="h-4 w-4 text-wangfeng-purple flex-shrink-0" />
                      ) : tag.name.startsWith('单曲：') ? (
                        <Music className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      ) : (
                        <TagIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      )}
                      <h3 className={cn(
                        "font-medium text-sm truncate",
                        isLight ? "text-gray-900" : "text-white"
                      )}>
                        {tag.name}
                      </h3>
                    </div>
                    <p className={cn(
                      "text-xs",
                      isLight ? "text-gray-500" : "text-gray-400"
                    )}>
                      ID: {tag.id}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(tag.id, tag.name)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100",
                      isLight
                        ? "hover:bg-red-50 text-red-600"
                        : "hover:bg-red-500/10 text-red-400"
                    )}
                    title="删除标签"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新增标签模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={cn(
            "rounded-lg shadow-xl max-w-md w-full p-6",
            isLight ? "bg-white" : "bg-gray-900"
          )}>
            <h2 className={cn("text-lg font-bold mb-4", isLight ? "text-gray-900" : "text-white")}>
              新增标签
            </h2>

            <div className="mb-4">
              <label className={cn(
                "block text-sm font-medium mb-2",
                isLight ? "text-gray-700" : "text-gray-300"
              )}>
                标签名称
              </label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder='例如：专辑：《鲍家街43号》 或 单曲：《飞得更高》'
                className={cn(
                  "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                  isLight
                    ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                    : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                )}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !addingTag) {
                    handleAddTag();
                  }
                }}
              />
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewTagName('');
                }}
                disabled={addingTag}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isLight
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                )}
              >
                取消
              </button>
              <button
                onClick={handleAddTag}
                disabled={addingTag || !newTagName.trim()}
                className="px-4 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingTag ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagManager;
