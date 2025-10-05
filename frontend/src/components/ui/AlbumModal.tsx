import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, X } from 'lucide-react';
import { Album, Song, useMusicContext } from '@/contexts/MusicContext';
import { withBasePath } from '@/lib/utils';

interface AlbumModalProps {
  album: Album | null;
  isOpen: boolean;
  onClose: () => void;
}

const AlbumModal = ({ album, isOpen, onClose }: AlbumModalProps) => {
  const { currentSong, isPlaying, playSong, pauseMusic, resumeMusic } = useMusicContext();

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
          key="album-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            key={`album-modal-${album.id}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-secondary-dark border border-wangfeng-purple/30 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="relative p-6 border-b border-gray-700">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col md:flex-row gap-6">
                {/* 专辑封面 */}
                <div className="flex-shrink-0">
                  <img
                    src={album.coverImage ? withBasePath(album.coverImage) : withBasePath('images/default-album.jpg')}
                    alt={album.name}
                    className="w-32 h-32 rounded-lg object-cover border-2 border-wangfeng-purple/30"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = withBasePath('images/default-album.jpg');
                    }}
                  />
                </div>

                {/* 专辑信息 */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-white mb-2">{album.name}</h2>
                  <p className="text-wangfeng-purple font-semibold mb-1">汪峰</p>
                  <p className="text-gray-400 text-sm mb-3">
                    {album.year || '未知年份'} • {album.songs.length} 首歌曲
                  </p>
                  {album.songs.length > 0 && (
                    <button
                      onClick={() => handlePlaySong(album.songs[0])}
                      className="bg-wangfeng-purple hover:bg-wangfeng-purple/80 text-white px-6 py-2 rounded-full font-semibold transition-colors flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      播放专辑
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 歌曲列表 */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">曲目列表</h3>
              <div className="space-y-2">
                {album.songs.map((song, index) => {
                  const isCurrentSong = currentSong?.id === song.id;
                  const isCurrentPlaying = isCurrentSong && isPlaying;

                  return (
                    <motion.div
                      key={song.id}
                      whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                      className={`p-3 rounded-lg cursor-pointer transition-all group ${
                        isCurrentSong
                          ? 'bg-wangfeng-purple/20 border border-wangfeng-purple/30'
                          : 'hover:bg-wangfeng-purple/5'
                      }`}
                      onClick={() => handlePlaySong(song)}
                    >
                      <div className="flex items-center gap-4">
                        {/* 序号/播放按钮 */}
                        <div className="w-8 h-8 flex items-center justify-center text-sm">
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

                        {/* 歌曲信息 */}
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`font-medium truncate ${
                              isCurrentSong ? 'text-wangfeng-purple' : 'text-white'
                            }`}
                          >
                            {song.title}
                          </h4>
                          <p className="text-gray-400 text-sm truncate">汪峰</p>
                        </div>

                        {/* 时长 */}
                        <div className="text-gray-400 text-sm">
                          {formatDuration(song.duration)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlbumModal;
