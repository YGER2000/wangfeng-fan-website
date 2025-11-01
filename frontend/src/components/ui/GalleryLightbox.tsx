import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface PhotoGroup {
  id: string;
  title: string;
  category: string;
  displayDate: string;
  images: string[];
}

interface GalleryLightboxProps {
  photoGroup: PhotoGroup | null;
  onClose: () => void;
}

const GalleryLightbox = ({ photoGroup, onClose }: GalleryLightboxProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // 重置图片索引当photoGroup改变时
  useEffect(() => {
    if (photoGroup) {
      setSelectedImageIndex(0);
    }
  }, [photoGroup]);

  // 键盘导航
  useEffect(() => {
    if (!photoGroup) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photoGroup, selectedImageIndex, onClose]);

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!photoGroup) return;

    const totalImages = photoGroup.images.length;
    let newIndex: number;

    if (direction === 'prev') {
      newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : totalImages - 1;
    } else {
      newIndex = selectedImageIndex < totalImages - 1 ? selectedImageIndex + 1 : 0;
    }

    setSelectedImageIndex(newIndex);
  };

  return (
    <AnimatePresence>
      {photoGroup && (
        <motion.div
          key="gallery-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4',
            isLight ? 'bg-white/95' : 'bg-black/95'
          )}
          onClick={onClose}
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className={cn(
              'absolute top-6 right-6 z-60 rounded-full p-3 transition-colors',
              isLight
                ? 'bg-white hover:bg-wangfeng-purple/80 text-gray-900 hover:text-white'
                : 'bg-black/40 hover:bg-wangfeng-purple/80 text-white'
            )}
          >
            <X className="w-6 h-6" />
          </button>

          {/* 导航按钮 */}
          {photoGroup.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage('prev');
                }}
                className={cn(
                  'absolute left-6 top-1/2 -translate-y-1/2 z-60 rounded-full p-3 transition-colors',
                  isLight
                    ? 'bg-white hover:bg-wangfeng-purple/80 text-gray-900 hover:text-white'
                    : 'bg-black/40 hover:bg-wangfeng-purple/80 text-white'
                )}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage('next');
                }}
                className={cn(
                  'absolute right-6 top-1/2 -translate-y-1/2 z-60 rounded-full p-3 transition-colors',
                  isLight
                    ? 'bg-white hover:bg-wangfeng-purple/80 text-gray-900 hover:text-white'
                    : 'bg-black/40 hover:bg-wangfeng-purple/80 text-white'
                )}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* 图片和信息 */}
          <motion.div
            key={`gallery-lightbox-${photoGroup.id}-${selectedImageIndex}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="max-w-6xl max-h-[90vh] flex flex-col lg:flex-row gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 大图显示 */}
            <div className="flex-1 flex items-center justify-center">
              <img
                src={photoGroup.images[selectedImageIndex]}
                alt={`${photoGroup.title} - ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/main.jpg';
                }}
              />
            </div>

            {/* 图片组信息 */}
            <div
              className={cn(
                'lg:w-80 rounded-xl border p-6',
                isLight
                  ? 'bg-white border-gray-200'
                  : 'bg-black/40 border-wangfeng-purple/30'
              )}
            >
              <h3
                className={cn(
                  'text-2xl font-bold mb-4',
                  isLight ? 'text-gray-900' : 'text-white'
                )}
              >
                {photoGroup.title}
              </h3>

              <div
                className={cn(
                  'space-y-4',
                  isLight ? 'text-gray-600' : 'text-gray-400'
                )}
              >
                <div>
                  <span className="text-wangfeng-purple font-semibold">分类：</span>
                  <span>{photoGroup.category}</span>
                </div>

                <div>
                  <span className="text-wangfeng-purple font-semibold">日期：</span>
                  <span>{photoGroup.displayDate}</span>
                </div>

                <div>
                  <span className="text-wangfeng-purple font-semibold">当前图片：</span>
                  <span>
                    {selectedImageIndex + 1} / {photoGroup.images.length}
                  </span>
                </div>
              </div>

              {/* 缩略图导航 */}
              {photoGroup.images.length > 1 && (
                <div className="mt-6">
                  <h4 className="text-sm text-wangfeng-purple font-semibold mb-3">
                    快速浏览
                  </h4>
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                    {photoGroup.images.map((imageSrc, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative aspect-square rounded overflow-hidden border-2 transition-colors ${
                          index === selectedImageIndex
                            ? 'border-wangfeng-purple'
                            : 'border-transparent hover:border-wangfeng-purple/50'
                        }`}
                      >
                        <img
                          src={imageSrc}
                          alt={`缩略图 ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/main.jpg';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 导航提示 */}
              <div
                className={cn(
                  'mt-6 pt-4 border-t',
                  isLight ? 'border-gray-200' : 'border-wangfeng-purple/30'
                )}
              >
                <p
                  className={cn(
                    'text-sm text-center',
                    isLight ? 'text-gray-500' : 'text-gray-500'
                  )}
                >
                  使用 ← → 键或点击箭头切换图片
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GalleryLightbox;
