import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import GameCard from '@/components/ui/GameCard';
import PollCard from '@/components/ui/PollCard';
import GameScreen from '@/components/ui/GameScreen';

interface PollData {
  id: string;
  title: string;
  description: string;
  status: 'upcoming' | 'active' | 'ended';
  total_votes: number;
  options: Array<{
    id: string;
    label: string;
    image_url?: string;
    vote_count: number;
  }>;
  start_date: string;
  end_date: string;
}

const GameActivity = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [polls, setPolls] = useState<PollData[]>([]);
  const [pollsLoading, setPolsLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());

  // 游戏列表数据
  const games = [
    {
      id: 'lyrics_guesser',
      title: '歌词猜歌名',
      description: '根据歌词片段，猜出汪峰的歌曲名称。需要熟悉汪峰的歌词才能快速作答。',
      icon: '🎵',
      difficulty: 'easy' as const,
    },
    {
      id: 'fill_lyrics',
      title: '填词游戏',
      description: '在缺少的歌词位置填入正确的词语。考查对歌词的深入了解。',
      icon: '✏️',
      difficulty: 'medium' as const,
    },
    {
      id: 'song_matcher',
      title: '歌曲配对',
      description: '根据歌词提示，判断歌曲所属的专辑。适合专辑迷。',
      icon: '🎸',
      difficulty: 'medium' as const,
    },
  ];

  // 加载投票列表
  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      setPolsLoading(true);
      const response = await fetch('http://localhost:1994/api/polls');
      if (response.ok) {
        const data = await response.json();
        setPolls(data || []);
      }
    } catch (error) {
      console.error('加载投票失败:', error);
    } finally {
      setPolsLoading(false);
    }
  };

  const handleGamePlay = (gameId: string) => {
    setActiveGameId(gameId);
  };

  const handleBackFromGame = () => {
    setActiveGameId(null);
  };

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      const response = await fetch(`http://localhost:1994/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poll_id: pollId,
          option_id: optionId,
        }),
      });

      if (response.ok) {
        setUserVotes(new Set([...userVotes, pollId]));
        // 重新加载投票数据
        loadPolls();
      } else if (response.status === 400) {
        const error = await response.json();
        alert(error.detail || '您已经投过票了');
      }
    } catch (error) {
      console.error('投票失败:', error);
      alert('投票失败，请重试');
    }
  };

  // 如果正在玩游戏，显示游戏屏幕
  if (activeGameId) {
    const game = games.find(g => g.id === activeGameId);
    return (
      <div className="min-h-screen bg-transparent text-white py-20">
        <div className="container mx-auto px-4">
          <GameScreen
            gameId={activeGameId}
            gameTitle={game?.title || '游戏'}
            onBack={handleBackFromGame}
          />
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
              游戏 <span className="text-wangfeng-purple">活动</span>
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
            Games & Activities on Wang Feng
          </h2>
        </motion.div>

        {/* 常驻游戏区块 */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <div className="mb-8">
            <h2 className={cn(
              'text-3xl font-bebas tracking-wider mb-2',
              isLight ? 'text-gray-900' : 'text-white'
            )}>
              常驻游戏
            </h2>
            <p className={cn(
              'text-lg',
              isLight ? 'text-gray-600' : 'text-gray-400'
            )}>
              享受与汪峰歌曲相关的多种趣味游戏
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <GameCard
                  id={game.id}
                  title={game.title}
                  description={game.description}
                  icon={game.icon}
                  difficulty={game.difficulty}
                  onPlay={handleGamePlay}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 时限活动/投票区块 */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="mb-8">
            <h2 className={cn(
              'text-3xl font-bebas tracking-wider mb-2',
              isLight ? 'text-gray-900' : 'text-white'
            )}>
              时限活动
            </h2>
            <p className={cn(
              'text-lg',
              isLight ? 'text-gray-600' : 'text-gray-400'
            )}>
              参与投票，与粉丝一起评选最喜欢的歌曲和专辑
            </p>
          </div>

          {pollsLoading ? (
            <div className="text-center py-20">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple"></div>
                <p className={cn(
                  'mt-4',
                  isLight ? 'text-gray-600' : 'text-gray-400'
                )}>
                  加载中...
                </p>
              </div>
            </div>
          ) : polls.length === 0 ? (
            <div className={cn(
              'text-center py-20 rounded-lg border',
              isLight
                ? 'bg-gray-50 border-gray-200 text-gray-600'
                : 'bg-black/40 border-wangfeng-purple/30 text-gray-400'
            )}>
              <p>暂无投票活动</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {polls.map((poll, index) => (
                <motion.div
                  key={poll.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <PollCard
                    id={poll.id}
                    title={poll.title}
                    description={poll.description}
                    status={poll.status}
                    totalVotes={poll.total_votes}
                    options={poll.options.map(opt => ({
                      id: opt.id,
                      label: opt.label,
                      image_url: opt.image_url,
                      vote_count: opt.vote_count,
                      percentage: Math.round(
                        (opt.vote_count / Math.max(poll.total_votes, 1)) * 100
                      ),
                    }))}
                    onVote={handleVote}
                    isVoted={userVotes.has(poll.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default GameActivity;
