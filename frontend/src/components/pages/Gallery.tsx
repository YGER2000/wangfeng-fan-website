import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Camera, Images, Clock, MapPin, Loader2 } from 'lucide-react';
import { withBasePath } from '@/lib/utils';
import { photoGroups, categories, getPhotoGroupsByCategory, getCategoryDisplayName, type PhotoGroup } from '@/utils/galleryUtils';

// 懒加载图片组件
const LazyImage = ({ src, alt, className, onClick, children }: {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden theme-bg-card ${className}`}
      onClick={onClick}
    >
      {/* 加载占位符 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center theme-bg-card">
          <Loader2 className="w-8 h-8 text-wangfeng-purple animate-spin" />
        </div>
      )}
      
      {/* 只有在视口内时才加载图片 */}
      {isInView && (
        <img
          src={hasError ? withBasePath('images/main.jpg') : src}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } group-hover/img:scale-110`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {children}
    </div>
  );
};

const Gallery = () => {
  const [selectedPhotoGroup, setSelectedPhotoGroup] = useState<PhotoGroup | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');

  const filteredPhotoGroups = getPhotoGroupsByCategory(selectedCategory);

  const openPhotoGroupModal = (photoGroup: PhotoGroup, imageIndex: number = 0) => {
    setSelectedPhotoGroup(photoGroup);
    setSelectedImageIndex(imageIndex);
  };

  const closeModal = () => {
    setSelectedPhotoGroup(null);
    setSelectedImageIndex(0);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedPhotoGroup) return;
    
    const totalImages = selectedPhotoGroup.images.length;
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : totalImages - 1;
    } else {
      newIndex = selectedImageIndex < totalImages - 1 ? selectedImageIndex + 1 : 0;
    }
    
    setSelectedImageIndex(newIndex);
  };

  return (
    <div className="min-h-screen bg-transparent text-white py-20">
      <div className="container mx-auto px-4">
        {/* 头部标题 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bebas tracking-wider theme-text-primary mb-4">
            图片 <span className="text-wangfeng-purple animate-pulse-glow">画廊</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple mb-6">
            汪峰珍贵时光
          </h2>
          <p className="theme-text-secondary text-lg max-w-2xl mx-auto">
            巡演返图 · 工作花絮 · 日常生活，记录汪峰音乐路上的点点滴滴
          </p>
        </motion.div>

        {/* 分类筛选 */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category) => (
            <button
              key={`category-${category}`}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-wangfeng-purple theme-text-primary shadow-glow animate-pulse-glow'
                  : 'theme-bg-card theme-text-secondary border theme-border-primary hover:bg-wangfeng-purple/20 hover:text-wangfeng-purple'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* 照片组列表 - 横向卡片布局 */}
        <div className="space-y-6">
          {filteredPhotoGroups.map((photoGroup, index) => (
            <motion.div
              key={photoGroup.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group theme-bg-card rounded-xl border theme-border-primary overflow-hidden hover:border-wangfeng-purpletheme-bg-card transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row min-h-[240px]">
                {/* 左侧信息区 */}
                <div className="lg:w-80 p-6 flex flex-col justify-center bg-gradient-to-br from-wangfeng-purple/10 to-transparent">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-wangfeng-purple text-sm font-medium mb-2">
                      <MapPin className="w-4 h-4" />
                      {photoGroup.category}
                    </div>
                    <h3 className="text-2xl font-bold theme-text-primary mb-2">{photoGroup.title}</h3>
                    <div className="flex items-center gap-2 theme-text-secondary text-sm mb-4">
                      <Clock className="w-4 h-4" />
                      {photoGroup.displayDate}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 theme-text-muted text-sm">
                      <Images className="w-4 h-4" />
                      {photoGroup.images.length} 张照片
                    </div>
                    <button
                      onClick={() => openPhotoGroupModal(photoGroup)}
                      className="px-4 py-2 bg-wangfeng-purple hover:bg-wangfeng-dark rounded-lg theme-text-primary text-sm font-medium transition-colors"
                    >
                      查看全部
                    </button>
                  </div>
                </div>

                {/* 右侧封面图片预览区 */}
                <div className="flex-1 p-4 flex items-center justify-center">
                  <LazyImage
                    src={photoGroup.coverImage}
                    alt={photoGroup.title}
                    className="rounded-lg cursor-pointer group/img w-full max-w-sm aspect-[4/3]"
                    onClick={() => openPhotoGroupModal(photoGroup)}
                  >
                    {/* 悬停效果 */}
                    <div className="absolute inset-0 theme-bg-card opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="text-center theme-text-primary">
                        <Camera className="w-8 h-8 mx-auto mb-2" />
                        <span className="text-sm font-medium">查看全部 {photoGroup.images.length} 张</span>
                      </div>
                    </div>
                    
                    {/* 图片数量标识 */}
                    <div className="absolute top-3 right-3 theme-bg-card backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="theme-text-primary text-sm font-medium flex items-center gap-1">
                        <Images className="w-4 h-4" />
                        {photoGroup.images.length}
                      </span>
                    </div>
                  </LazyImage>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 图片统计 */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="theme-bg-card rounded-xl border theme-border-primary shadow-glow p-6 max-w-md mx-auto">
            <p className="theme-text-secondary mb-2">
              当前展示 <span className="text-wangfeng-purple font-bold">{filteredPhotoGroups.length}</span> 个照片组
            </p>
            <p className="text-sm theme-text-muted">
              总共收录 <span className="text-wangfeng-purple font-bold">{photoGroups.length}</span> 组珍贵瞬间
            </p>
          </div>
        </motion.div>
      </div>

      {/* 照片组放大查看模态框 */}
      <AnimatePresence>
        {selectedPhotoGroup && (
          <motion.div
            key="gallery-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 theme-bg-card backdrop-blur-md flex items-center justify-center p-4"
            onClick={closeModal}
          >
            {/* 关闭按钮 */}
            <button
              onClick={closeModal}
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
                  loading="lazy"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = withBasePath('images/main.jpg');
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
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = withBasePath('images/main.jpg');
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
    </div>
  );
};

export default Gallery;
