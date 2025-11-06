import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Video, Image, Calendar, User, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '@/config/api';

interface TagContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagName: string;
}

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_url: string | null;
  author: string;
  category_primary: string;
  category_secondary: string | null;
  created_at: string;
  view_count: number;
}

interface VideoItem {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  video_url: string;
  author: string;
  category: string;
  created_at: string;
  view_count: number;
}

interface GalleryItem {
  id: string;
  name?: string;
  title?: string;
  description: string;
  cover_image_url: string | null;
  cover_image_thumb_url: string | null;
  category: string;
  created_at: string;
  photo_count: number;
}

interface ScheduleItem {
  id: number | string;
  theme: string;
  date: string;
  city: string;
  venue?: string | null;
  category: string;
  image?: string | null;
  image_thumb?: string | null;
  description?: string | null;
  created_at?: string | null;
}

interface TagContents {
  tag_name: string;
  articles: ArticleItem[];
  videos: VideoItem[];
  galleries: GalleryItem[];
  schedules: ScheduleItem[];
}

const TagContentModal = ({ isOpen, onClose, tagName }: TagContentModalProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const navigate = useNavigate();
  const [contents, setContents] = useState<TagContents | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'articles' | 'videos' | 'galleries' | 'schedules'>('articles');

  useEffect(() => {
    if (isOpen && tagName) {
      loadContents();
    }
  }, [isOpen, tagName]);

  const loadContents = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/tags/by-name/${encodeURIComponent(tagName)}/contents`));
      const data = await response.json();
      const normalizedData: TagContents = {
        tag_name: data.tag_name,
        articles: data.articles || [],
        videos: data.videos || [],
        galleries: data.galleries || [],
        schedules: data.schedules || []
      };
      setContents(normalizedData);

      // 自动切换到有内容的标签页
      if (normalizedData.articles.length > 0) {
        setActiveTab('articles');
      } else if (normalizedData.videos.length > 0) {
        setActiveTab('videos');
      } else if (normalizedData.galleries.length > 0) {
        setActiveTab('galleries');
      } else if (normalizedData.schedules.length > 0) {
        setActiveTab('schedules');
      }
    } catch (error) {
      console.error('加载标签内容失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (type: 'article' | 'video' | 'gallery' | 'schedule', item: any) => {
    onClose();
    if (type === 'article') {
      navigate(`/article/${item.slug || item.id}`);
    } else if (type === 'video') {
      navigate(`/videos`);
    } else if (type === 'gallery') {
      navigate(`/gallery`);
    } else if (type === 'schedule') {
      navigate('/tour-dates', { state: { focusScheduleId: item.id } });
    }
  };

  const stripHtml = (html: string | undefined): string => {
    if (!html) return '暂无描述';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '暂无描述';
  };

  const totalCount =
    (contents?.articles.length || 0) +
    (contents?.videos.length || 0) +
    (contents?.galleries.length || 0) +
    (contents?.schedules.length || 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* 模态框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "relative z-10 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden",
              isLight ? "bg-white" : "bg-gray-900 border border-gray-800"
            )}
          >
            {/* 头部 */}
            <div className={cn(
              "flex items-center justify-between p-6 border-b",
              isLight ? "bg-gray-50 border-gray-200" : "bg-gray-800/50 border-gray-700"
            )}>
              <div>
                <h2 className={cn(
                  "text-2xl font-bold flex items-center gap-2",
                  isLight ? "text-gray-900" : "text-white"
                )}>
                  <span className="text-wangfeng-purple">#</span>
                  {tagName}
                </h2>
                <p className={cn(
                  "text-sm mt-1",
                  isLight ? "text-gray-600" : "text-gray-400"
                )}>
                  共找到 {totalCount} 条相关内容
                </p>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isLight
                    ? "hover:bg-gray-200 text-gray-600"
                    : "hover:bg-gray-700 text-gray-400"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 标签页 */}
            <div className={cn(
              "flex border-b",
              isLight ? "bg-white border-gray-200" : "bg-gray-900 border-gray-700"
            )}>
              <button
                onClick={() => setActiveTab('articles')}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors relative",
                  activeTab === 'articles'
                    ? "text-wangfeng-purple"
                    : isLight
                      ? "text-gray-600 hover:text-gray-900"
                      : "text-gray-400 hover:text-white"
                )}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                文章 ({contents?.articles.length || 0})
                {activeTab === 'articles' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-wangfeng-purple"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('videos')}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors relative",
                  activeTab === 'videos'
                    ? "text-wangfeng-purple"
                    : isLight
                      ? "text-gray-600 hover:text-gray-900"
                      : "text-gray-400 hover:text-white"
                )}
              >
                <Video className="w-4 h-4 inline mr-2" />
                视频 ({contents?.videos.length || 0})
                {activeTab === 'videos' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-wangfeng-purple"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('schedules')}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors relative",
                  activeTab === 'schedules'
                    ? "text-wangfeng-purple"
                    : isLight
                      ? "text-gray-600 hover:text-gray-900"
                      : "text-gray-400 hover:text-white"
                )}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                行程 ({contents?.schedules.length || 0})
                {activeTab === 'schedules' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-wangfeng-purple"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('galleries')}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors relative",
                  activeTab === 'galleries'
                    ? "text-wangfeng-purple"
                    : isLight
                      ? "text-gray-600 hover:text-gray-900"
                      : "text-gray-400 hover:text-white"
                )}
              >
                <Image className="w-4 h-4 inline mr-2" />
                相册 ({contents?.galleries.length || 0})
                {activeTab === 'galleries' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-wangfeng-purple"
                  />
                )}
              </button>
            </div>

            {/* 内容区域 */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(85vh - 180px)' }}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className={cn(
                    "text-lg",
                    isLight ? "text-gray-600" : "text-gray-400"
                  )}>
                    加载中...
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {/* 文章列表 */}
                  {activeTab === 'articles' && (
                    <motion.div
                      key="articles"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {contents?.articles && contents.articles.length > 0 ? (
                        contents.articles.map((article) => (
                          <div
                            key={article.id}
                            onClick={() => handleItemClick('article', article)}
                            className={cn(
                              "p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02]",
                              isLight
                                ? "bg-white border-gray-200 hover:border-wangfeng-purple/50 hover:shadow-md"
                                : "bg-gray-800/50 border-gray-700 hover:border-wangfeng-purple/50"
                            )}
                          >
                            <h3 className={cn(
                              "text-lg font-semibold mb-2",
                              isLight ? "text-gray-900" : "text-white"
                            )}>
                              {article.title}
                            </h3>
                            <p className={cn(
                              "text-sm mb-3 line-clamp-2",
                              isLight ? "text-gray-600" : "text-gray-400"
                            )}>
                              {stripHtml(article.excerpt)}
                            </p>
                            <div className={cn(
                              "flex items-center gap-4 text-xs",
                              isLight ? "text-gray-500" : "text-gray-500"
                            )}>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {article.author}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(article.created_at).toLocaleDateString('zh-CN')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {article.view_count}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={cn(
                          "text-center py-12",
                          isLight ? "text-gray-500" : "text-gray-400"
                        )}>
                          暂无文章
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* 视频列表 */}
                  {activeTab === 'videos' && (
                    <motion.div
                      key="videos"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {contents?.videos && contents.videos.length > 0 ? (
                        contents.videos.map((video) => (
                          <div
                            key={video.id}
                            onClick={() => handleItemClick('video', video)}
                            className={cn(
                              "p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02]",
                              isLight
                                ? "bg-white border-gray-200 hover:border-wangfeng-purple/50 hover:shadow-md"
                                : "bg-gray-800/50 border-gray-700 hover:border-wangfeng-purple/50"
                            )}
                          >
                            <h3 className={cn(
                              "text-lg font-semibold mb-2",
                              isLight ? "text-gray-900" : "text-white"
                            )}>
                              {video.title}
                            </h3>
                            <p className={cn(
                              "text-sm mb-3 line-clamp-2",
                              isLight ? "text-gray-600" : "text-gray-400"
                            )}>
                              {stripHtml(video.description)}
                            </p>
                            <div className={cn(
                              "flex items-center gap-4 text-xs",
                              isLight ? "text-gray-500" : "text-gray-500"
                            )}>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {video.author}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(video.created_at).toLocaleDateString('zh-CN')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {video.view_count}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={cn(
                          "text-center py-12",
                          isLight ? "text-gray-500" : "text-gray-400"
                        )}>
                          暂无视频
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* 相册列表 */}
                  {activeTab === 'galleries' && (
                    <motion.div
                      key="galleries"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {contents?.galleries && contents.galleries.length > 0 ? (
                        contents.galleries.map((gallery) => (
                          <div
                            key={gallery.id}
                            onClick={() => handleItemClick('gallery', gallery)}
                            className={cn(
                              "p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02]",
                              isLight
                                ? "bg-white border-gray-200 hover:border-wangfeng-purple/50 hover:shadow-md"
                                : "bg-gray-800/50 border-gray-700 hover:border-wangfeng-purple/50"
                            )}
                          >
                            <h3 className={cn(
                              "text-lg font-semibold mb-2",
                              isLight ? "text-gray-900" : "text-white"
                            )}>
                              {gallery.title || gallery.name || '未命名相册'}
                            </h3>
                            <p className={cn(
                              "text-sm mb-3 line-clamp-2",
                              isLight ? "text-gray-600" : "text-gray-400"
                            )}>
                              {stripHtml(gallery.description)}
                            </p>
                            <div className={cn(
                              "flex items-center gap-4 text-xs",
                              isLight ? "text-gray-500" : "text-gray-500"
                            )}>
                              <span className="flex items-center gap-1">
                                <Image className="w-3 h-3" />
                                {gallery.photo_count} 张照片
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(gallery.created_at).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={cn(
                          "text-center py-12",
                          isLight ? "text-gray-500" : "text-gray-400"
                        )}>
                          暂无相册
                        </div>
                      )}
                    </motion.div>
                  )}
                  {/* 行程列表 */}
                  {activeTab === 'schedules' && (
                    <motion.div
                      key="schedules"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {contents?.schedules && contents.schedules.length > 0 ? (
                        contents.schedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            onClick={() => handleItemClick('schedule', schedule)}
                            className={cn(
                              "p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02]",
                              isLight
                                ? "bg-white border-gray-200 hover:border-wangfeng-purple/50 hover:shadow-md"
                                : "bg-gray-800/50 border-gray-700 hover:border-wangfeng-purple/50"
                            )}
                          >
                            <h3 className={cn(
                              "text-lg font-semibold mb-2",
                              isLight ? "text-gray-900" : "text-white"
                            )}>
                              {schedule.theme}
                            </h3>
                            <p className={cn(
                              "text-sm mb-3",
                              isLight ? "text-gray-600" : "text-gray-400"
                            )}>
                              {schedule.city} · {schedule.venue || '地点待定'}
                            </p>
                            <div className={cn(
                              "flex flex-wrap items-center gap-4 text-xs",
                              isLight ? "text-gray-500" : "text-gray-500"
                            )}>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {schedule.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Image className="w-3 h-3" />
                                {schedule.category}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={cn(
                          "text-center py-12",
                          isLight ? "text-gray-500" : "text-gray-400"
                        )}>
                          暂无行程
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TagContentModal;
