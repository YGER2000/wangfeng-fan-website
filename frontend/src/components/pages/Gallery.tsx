import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Camera, Images, Shuffle, ArrowDownUp, Sparkles } from 'lucide-react';

// API PhotoGroup 类型
interface APIPhotoGroup {
  id: string;
  title: string;
  category: string;
  date: string;
  display_date: string;
  year: string;
  description: string | null;
  cover_image_url: string;
  cover_image_thumb_url: string;
  storage_type: string;
  is_published: boolean;
}

// API Photo 类型
interface APIPhoto {
  id: string;
  photo_group_id: string;
  image_url: string;
  image_medium_url: string;
  image_thumb_url: string;
  original_filename: string;
  file_size: number;
  width: number | null;
  height: number | null;
  sort_order: number;
}

// 前端使用的 PhotoGroup 类型
interface PhotoGroup {
  id: string;
  title: string;
  date: string;
  category: string;
  coverImage: string;
  images: string[];
  year: string;
  displayDate: string;
}

// 提取所有图片，并标记所属的照片组
interface FlattenedPhoto {
  src: string;
  photoGroup: PhotoGroup;
  indexInGroup: number;
}

// Fisher-Yates 洗牌算法
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [selectedPhotoGroup, setSelectedPhotoGroup] = useState<PhotoGroup | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 从API获取的照片组数据
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(['全部']);

  // 从API获取照片组数据
  useEffect(() => {
    const fetchPhotoGroups = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:1994/api/gallery/groups');
        const data: APIPhotoGroup[] = await response.json();

        // 只保留云端存储的照片组（过滤掉 legacy 类型）
        const ossOnlyGroups = data.filter(apiGroup => apiGroup.storage_type !== 'legacy');

        // 转换API数据为前端格式
        const transformedGroups: PhotoGroup[] = await Promise.all(
          ossOnlyGroups.map(async (apiGroup) => {
            try {
              // 获取照片组的照片
              const photosResponse = await fetch(`http://localhost:1994/api/gallery/groups/${apiGroup.id}`);
              const groupDetail: APIPhotoGroup & { photos: APIPhoto[] } = await photosResponse.json();

              return {
                id: apiGroup.id,
                title: apiGroup.title,
                date: apiGroup.date,
                category: apiGroup.category,
                coverImage: apiGroup.cover_image_url,
                images: (groupDetail.photos || [])
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(photo => photo.image_url),
                year: apiGroup.year,
                displayDate: apiGroup.display_date
              };
            } catch (error) {
              console.error(`获取照片组 ${apiGroup.id} 详情失败:`, error);
              // 返回只有封面图的照片组
              return {
                id: apiGroup.id,
                title: apiGroup.title,
                date: apiGroup.date,
                category: apiGroup.category,
                coverImage: apiGroup.cover_image_url,
                images: apiGroup.cover_image_url ? [apiGroup.cover_image_url] : [],
                year: apiGroup.year,
                displayDate: apiGroup.display_date
              };
            }
          })
        );

        console.log('获取到的照片组:', transformedGroups.length);
        console.log('照片组详情:', transformedGroups.map(g => ({ title: g.title, images: g.images.length })));

        setPhotoGroups(transformedGroups);

        // 提取所有分类（只从云端存储的照片组中提取）
        const uniqueCategories = ['全部', ...Array.from(new Set(ossOnlyGroups.map(g => g.category)))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('获取照片组失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotoGroups();
  }, []);

  // 获取筛选后的照片组，避免每次渲染都重新创建引用
  const filteredPhotoGroups = useMemo(() => {
    return selectedCategory === '全部'
      ? photoGroups
      : photoGroups.filter(group => group.category === selectedCategory);
  }, [photoGroups, selectedCategory]);

  // 将所有照片展平成一个数组
  const basePhotos: FlattenedPhoto[] = useMemo(() => {
    return filteredPhotoGroups.flatMap(photoGroup =>
      photoGroup.images.map((src, index) => ({
        src,
        photoGroup,
        indexInGroup: index
      }))
    );
  }, [filteredPhotoGroups]);

  // 使用状态来存储当前的照片顺序
  const [allPhotos, setAllPhotos] = useState<FlattenedPhoto[]>(basePhotos);

  // 当分类或者后端数据变更时，重置照片顺序
  useEffect(() => {
    setAllPhotos(basePhotos);
  }, [basePhotos]);

  // 随机打乱照片顺序
  const handleShuffle = () => {
    setAllPhotos(shuffleArray(allPhotos));
  };

  // 恢复原始顺序
  const handleRestore = () => {
    setAllPhotos(basePhotos);
  };

  // 点击图片打开灯箱
  const openLightbox = (photo: FlattenedPhoto) => {
    setSelectedPhotoGroup(photo.photoGroup);
    setSelectedImageIndex(photo.indexInGroup);
  };

  const closeLightbox = () => {
    setSelectedPhotoGroup(null);
    setSelectedImageIndex(0);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedPhotoGroup) return;

    const totalImages = selectedPhotoGroup.images.length;
    let newIndex: number;

    if (direction === 'prev') {
      newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : totalImages - 1;
    } else {
      newIndex = selectedImageIndex < totalImages - 1 ? selectedImageIndex + 1 : 0;
    }

    setSelectedImageIndex(newIndex);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple mx-auto mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white py-20">
      <div className="container mx-auto px-4">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="relative inline-block">
            <motion.h1
              className="text-5xl md:text-7xl font-bebas tracking-wider theme-text-primary mb-4 relative z-10"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              图片 <span className="text-wangfeng-purple">画廊</span>
            </motion.h1>
            <motion.div
              className="absolute -top-4 -right-4 text-wangfeng-purple/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-12 h-12 md:w-16 md:h-16" />
            </motion.div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple">
            Photo Gallery of Wang Feng
          </h2>
        </motion.div>

        {/* 分类筛选和控制按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center gap-4 mb-12 flex-wrap"
        >
          {/* 随机按钮 */}
          <button
            onClick={handleShuffle}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-wangfeng-purple to-pink-600 theme-text-primary shadow-glow hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold"
          >
            <Shuffle className="w-4 h-4" />
            <span>随机</span>
          </button>

          {/* 顺序按钮 */}
          <button
            onClick={handleRestore}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 theme-text-primary shadow-glow hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold"
          >
            <ArrowDownUp className="w-4 h-4" />
            <span>顺序</span>
          </button>

          {/* 分类按钮 */}
          {categories.map((category) => (
            <button
              key={`category-${category}`}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-wangfeng-purple theme-text-primary shadow-glow animate-pulse-glow'
                  : 'bg-transparent border theme-border-primary theme-text-secondary hover:border-wangfeng-purple hover:text-wangfeng-purple'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* 瀑布流图片展示 - 增大展示空间 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative"
        >
          <div
            ref={scrollContainerRef}
            className="h-[calc(100vh-200px)] overflow-y-auto scroll-smooth"
            style={{
              scrollBehavior: 'smooth',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(139, 92, 246, 0.5) transparent'
            }}
          >
            {/* CSS Grid 瀑布流布局 */}
            <div className="masonry-grid gap-3">
              {allPhotos.map((photo, index) => (
                <motion.div
                  key={`photo-${photo.photoGroup.id}-${photo.indexInGroup}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: (index % 20) * 0.05 }}
                  className="masonry-item group cursor-pointer relative overflow-hidden rounded-lg"
                  onClick={() => openLightbox(photo)}
                >
                  <img
                    src={photo.src}
                    alt={`${photo.photoGroup.title} - ${photo.indexInGroup + 1}`}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/main.jpg';
                    }}
                  />

                  {/* 悬停信息覆盖层 */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
                    <Camera className="w-6 h-6 mb-2 text-wangfeng-purple" />
                    <h4 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                      {photo.photoGroup.title}
                    </h4>
                    <p className="text-gray-300 text-xs flex items-center gap-1">
                      <Images className="w-3 h-3" />
                      {photo.photoGroup.images.length} 张
                    </p>
                  </div>

                  {/* 角标：第一张显示照片组信息 */}
                  {photo.indexInGroup === 0 && (
                    <div className="absolute top-2 left-2 bg-wangfeng-purple backdrop-blur-sm rounded-full px-2 py-1 z-10">
                      <span className="text-white text-xs font-medium flex items-center gap-1">
                        <Images className="w-3 h-3" />
                        {photo.photoGroup.images.length}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* 渐变遮罩（上下） */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/50 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
        </motion.div>

        {/* 图片统计 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-8"
        >
          <div className="theme-bg-card rounded-xl border theme-border-primary shadow-glow p-4 max-w-md mx-auto">
            <p className="theme-text-secondary">
              共展示 <span className="text-wangfeng-purple font-bold">{allPhotos.length}</span> 张照片
              来自 <span className="text-wangfeng-purple font-bold">{filteredPhotoGroups.length}</span> 个照片组
            </p>
          </div>
        </motion.div>
      </div>

      {/* 照片灯箱（lightbox） */}
      <AnimatePresence>
        {selectedPhotoGroup && (
          <motion.div
            key="gallery-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 theme-bg-card backdrop-blur-md flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            {/* 关闭按钮 */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 z-60 theme-bg-card hover:bg-wangfeng-purple/80 rounded-full p-3 transition-colors"
            >
              <X className="w-6 h-6 theme-text-primary" />
            </button>

            {/* 导航按钮 */}
            {selectedPhotoGroup.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('prev');
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 z-60 theme-bg-card hover:bg-wangfeng-purple/80 rounded-full p-3 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 theme-text-primary" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('next');
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-60 theme-bg-card hover:bg-wangfeng-purple/80 rounded-full p-3 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 theme-text-primary" />
                </button>
              </>
            )}

            {/* 图片和信息 */}
            <motion.div
              key={`gallery-lightbox-${selectedPhotoGroup.id}-${selectedImageIndex}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-6xl max-h-[90vh] flex flex-col lg:flex-row gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 大图显示 */}
              <div className="flex-1 flex items-center justify-center">
                <img
                  src={selectedPhotoGroup.images[selectedImageIndex]}
                  alt={`${selectedPhotoGroup.title} - ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/main.jpg';
                  }}
                />
              </div>

              {/* 图片组信息 */}
              <div className="lg:w-80 theme-bg-card rounded-xl border theme-border-primary p-6">
                <h3 className="text-2xl font-bold theme-text-primary mb-4">{selectedPhotoGroup.title}</h3>

                <div className="space-y-4 theme-text-secondary">
                  <div>
                    <span className="text-wangfeng-purple font-semibold">分类：</span>
                    <span>{selectedPhotoGroup.category}</span>
                  </div>

                  <div>
                    <span className="text-wangfeng-purple font-semibold">日期：</span>
                    <span>{selectedPhotoGroup.displayDate}</span>
                  </div>

                  <div>
                    <span className="text-wangfeng-purple font-semibold">当前图片：</span>
                    <span>{selectedImageIndex + 1} / {selectedPhotoGroup.images.length}</span>
                  </div>
                </div>

                {/* 缩略图导航 */}
                {selectedPhotoGroup.images.length > 1 && (
                  <div className="mt-6">
                    <h4 className="text-sm text-wangfeng-purple font-semibold mb-3">快速浏览</h4>
                    <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                      {selectedPhotoGroup.images.map((imageSrc, index) => (
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
                <div className="mt-6 pt-4 border-t theme-border-primary">
                  <p className="text-sm theme-text-muted text-center">
                    使用 ← → 键或点击箭头切换图片
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS 瀑布流布局样式 */}
      <style>{`
        /* 瀑布流布局 - CSS Grid 实现 */
        .masonry-grid {
          column-count: 5;
          column-gap: 12px;
        }

        @media (max-width: 1536px) {
          .masonry-grid {
            column-count: 4;
          }
        }

        @media (max-width: 1280px) {
          .masonry-grid {
            column-count: 3;
          }
        }

        @media (max-width: 768px) {
          .masonry-grid {
            column-count: 2;
          }
        }

        @media (max-width: 480px) {
          .masonry-grid {
            column-count: 1;
          }
        }

        .masonry-item {
          break-inside: avoid;
          margin-bottom: 12px;
          display: inline-block;
          width: 100%;
        }

        /* 自定义滚动条样式 */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 4px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

export default Gallery;
