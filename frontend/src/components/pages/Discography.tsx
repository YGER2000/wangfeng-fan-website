import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Album, useMusicContext } from '@/contexts/MusicContext';
import AlbumModal from '@/components/ui/AlbumModal';
import { withBasePath } from '@/lib/utils';
import { Play, Music, Sparkles } from 'lucide-react';

type MusicCategory = 'all' | 'album' | 'live' | 'remaster' | 'other';

const Discography = () => {
  const { albums, loadAlbums, setAlbums } = useMusicContext();
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<MusicCategory>('all');

  useEffect(() => {
    const initializeAlbums = async () => {
      try {
        await loadAlbums();
      } catch (error) {
        console.error('加载专辑失败:', error);
        // 如果无法动态加载，使用静态数据
        loadStaticAlbums();
      } finally {
        setLoading(false);
      }
    };

    initializeAlbums();
  }, [loadAlbums]);

  const loadStaticAlbums = () => {
    // 静态专辑数据作为备选方案，包含所有现有专辑和占位数据
    const staticAlbums: Album[] = [
      // 现有专辑标记为专辑类型
      {
        id: 'nfdsm',
        name: '怒放的生命',
        coverImage: 'images/album_cover/nfdsm_cover.JPG',
        year: '2005',
        type: 'album',
        songs: [
          {
            id: 'nfdsm-1',
            title: '怒放的生命',
            album: '怒放的生命',
            filePath: '/music/album/怒放的生命/怒放的生命.mp3'
          }
        ]
      },
      {
        id: 'chuantianli',
        name: '春天里',
        coverImage: 'images/album_cover/spring_cover.jpg',
        year: '2009',
        type: 'album',
        songs: [
          {
            id: 'ctl-1',
            title: '春天里',
            album: '春天里',
            filePath: '/music/album/春天里/春天里.mp3'
          }
        ]
      },
      // Live 演出专辑占位
      {
        id: 'live-2024',
        name: '存在2024巡回演唱会',
        coverImage: 'images/default-album.jpg',
        year: '2024',
        type: 'live',
        songs: [
          {
            id: 'live-2024-1',
            title: '存在 (Live)',
            album: '存在2024巡回演唱会',
            filePath: '/music/live/存在_live.mp3'
          }
        ]
      },
      {
        id: 'live-2023',
        name: '汪峰北京工体演唱会',
        coverImage: 'images/default-album.jpg',
        year: '2023',
        type: 'live',
        songs: [
          {
            id: 'live-2023-1',
            title: '飞得更高 (Live)',
            album: '汪峰北京工体演唱会',
            filePath: '/music/live/飞得更高_live.mp3'
          }
        ]
      },
      // 新编专辑占位
      {
        id: 'remaster-2024',
        name: '经典重制版合集',
        coverImage: 'images/default-album.jpg',
        year: '2024',
        type: 'remaster',
        songs: [
          {
            id: 'remaster-2024-1',
            title: '北京北京 (重制版)',
            album: '经典重制版合集',
            filePath: '/music/remaster/北京北京_remaster.mp3'
          }
        ]
      },
      {
        id: 'remaster-2023',
        name: '青春重制计划',
        coverImage: 'images/default-album.jpg',
        year: '2023',
        type: 'remaster',
        songs: [
          {
            id: 'remaster-2023-1',
            title: '青春 (重制版)',
            album: '青春重制计划',
            filePath: '/music/remaster/青春_remaster.mp3'
          }
        ]
      },
      // 其他分类占位
      {
        id: 'singles',
        name: '单曲集',
        coverImage: 'images/default-album.jpg',
        year: '2015-2020',
        type: 'other',
        songs: [
          {
            id: 'singles-1',
            title: 'Song Of Redemption',
            album: '单曲集',
            filePath: '/music/singles/Song Of Redemption.flac'
          }
        ]
      },
      {
        id: 'other-2001',
        name: '十七岁的单车',
        coverImage: 'images/default-album.jpg',
        year: '2001',
        type: 'other',
        songs: [
          {
            id: 'other-2001-1',
            title: 'Main Melody',
            album: '十七岁的单车',
            filePath: '/music/others/2001-十七岁的单车/1.Main Melody.mp3'
          }
        ]
      },
      {
        id: 'other-2018',
        name: '歌手第二季',
        coverImage: 'images/default-album.jpg',
        year: '2018',
        type: 'other',
        songs: [
          {
            id: 'other-2018-1',
            title: '无处安放',
            album: '歌手第二季',
            filePath: '/music/others/2018-歌手第二季/1.无处安放.flac'
          }
        ]
      }
    ];
    setAlbums(staticAlbums);
  };

  const handleAlbumClick = (album: Album) => {
    setSelectedAlbum(album);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAlbum(null);
  };

  const categories = [
    { key: 'all' as const, label: '全部' },
    { key: 'album' as const, label: '专辑' },
    { key: 'live' as const, label: 'Live' },
    { key: 'remaster' as const, label: '新编' },
    { key: 'other' as const, label: '其他' },
  ];

  const filteredAlbums = albums.filter(album => {
    if (activeCategory === 'all') return true;
    return album.type === activeCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple mx-auto mb-4"></div>
          <p className="text-lg">加载音乐作品中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white py-20">
      <div className="container mx-auto px-4">
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
              音乐 <span className="text-wangfeng-purple">作品</span>
            </motion.h1>
            <motion.div
              className="absolute -top-4 -right-4 text-wangfeng-purple/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-12 h-12 md:w-16 md:h-16" />
            </motion.div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple mb-6">
            汪峰经典专辑收录
          </h2>
        </motion.div>

        {/* 分类按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category, index) => (
            <motion.button
              key={category.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(category.key)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 border-2 ${
                activeCategory === category.key
                  ? 'bg-wangfeng-purple border-wangfeng-purple theme-text-primary shadow-lg shadow-wangfeng-purple/30'
                  : 'bg-transparent theme-border-primary theme-text-secondary hover:border-wangfeng-purple hover:text-wangfeng-purple'
              }`}
            >
              {category.label}
            </motion.button>
          ))}
        </motion.div>

        {/* 专辑网格 */}
        <div className="max-w-7xl mx-auto">
          {filteredAlbums.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Music className="w-16 h-16 text-wangfeng-purple mx-auto mb-4 opacity-50" />
              <h3 className="text-xl theme-text-muted mb-2">
                {albums.length === 0 ? '暂无音乐作品' : `暂无${categories.find(c => c.key === activeCategory)?.label}分类作品`}
              </h3>
              <p className="theme-text-muted">
                {albums.length === 0 ? '请将音乐文件添加到 public/music 文件夹中' : '切换到其他分类查看更多作品'}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredAlbums
                .sort((a, b) => parseInt(b.year || '0') - parseInt(a.year || '0'))
                .map((album, index) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="group cursor-pointer"
                  onClick={() => handleAlbumClick(album)}
                >
                  <div className="relative overflow-hidden rounded-xl theme-bg-card border theme-border-primary group-hover:border-wangfeng-purple/50 transition-all duration-300">
                    {/* 专辑封面 */}
                    <div className="relative aspect-square">
                      <img
                        src={album.coverImage ? withBasePath(album.coverImage) : withBasePath('images/default-album.jpg')}
                        alt={album.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = withBasePath('images/default-album.jpg');
                        }}
                      />
                      
                      {/* 悬停播放按钮 */}
                      <div className="absolute inset-0 theme-bg-card opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-wangfeng-purple hover:bg-wangfeng-purple/80 theme-text-primary p-3 rounded-full transition-colors">
                          <Play className="w-6 h-6" />
                        </div>
                      </div>
                      
                      {/* 歌曲数量标识 */}
                      <div className="absolute top-2 right-2 theme-bg-card theme-text-primary text-xs px-2 py-1 rounded">
                        {album.songs.length} 首
                      </div>
                    </div>
                    
                    {/* 专辑信息 */}
                    <div className="p-4">
                      <h3 className="font-bold theme-text-primary mb-1 truncate group-hover:text-wangfeng-purple transition-colors">
                        {album.name}
                      </h3>
                      <p className="theme-text-muted text-sm mb-2">汪峰</p>
                      <p className="theme-text-muted text-xs">
                        {album.year || '未知年份'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 专辑详情弹窗 */}
        <AlbumModal
          album={selectedAlbum}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      </div>
    </div>
  );
};

export default Discography;