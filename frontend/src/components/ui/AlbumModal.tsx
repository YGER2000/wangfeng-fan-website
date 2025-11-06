import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, Music, Calendar, Disc, Info } from 'lucide-react';
import { Album, Song, useMusicContext } from '@/contexts/MusicContext';
import { withBasePath } from '@/lib/utils';

interface AlbumModalProps {
  album: Album | null;
  isOpen: boolean;
  onClose: () => void;
}

type DetailView = 'album' | 'song';

const AlbumModal = ({ album, isOpen, onClose }: AlbumModalProps) => {
  const { currentSong, isPlaying, playSong, pauseMusic, resumeMusic } = useMusicContext();
  const [detailView, setDetailView] = useState<DetailView>('album');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  if (!album) return null;

  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        pauseMusic();
      } else {
        resumeMusic();
      }
    } else {
      playSong(song, album);
    }
  };

  const handleSongClick = (song: Song) => {
    setSelectedSong(song);
    setDetailView('song');
  };

  const handleAlbumInfoClick = () => {
    setDetailView('album');
    setSelectedSong(null);
  };

  const handleMoreInfo = () => {
    // 待实现的功能
    console.log('更多信息按钮被点击');
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 计算总时长
  const getTotalDuration = () => {
    const total = album.songs.reduce((sum, song) => sum + (song.duration || 0), 0);
    return formatDuration(total);
  };

  // 专辑类型中文映射
  const getAlbumTypeLabel = (type?: string) => {
    const typeMap: Record<string, string> = {
      'album': '录音室专辑',
      'live': '现场专辑',
      'remaster': '新编版',
      'other': '其他'
    };
    return typeMap[type || 'other'] || '专辑';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="album-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            key={`album-modal-${album.id}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-secondary-dark border border-wangfeng-purple/30 rounded-xl w-full max-w-6xl max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 主体内容：左右两栏布局 - 无顶部标题栏 */}
            <div className="flex h-[85vh]">
              {/* 左侧：专辑封面 + 歌曲列表 */}
              <div className="w-2/5 border-r border-gray-700 flex flex-col">
                {/* 专辑封面区域 */}
                <div className="flex-shrink-0 p-4 border-b border-gray-700">
                  <div className="flex gap-4 items-start">
                    {/* 专辑封面 */}
                    <div
                      className="w-32 h-32 flex-shrink-0 cursor-pointer transition-transform hover:scale-[1.02]"
                      onClick={handleAlbumInfoClick}
                    >
                      <img
                        src={album.coverImage ? withBasePath(album.coverImage) : withBasePath('images/default-album.jpg')}
                        alt={album.name}
                        className="w-full h-full rounded-lg object-cover border-2 border-wangfeng-purple/30 shadow-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = withBasePath('images/default-album.jpg');
                        }}
                      />
                    </div>

                    {/* 右侧：专辑名称和基本信息 + 播放按钮 */}
                    <div className="flex-1 min-w-0 flex flex-col h-32">
                      {/* 专辑名称 */}
                      <div className="mb-2">
                        <h2 className="text-lg font-bold text-white line-clamp-2">{album.name}</h2>
                      </div>

                      {/* 基本信息 */}
                      <div className="mb-auto">
                        <p className="text-wangfeng-purple font-semibold text-sm mb-1">汪峰</p>
                        <p className="text-gray-400 text-xs">
                          {album.year || '未知年份'} · {album.songs.length} 首歌曲 · {getTotalDuration()}
                        </p>
                      </div>

                      {/* 播放专辑按钮 - 底部对齐 */}
                      {album.songs.length > 0 && (
                        <button
                          onClick={() => handlePlaySong(album.songs[0])}
                          className="w-full bg-wangfeng-purple hover:bg-wangfeng-purple/80 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          播放专辑
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 歌曲列表 */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 px-2">曲目列表</h3>
                  <div className="space-y-1">
                    {album.songs.map((song, index) => {
                      const isCurrentSong = currentSong?.id === song.id;
                      const isCurrentPlaying = isCurrentSong && isPlaying;
                      const isSelected = selectedSong?.id === song.id;

                      return (
                        <motion.div
                          key={song.id}
                          whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                          className={`p-3 rounded-lg cursor-pointer transition-all group ${
                            isSelected
                              ? 'bg-wangfeng-purple/20 border border-wangfeng-purple/50'
                              : isCurrentSong
                              ? 'bg-wangfeng-purple/10 border border-wangfeng-purple/30'
                              : 'hover:bg-wangfeng-purple/5 border border-transparent'
                          }`}
                          onClick={() => handleSongClick(song)}
                        >
                          <div className="flex items-center gap-3">
                            {/* 播放按钮 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlaySong(song);
                              }}
                              className="w-8 h-8 flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
                            >
                              {isCurrentPlaying ? (
                                <Pause className="w-4 h-4 text-wangfeng-purple" />
                              ) : isCurrentSong ? (
                                <Play className="w-4 h-4 text-wangfeng-purple" />
                              ) : (
                                <>
                                  <span className="group-hover:hidden text-gray-400 text-sm">
                                    {index + 1}
                                  </span>
                                  <Play className="w-4 h-4 text-wangfeng-purple hidden group-hover:block" />
                                </>
                              )}
                            </button>

                            {/* 歌曲信息 */}
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`font-medium truncate text-sm ${
                                  isSelected || isCurrentSong ? 'text-wangfeng-purple' : 'text-white'
                                }`}
                              >
                                {song.title}
                              </h4>
                            </div>

                            {/* 时长 */}
                            <div className="text-gray-400 text-xs flex-shrink-0">
                              {formatDuration(song.duration)}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 右侧：详细信息展示区 */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {detailView === 'album' ? (
                    <motion.div
                      key="album-detail"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="p-8"
                    >
                      {/* 上部分：左右分栏 */}
                      <div className="flex gap-6 mb-6">
                        {/* 左边：信息列表 */}
                        <div className="flex-1 space-y-4">
                          {/* 专辑标题 */}
                          <div className="mb-4">
                            <h2 className="text-3xl font-bold text-white">{album.name}</h2>
                          </div>
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-wangfeng-purple mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-400 text-xs mb-0.5">发行时间</p>
                              <p className="text-white text-base font-medium">{album.year || '未知年份'}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Disc className="w-5 h-5 text-wangfeng-purple mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-400 text-xs mb-0.5">专辑类型</p>
                              <p className="text-white text-base font-medium">{getAlbumTypeLabel(album.type)}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Music className="w-5 h-5 text-wangfeng-purple mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-400 text-xs mb-0.5">曲目数量</p>
                              <p className="text-white text-base font-medium">{album.songs.length} 首</p>
                            </div>
                          </div>

                          {/* 更多信息按钮 - 变窄 */}
                          <button
                            onClick={handleMoreInfo}
                            className="w-auto bg-wangfeng-purple hover:bg-wangfeng-purple/80 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 mt-4"
                          >
                            <Info className="w-4 h-4" />
                            更多信息
                          </button>
                        </div>

                        {/* 右边：专辑封面 - 继续放大 */}
                        <div className="w-80 h-80 flex-shrink-0">
                          <img
                            src={album.coverImage ? withBasePath(album.coverImage) : withBasePath('images/default-album.jpg')}
                            alt={album.name}
                            className="w-full h-full rounded-lg object-cover border-2 border-wangfeng-purple/30 shadow-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = withBasePath('images/default-album.jpg');
                            }}
                          />
                        </div>
                      </div>

                      {/* 分割线 */}
                      <div className="border-t border-gray-700 mb-6"></div>

                      {/* 下部分：文字信息区域 */}
                      <div className="space-y-6">
                        {/* 艺人信息 */}
                        <div>
                          <p className="text-wangfeng-purple font-semibold text-lg">汪峰</p>
                        </div>

                        {/* 专辑简介 */}
                        <div>
                          <h4 className="text-white font-semibold mb-2">专辑简介</h4>
                          <p className="text-gray-300 leading-relaxed text-sm">
                            {album.name}是汪峰的代表作品之一，收录了{album.songs.length}首精心制作的歌曲。
                            每一首歌曲都展现了汪峰独特的音乐风格和深刻的歌词内涵。
                          </p>
                        </div>

                        {/* 统计信息卡片 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-wangfeng-purple/10 border border-wangfeng-purple/30 rounded-lg p-4">
                            <p className="text-gray-400 text-xs mb-1">总时长</p>
                            <p className="text-white font-bold text-lg">{getTotalDuration()}</p>
                          </div>
                          <div className="bg-wangfeng-purple/10 border border-wangfeng-purple/30 rounded-lg p-4">
                            <p className="text-gray-400 text-xs mb-1">曲目</p>
                            <p className="text-white font-bold text-lg">{album.songs.length} 首</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : selectedSong ? (
                    <motion.div
                      key="song-detail"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="p-8"
                    >
                      {/* 上部分：左右分栏 */}
                      <div className="flex gap-6 mb-6">
                        {/* 左边：歌曲信息列表 */}
                        <div className="flex-1 space-y-4">
                          {/* 歌曲标题 */}
                          <div className="mb-4">
                            <h2 className="text-3xl font-bold text-white">{selectedSong.title}</h2>
                          </div>
                          <div className="flex items-start gap-3">
                            <Music className="w-5 h-5 text-wangfeng-purple mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-400 text-xs mb-0.5">歌曲名称</p>
                              <p className="text-white text-base font-medium">{selectedSong.title}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Disc className="w-5 h-5 text-wangfeng-purple mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-400 text-xs mb-0.5">所属专辑</p>
                              <p className="text-white text-base font-medium">{album.name}</p>
                            </div>
                          </div>

                          {selectedSong.duration && (
                            <div className="flex items-start gap-3">
                              <Music className="w-5 h-5 text-wangfeng-purple mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-gray-400 text-xs mb-0.5">歌曲时长</p>
                                <p className="text-white text-base font-medium">{formatDuration(selectedSong.duration)}</p>
                              </div>
                            </div>
                          )}

                          {/* 播放按钮 - 变窄 */}
                          <button
                            onClick={() => handlePlaySong(selectedSong)}
                            className="w-auto bg-wangfeng-purple hover:bg-wangfeng-purple/80 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 mt-4"
                          >
                            {currentSong?.id === selectedSong.id && isPlaying ? (
                              <>
                                <Pause className="w-4 h-4" />
                                暂停播放
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                播放歌曲
                              </>
                            )}
                          </button>
                        </div>

                        {/* 右边：歌曲封面 - 继续放大 */}
                        <div className="w-80 h-80 flex-shrink-0">
                          <img
                            src={selectedSong.coverImage ? withBasePath(selectedSong.coverImage) : album.coverImage ? withBasePath(album.coverImage) : withBasePath('images/default-album.jpg')}
                            alt={selectedSong.title}
                            className="w-full h-full rounded-lg object-cover border-2 border-wangfeng-purple/30 shadow-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = withBasePath('images/default-album.jpg');
                            }}
                          />
                        </div>
                      </div>

                      {/* 分割线 */}
                      <div className="border-t border-gray-700 mb-6"></div>

                      {/* 下部分：文字信息区域 */}
                      <div className="space-y-6">
                        {/* 艺人信息 */}
                        <div>
                          <p className="text-wangfeng-purple font-semibold text-lg">汪峰</p>
                        </div>

                        {/* 歌曲简介 */}
                        <div>
                          <h4 className="text-white font-semibold mb-2">歌曲简介</h4>
                          <p className="text-gray-300 leading-relaxed text-sm">
                            《{selectedSong.title}》是汪峰专辑《{album.name}》中的精彩曲目，
                            展现了汪峰独特的音乐风格和深刻的情感表达。
                          </p>
                        </div>

                        {/* 更多信息 */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-wangfeng-purple" />
                            <span className="text-gray-400">发行时间：</span>
                            <span className="text-white">{album.year || '未知年份'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Disc className="w-4 h-4 text-wangfeng-purple" />
                            <span className="text-gray-400">专辑类型：</span>
                            <span className="text-white">{getAlbumTypeLabel(album.type)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlbumModal;
