import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, X, Trash2, SkipForward, List, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { Song, useMusicContext } from '@/contexts/MusicContext';
import { withBasePath } from '@/lib/utils';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PlaylistModal = ({ isOpen, onClose }: PlaylistModalProps) => {
  const { 
    playlist, 
    currentSong, 
    currentPlaylistIndex,
    isPlaying, 
    playMode,
    playSong, 
    pauseMusic, 
    resumeMusic, 
    removeFromPlaylist,
    clearPlaylist,
    playFromPlaylist,
    setPlayMode
  } = useMusicContext();

  const handlePlaySong = (song: Song, index: number) => {
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        pauseMusic();
      } else {
        resumeMusic();
      }
    } else {
      playFromPlaylist(index);
    }
  };

  const handleRemoveSong = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    removeFromPlaylist(songId);
  };

  const handlePlayModeToggle = () => {
    const modes = ['sequential', 'repeat-all', 'random', 'repeat-one'] as const;
    const currentIndex = modes.indexOf(playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setPlayMode(modes[nextIndex]);
  };

  const getPlayModeIcon = () => {
    switch (playMode) {
      case 'random':
        return <Shuffle className="w-5 h-5" />;
      case 'repeat-one':
        return <Repeat1 className="w-5 h-5" />;
      case 'repeat-all':
        return <Repeat className="w-5 h-5" />;
      default:
        return <SkipForward className="w-5 h-5" />;
    }
  };

  const getPlayModeText = () => {
    switch (playMode) {
      case 'random':
        return '随机播放';
      case 'repeat-one':
        return '单曲循环';
      case 'repeat-all':
        return '列表循环';
      default:
        return '顺序播放';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="playlist-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            key="playlist-modal-content"
            initial={{ scale: 0.8, opacity: 0, x: 300 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0.8, opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-secondary-dark border border-wangfeng-purple/30 rounded-xl w-full max-w-md h-[80vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <List className="w-6 h-6 text-wangfeng-purple" />
                  <h2 className="text-xl font-bold text-white">播放列表</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* 播放模式和清空按钮 */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={handlePlayModeToggle}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    playMode !== 'sequential' 
                      ? 'bg-wangfeng-purple/20 text-wangfeng-purple border border-wangfeng-purple/30' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title={getPlayModeText()}
                >
                  {getPlayModeIcon()}
                  <span>{getPlayModeText()}</span>
                </button>

                {playlist.length > 0 && (
                  <button
                    onClick={clearPlaylist}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    清空
                  </button>
                )}
              </div>


              {playlist.length > 0 && (
                <p className="text-gray-400 text-sm mt-3">
                  共 {playlist.length} 首歌曲
                </p>
              )}
            </div>

            {/* 歌曲列表 */}
            <div className="flex-1 overflow-y-auto">
              {playlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <List className="w-16 h-16 text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">播放列表为空</h3>
                  <p className="text-gray-500 text-sm">
                    从专辑中播放歌曲将自动添加到播放列表
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {playlist.map((song, index) => {
                    const isCurrentSong = currentPlaylistIndex === index;
                    const isCurrentPlaying = isCurrentSong && isPlaying;

                    return (
                      <motion.div
                        key={`playlist-${song.id}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                        className={`p-3 rounded-lg cursor-pointer transition-all group relative ${
                          isCurrentSong
                            ? 'bg-wangfeng-purple/20 border border-wangfeng-purple/30'
                            : 'hover:bg-wangfeng-purple/5'
                        }`}
                        onClick={() => handlePlaySong(song, index)}
                      >
                        <div className="flex items-center gap-3">
                          {/* 序号/播放按钮 */}
                          <div className="w-8 h-8 flex items-center justify-center text-sm flex-shrink-0">
                            {isCurrentPlaying ? (
                              <Pause className="w-4 h-4 text-wangfeng-purple" />
                            ) : isCurrentSong ? (
                              <Play className="w-4 h-4 text-wangfeng-purple" />
                            ) : (
                              <span className={`group-hover:hidden ${isCurrentSong ? 'text-wangfeng-purple' : 'text-gray-400'}`}>
                                {index + 1}
                              </span>
                            )}
                            {!isCurrentSong && (
                              <Play className="w-4 h-4 text-wangfeng-purple hidden group-hover:block" />
                            )}
                          </div>

                          {/* 专辑封面 */}
                          <div className="w-10 h-10 flex-shrink-0">
                            <img
                              src={withBasePath(song.coverImage ?? 'images/default-album.jpg')}
                              alt={song.album}
                              className="w-full h-full object-cover rounded border border-gray-600"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = withBasePath('images/default-album.jpg');
                              }}
                            />
                          </div>

                          {/* 歌曲信息 */}
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`font-medium truncate text-sm ${
                                isCurrentSong ? 'text-wangfeng-purple' : 'text-white'
                              }`}
                            >
                              {song.title}
                            </h4>
                            <p className="text-gray-400 text-xs truncate">
                              汪峰 • {song.album}
                            </p>
                          </div>

                          {/* 移除按钮和时长 */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-gray-400 text-xs">
                              {formatDuration(song.duration)}
                            </span>
                            <button
                              onClick={(e) => handleRemoveSong(e, song.id)}
                              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlaylistModal;
