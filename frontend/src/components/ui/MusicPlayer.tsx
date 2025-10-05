import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusicContext, PlayMode } from '@/contexts/MusicContext';
import { withBasePath } from '@/lib/utils';
import PlaylistModal from './PlaylistModal';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown,
  Repeat,
  Repeat1,
  Shuffle,
  List
} from 'lucide-react';

const MusicPlayer = () => {
  const {
    currentSong,
    currentAlbum,
    isPlaying,
    currentTime,
    duration,
    volume,
    isPlayerVisible,
    playMode,
    isPlaylistVisible,
    playSong,
    pauseMusic,
    resumeMusic,
    nextSong,
    previousSong,
    setVolume,
    seekTo,
    setPlayMode,
    togglePlayer,
    togglePlaylist,
    forcePlayNext
  } = useMusicContext();

  // 暴露调试函数到全局
  React.useEffect(() => {
    // @ts-ignore
    window.forcePlayNext = forcePlayNext;
  }, []);
  
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handlePlayPause = () => {
    if (isPlaying) {
      pauseMusic();
    } else {
      resumeMusic();
    }
  };
  
  const handleVolumeToggle = () => {
    if (isMuted) {
      setVolume(0.7);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    seekTo(newTime);
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
      default:
        return <Repeat className="w-5 h-5" />;
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
  
  if (!currentSong) {
    return null;
  }
  
  return (
    <AnimatePresence>
      {isPlayerVisible && (
          <motion.div
            key="music-player"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-wangfeng-purple/30"
        >
          {/* 收起/展开按钮 */}
          <button
            onClick={togglePlayer}
            className="absolute top-2 right-4 text-wangfeng-purple hover:text-white transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              {/* 专辑封面和歌曲信息 */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* 专辑封面 */}
                <div className="flex-shrink-0">
                  <img 
                    src={currentAlbum?.coverImage ? withBasePath(currentAlbum.coverImage) : withBasePath('images/default-album.jpg')}
                    alt={currentSong.album}
                    className="w-12 h-12 object-cover rounded border border-wangfeng-purple/30"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = withBasePath('images/default-album.jpg');
                    }}
                  />
                </div>
                
                {/* 歌曲信息 */}
                <div className="min-w-0">
                  <h4 className="text-white font-bold truncate">{currentSong.title}</h4>
                  <p className="text-gray-400 text-sm truncate">汪峰 • {currentSong.album}</p>
                </div>
              </div>
              
              {/* 播放控制 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayModeToggle}
                  className={`text-gray-400 hover:text-wangfeng-purple transition-colors ${
                    playMode !== 'sequential' ? 'text-wangfeng-purple' : ''
                  }`}
                  title={getPlayModeText()}
                >
                  {getPlayModeIcon()}
                </button>
                
                <button
                  onClick={previousSong}
                  className="text-gray-400 hover:text-wangfeng-purple transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handlePlayPause}
                  className="bg-wangfeng-purple hover:bg-wangfeng-purple/80 text-white p-2 rounded-full transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={nextSong}
                  className="text-gray-400 hover:text-wangfeng-purple transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                
                <button
                  onClick={togglePlaylist}
                  className="text-gray-400 hover:text-wangfeng-purple transition-colors"
                  title="播放列表"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              
              {/* 进度条 */}
              <div className="flex-1 max-w-md mx-4">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <span>{formatTime(currentTime)}</span>
                  <span className="flex-1"></span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div
                  className="w-full h-1 bg-gray-600 rounded cursor-pointer"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-wangfeng-purple rounded"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
              </div>
              
              {/* 音量控制 */}
              <div className="relative">
                <button
                  onClick={handleVolumeToggle}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  className="text-gray-400 hover:text-wangfeng-purple transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                
                {showVolumeSlider && (
                  <div 
                    className="absolute bottom-8 right-0 bg-gray-900/95 backdrop-blur-sm border border-wangfeng-purple/30 p-3 rounded-lg shadow-lg"
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs text-gray-300">{Math.round(volume * 100)}%</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => {
                          const newVolume = parseFloat(e.target.value);
                          setVolume(newVolume);
                          setIsMuted(newVolume === 0);
                        }}
                        className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer volume-slider"
                        style={{
                          background: `linear-gradient(to right, #8b5fbf 0%, #8b5fbf ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* 最小化时的悬浮按钮 */}
      {currentSong && !isPlayerVisible && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-50 bg-wangfeng-purple hover:bg-wangfeng-purple/80 text-white p-3 rounded-full shadow-lg transition-colors"
          onClick={togglePlayer}
        >
          <ChevronUp className="w-6 h-6" />
        </motion.button>
      )}
      
      {/* 播放列表弹窗 */}
      <PlaylistModal
        isOpen={isPlaylistVisible}
        onClose={togglePlaylist}
      />
    </AnimatePresence>
  );
};

export default MusicPlayer;
