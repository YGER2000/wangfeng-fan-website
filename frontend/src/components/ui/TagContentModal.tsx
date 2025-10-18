import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag as TagIcon, Video, Image as ImageIcon, FileText } from 'lucide-react';

export interface TagData {
  id: number;
  name: string;
}

export interface ContentItem {
  id: number;
  type: 'video' | 'article' | 'gallery';
  title: string;
  url: string;
  thumbnail?: string;
}

interface TagContentModalProps {
  tag: TagData | null;
  isOpen: boolean;
  onClose: () => void;
  onLoadContents: (tagId: number) => Promise<ContentItem[]>;
}

const TagContentModal = ({ tag, isOpen, onClose, onLoadContents }: TagContentModalProps) => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tag) {
      loadContents();
    } else {
      setContents([]);
      setError(null);
    }
  }, [isOpen, tag]);

  const loadContents = async () => {
    if (!tag) return;

    setLoading(true);
    setError(null);
    try {
      const data = await onLoadContents(tag.id);
      setContents(data);
    } catch (err) {
      console.error('加载标签内容失败:', err);
      setError('加载内容失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'gallery':
        return <ImageIcon className="h-5 w-5" />;
      case 'article':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'video':
        return '视频';
      case 'gallery':
        return '图片';
      case 'article':
        return '文章';
      default:
        return '内容';
    }
  };

  const groupedContents = contents.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  return (
    <AnimatePresence>
      {isOpen && tag && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* 弹窗内容 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-4xl bg-black/95 border border-wangfeng-purple/40 rounded-2xl shadow-2xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className="flex items-center justify-between p-6 border-b border-wangfeng-purple/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wangfeng-purple/20">
                    <TagIcon className="h-5 w-5 text-wangfeng-purple" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{tag.name}</h2>
                    <p className="text-sm text-wangfeng-purple/70">
                      共 {contents.length} 项相关内容
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-wangfeng-purple/40 text-wangfeng-purple transition-colors hover:bg-wangfeng-purple/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 内容区域 */}
              <div className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-wangfeng-purple border-t-transparent" />
                  </div>
                ) : error ? (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-6 text-center text-red-300">
                    {error}
                  </div>
                ) : contents.length === 0 ? (
                  <div className="rounded-lg border border-wangfeng-purple/20 bg-wangfeng-purple/5 p-12 text-center">
                    <TagIcon className="mx-auto h-12 w-12 text-wangfeng-purple/40 mb-4" />
                    <p className="text-wangfeng-purple/70">暂无相关内容</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedContents).map(([type, items]) => (
                      <div key={type}>
                        <div className="flex items-center gap-2 mb-3">
                          {getTypeIcon(type)}
                          <h3 className="text-lg font-semibold text-white">
                            {getTypeName(type)} ({items.length})
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {items.map((item) => (
                            <a
                              key={item.id}
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex gap-3 rounded-lg border border-wangfeng-purple/20 bg-black/40 p-4 transition-all hover:border-wangfeng-purple/60 hover:bg-wangfeng-purple/10"
                            >
                              {item.thumbnail && (
                                <div className="flex-shrink-0 w-24 h-16 rounded overflow-hidden bg-black/60">
                                  <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium line-clamp-2 group-hover:text-wangfeng-purple transition-colors">
                                  {item.title}
                                </p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TagContentModal;
