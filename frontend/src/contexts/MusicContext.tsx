import { createContext, useContext, useState, useRef, ReactNode, useMemo, useCallback } from 'react';
import { withBasePath } from '@/lib/utils';

export interface Song {
  id: string;
  title: string;
  album: string;
  filePath: string;
  duration?: number;
  coverImage?: string;
}

export interface Album {
  id: string;
  name: string;
  coverImage?: string;
  songs: Song[];
  year?: string;
  type?: 'album' | 'live' | 'remaster' | 'other';
}

export type PlayMode = 'sequential' | 'random' | 'repeat-one' | 'repeat-all';

interface MusicContextType {
  // 播放器状态
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isPlayerVisible: boolean;
  playMode: PlayMode;
  
  // 专辑和歌曲数据
  albums: Album[];
  currentAlbum: Album | null;
  
  // 播放列表
  playlist: Song[];
  currentPlaylistIndex: number;
  isPlaylistVisible: boolean;
  
  // 播放控制
  playSong: (song: Song, album?: Album) => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
  stopMusic: () => void;
  nextSong: () => void;
  previousSong: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  setPlayMode: (mode: PlayMode) => void;
  
  // 播放列表控制
  addToPlaylist: (song: Song) => void;
  removeFromPlaylist: (songId: string) => void;
  clearPlaylist: () => void;
  playFromPlaylist: (index: number) => void;
  addAlbumToPlaylist: (album: Album) => void;
  
  // UI控制
  showPlayer: () => void;
  hidePlayer: () => void;
  togglePlayer: () => void;
  showPlaylist: () => void;
  hidePlaylist: () => void;
  togglePlaylist: () => void;
  
  // 数据管理
  setAlbums: (albums: Album[]) => void;
  loadAlbums: () => Promise<void>;
  
  // 调试功能
  forcePlayNext?: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

const enrichSongWithAlbum = (song: Song, album?: Album): Song => ({
  ...song,
  coverImage: song.coverImage ?? album?.coverImage,
});

const enrichAlbumSongs = (album: Album): Album => ({
  ...album,
  songs: album.songs.map((song) => enrichSongWithAlbum(song, album)),
});

export const useMusicContext = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusicContext must be used within a MusicProvider');
  }
  return context;
};

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [albums, setAlbumsState] = useState<Album[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [playMode, setPlayModeState] = useState<PlayMode>('sequential');
  
  // 播放列表状态
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(-1);
  const [isPlaylistVisible, setIsPlaylistVisible] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Song[]>([]);
  
  // 生成随机播放列表
  const generateShuffledPlaylist = (songs: Song[], currentSong?: Song) => {
    const playlist = [...songs];
    // Fisher-Yates 洗牌算法
    for (let i = playlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
    }
    // 确保当前歌曲不是第一首
    if (currentSong) {
      const currentIndex = playlist.findIndex(s => s.id === currentSong.id);
      if (currentIndex === 0 && playlist.length > 1) {
        [playlist[0], playlist[1]] = [playlist[1], playlist[0]];
      }
    }
    return playlist;
  };

  // 创建Audio实例（只创建一次）
  const createAudioInstance = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio();
    audio.volume = volume;
    
    // 绑定事件监听器
    audio.addEventListener('loadedmetadata', () => {
      // 如果当前歌曲没有预定义的时长，则使用音频文件的时长
      if (!currentSong?.duration || currentSong.duration <= 0) {
        setDuration(audio.duration || 0);
      }
    });
    
    audio.addEventListener('timeupdate', () => {
      const newTime = Math.floor(audio.currentTime || 0);
      setCurrentTime(prev => {
        if (Math.abs(prev - newTime) >= 1) {
          return newTime;
        }
        return prev;
      });
    });
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setTimeout(() => handleSongEnded(), 100);
    });
    
    audio.addEventListener('error', (e) => {
      console.error('❌ 音频播放错误:', audio.src);
      setIsPlaying(false);
    });

    audioRef.current = audio;
    return audio;
  };

  // 处理歌曲结束后的逻辑
  const handleSongEnded = () => {
    if (playMode === 'repeat-one') {
      // 单曲循环
      if (audioRef.current && currentSong) {
        audioRef.current.currentTime = 0;
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(console.error);
      }
      return;
    }

    // 对于所有其他播放模式（包括repeat-all和random），计算下一首歌曲
    const nextInfo = getNextSong();
    if (nextInfo) {
      playSpecificSong(nextInfo.song, nextInfo.index);
    } else {
      // 如果没有下一首歌曲（顺序播放模式下播放完最后一首），停止播放
      setIsPlaying(false);
    }
  };

  // 获取下一首歌曲信息
  const getNextSong = (): { song: Song; index: number } | null => {
    if (!currentSong || playlist.length === 0) {
      return null;
    }

    if (playMode === 'random') {
      // 随机播放模式
      let workingShuffle = shuffledPlaylist;
      if (workingShuffle.length === 0) {
        workingShuffle = generateShuffledPlaylist(playlist, currentSong);
        setShuffledPlaylist(workingShuffle);
      }

      if (workingShuffle.length === 0) return null;

      const currentShuffleIndex = workingShuffle.findIndex(s => s.id === currentSong.id);
      const nextShuffleIndex = (currentShuffleIndex + 1) % workingShuffle.length;
      const nextSong = workingShuffle[nextShuffleIndex];
      const playlistIndex = playlist.findIndex(s => s.id === nextSong.id);
      
      return { song: nextSong, index: playlistIndex };
    } else if (playMode === 'sequential') {
      // 顺序播放模式
      if (currentPlaylistIndex >= playlist.length - 1) {
        // 顺序播放到最后一首，返回null表示播放结束
        return null;
      }
      // 播放下一首
      const nextIndex = currentPlaylistIndex + 1;
      return { song: playlist[nextIndex], index: nextIndex };
    } else {
      // 列表循环和单曲循环模式（除了随机播放和顺序播放）
      // 对于repeat-all，循环播放列表
      const nextIndex = (currentPlaylistIndex + 1) % playlist.length;
      return { song: playlist[nextIndex], index: nextIndex };
    }
  };

  // 强制播放下一首（调试用）
  const forcePlayNext = () => {
    const nextInfo = getNextSong();
    if (nextInfo) {
      playSpecificSong(nextInfo.song, nextInfo.index);
    }
  };

  // 播放指定歌曲
  const playSpecificSong = async (song: Song, index: number) => {
    // 设置歌曲时长（优先使用预定义时长）
    setDuration(song.duration && song.duration > 0 ? song.duration : 0);
    
    if (!audioRef.current) {
      createAudioInstance();
    }

    const audioPath = withBasePath(song.filePath);

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = audioPath;
        audioRef.current.load();
        await audioRef.current.play();
        
        setIsPlaying(true);
        setCurrentSong(song);
        setCurrentPlaylistIndex(index);
      }
    } catch (error) {
      console.error('❌ 播放失败:', song.title, error);
      setIsPlaying(false);
    }
  };
  
  const playSong = (song: Song, album?: Album) => {
    const normalizedAlbum = album ? enrichAlbumSongs(album) : null;
    const fallbackAlbum = normalizedAlbum ?? currentAlbum ?? undefined;
    const songWithCover = song.coverImage
      ? { ...song }
      : enrichSongWithAlbum(song, fallbackAlbum);

    let songIndex = -1;

    // 设置播放列表
    if (normalizedAlbum) {
      setCurrentAlbum(normalizedAlbum);
      const albumSongs = normalizedAlbum.songs;
      setPlaylist(albumSongs);
      songIndex = albumSongs.findIndex((s) => s.id === songWithCover.id);

      if (playMode === 'random') {
        setShuffledPlaylist(generateShuffledPlaylist(albumSongs, songWithCover));
      } else {
        setShuffledPlaylist([]);
      }
    } else {
      songIndex = playlist.findIndex((s) => s.id === songWithCover.id);
    }

    // 确保Audio实例存在
    if (!audioRef.current) {
      createAudioInstance();
    }

    // 播放歌曲
    playSpecificSong(songWithCover, songIndex);
    setIsPlayerVisible(true);
  };
  
  const pauseMusic = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);
  
  const resumeMusic = useCallback(() => {
    audioRef.current?.play().then(() => {
      setIsPlaying(true);
    }).catch(console.error);
  }, []);
  
  const stopMusic = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);
  
  const nextSong = useCallback(() => {
    const nextInfo = getNextSong();
    if (nextInfo) {
      playSpecificSong(nextInfo.song, nextInfo.index);
    } else if (playMode === 'sequential') {
      // 顺序播放模式下，播放完最后一首后停止
      stopMusic();
    } else {
      // 其他模式下（包括列表循环），循环到第一首
      if (playlist.length > 0) {
        playSpecificSong(playlist[0], 0);
      }
    }
  }, [playMode, playlist, currentPlaylistIndex, currentSong, shuffledPlaylist]);

  const previousSong = () => {
    if (!currentSong || playlist.length === 0) return;

    let prevSong: Song | null = null;
    let prevIndex = -1;

    if (playMode === 'random') {
      let workingShuffle = shuffledPlaylist;
      if (workingShuffle.length === 0) {
        workingShuffle = generateShuffledPlaylist(playlist, currentSong);
        setShuffledPlaylist(workingShuffle);
      }

      if (workingShuffle.length === 0) return;

      const currentShuffleIndex = workingShuffle.findIndex(s => s.id === currentSong.id);
      const prevShuffleIndex = currentShuffleIndex <= 0
        ? workingShuffle.length - 1
        : currentShuffleIndex - 1;

      prevSong = workingShuffle[prevShuffleIndex];
      prevIndex = playlist.findIndex(s => s.id === prevSong!.id);
    } else if (playMode === 'sequential') {
      // 顺序播放模式
      if (currentPlaylistIndex === 0) {
        // 顺序播放模式下，第一首歌曲没有前一首
        return;
      }
      prevIndex = currentPlaylistIndex - 1;
      prevSong = playlist[prevIndex];
    } else {
      // 列表循环和单曲循环模式
      prevIndex = currentPlaylistIndex === 0 ? playlist.length - 1 : currentPlaylistIndex - 1;
      prevSong = playlist[prevIndex];
    }

    if (prevSong) {
      playSpecificSong(prevSong, prevIndex);
    }
  };
  
  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };
  
  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setPlayMode = (mode: PlayMode) => {
    setPlayModeState(mode);
    // 如果切换到随机模式且有播放列表，生成随机播放列表
    if (mode === 'random' && playlist.length > 0) {
      setShuffledPlaylist(generateShuffledPlaylist(playlist, currentSong || undefined));
    } else if (mode !== 'random') {
      setShuffledPlaylist([]);
    }
  };
  
  // 播放列表管理函数
  const addToPlaylist = (song: Song) => {
    const songWithCover = song.coverImage ? { ...song } : enrichSongWithAlbum(song, currentAlbum ?? undefined);
    if (!playlist.find((s) => s.id === songWithCover.id)) {
      setPlaylist([...playlist, songWithCover]);
    }
  };

  const removeFromPlaylist = (songId: string) => {
    const newPlaylist = playlist.filter(s => s.id !== songId);
    setPlaylist(newPlaylist);
    
    // 如果删除的是当前播放的歌曲，停止播放
    if (currentSong?.id === songId) {
      stopMusic();
      setCurrentPlaylistIndex(-1);
    } else if (currentPlaylistIndex > newPlaylist.length - 1) {
      // 调整当前索引
      setCurrentPlaylistIndex(newPlaylist.length - 1);
    }
  };

  const clearPlaylist = () => {
    setPlaylist([]);
    setCurrentPlaylistIndex(-1);
    stopMusic();
  };

  const playFromPlaylist = (index: number) => {
    if (index >= 0 && index < playlist.length) {
      const song = playlist[index];
      playSpecificSong(song, index);
    }
  };

  const addAlbumToPlaylist = (album: Album) => {
    const normalizedAlbum = enrichAlbumSongs(album);
    const newSongs = normalizedAlbum.songs.filter((song) =>
      !playlist.find((s) => s.id === song.id)
    );
    if (newSongs.length > 0) {
      setPlaylist([...playlist, ...newSongs]);
    }
  };
  
  const showPlayer = () => setIsPlayerVisible(true);
  const hidePlayer = () => setIsPlayerVisible(false);
  const togglePlayer = () => setIsPlayerVisible(!isPlayerVisible);
  
  const showPlaylist = () => setIsPlaylistVisible(true);
  const hidePlaylist = () => setIsPlaylistVisible(false);
  const togglePlaylist = () => setIsPlaylistVisible(!isPlaylistVisible);
  
  const setAlbums = (newAlbums: Album[]) => {
    setAlbumsState(newAlbums.map(enrichAlbumSongs));
  };
  
  const loadAlbums = async () => {
    try {
      // 先尝试加载静态专辑数据
      const response = await fetch('/data/albums.json');
      if (response.ok) {
        const data = await response.json();
        const normalizedAlbums = (data.albums as Album[]).map(enrichAlbumSongs);
        setAlbumsState(normalizedAlbums);
      } else {
        console.error('无法加载专辑数据');
      }
    } catch (error) {
      console.error('加载专辑失败:', error);
      // 如果无法加载JSON文件，使用硬编码数据
      const fallbackAlbums: Album[] = [
        {
          id: 'demo',
          name: '演示专辑',
          year: '2025',
          songs: [
            {
              id: 'demo-1',
              title: '演示歌曲',
              album: '演示专辑',
              filePath: '/music/demo.mp3'
            }
          ]
        }
      ];
      setAlbumsState(fallbackAlbums.map(enrichAlbumSongs));
    }
  };
  
  return (
    <MusicContext.Provider value={{
      currentSong,
      isPlaying,
      currentTime,
      duration,
      volume,
      isPlayerVisible,
      playMode,
      albums,
      currentAlbum,
      playlist,
      currentPlaylistIndex,
      isPlaylistVisible,
      playSong,
      pauseMusic,
      resumeMusic,
      stopMusic,
      nextSong,
      previousSong,
      setVolume,
      seekTo,
      setPlayMode,
      addToPlaylist,
      removeFromPlaylist,
      clearPlaylist,
      playFromPlaylist,
      addAlbumToPlaylist,
      showPlayer,
      hidePlayer,
      togglePlayer,
      showPlaylist,
      hidePlaylist,
      togglePlaylist,
      setAlbums,
      loadAlbums,
      forcePlayNext
    }}>
      {children}
    </MusicContext.Provider>
  );
};
