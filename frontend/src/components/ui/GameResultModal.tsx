import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Trophy, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { buildApiUrl } from '@/config/api';

interface GameResultModalProps {
  gameId: string;
  gameTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  difficulty: 'easy' | 'hard';
  responseTimes: number[];  // 新增：每题的答题用时数组
  onClose: () => void;
}

interface LeaderboardEntry {
  rank: number;
  player_name: string;
  score: number;
  accuracy: number;
  avg_response_time?: number;  // 新增：平均答题用时
  created_at: string;
}

const GameResultModal = ({
  gameId,
  gameTitle,
  score,
  totalQuestions,
  correctAnswers,
  difficulty,
  responseTimes,
  onClose,
}: GameResultModalProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandLeaderboard, setExpandLeaderboard] = useState(false);

  const accuracy = correctAnswers / totalQuestions * 100;

  // 计算平均答题用时
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  const handleSubmitScore = async () => {
    if (!playerName.trim()) {
      setError('请输入玩家名字');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        buildApiUrl(`/games/${gameId}/submit-score`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game_id: gameId,
            score,
            total_questions: totalQuestions,
            correct_answers: correctAnswers,
            player_name: playerName,
            difficulty,
            avg_response_time: avgResponseTime,  // 新增：平均答题用时
          }),
        }
      );

      if (!response.ok) {
        throw new Error('提交分数失败');
      }

      const data = await response.json();
      setPlayerRank(data.rank);
      setLeaderboard(data.leaderboard);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交分数失败');
      console.error('提交分数失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={cn(
          'w-full max-w-2xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto',
          isLight ? 'bg-white text-gray-900' : 'bg-black/80 text-white border border-wangfeng-purple/30'
        )}
      >
        {!submitted ? (
          // 提交分数界面
          <div className="space-y-8">
            {/* 标题 */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bebas tracking-wider">游戏完成！</h2>
              <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>
                {gameTitle} · {difficulty === 'easy' ? '简单模式' : '困难模式'}
              </p>
            </div>

            {/* 成绩统计 */}
            <div className={cn(
              'rounded-lg p-6 space-y-4',
              isLight ? 'bg-gray-50' : 'bg-gray-900'
            )}>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-wangfeng-purple">{score}</div>
                  <div className={isLight ? 'text-gray-600' : 'text-gray-400'}>总分</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{correctAnswers}/{totalQuestions}</div>
                  <div className={isLight ? 'text-gray-600' : 'text-gray-400'}>正确答案</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{accuracy.toFixed(1)}%</div>
                  <div className={isLight ? 'text-gray-600' : 'text-gray-400'}>正确率</div>
                </div>
              </div>
            </div>

            {/* 玩家名字输入 */}
            <div className="space-y-3">
              <label className="block font-semibold">输入你的大名</label>
              <input
                type="text"
                maxLength={100}
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmitScore();
                  }
                }}
                placeholder="请输入你的名字（可选，不填为匿名玩家）"
                className={cn(
                  'w-full px-4 py-3 rounded-lg border-2 outline-none transition-colors',
                  isLight
                    ? 'border-gray-300 bg-white focus:border-wangfeng-purple'
                    : 'border-gray-700 bg-gray-900 focus:border-wangfeng-purple'
                )}
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            {/* 提交按钮 */}
            <button
              onClick={handleSubmitScore}
              disabled={loading}
              className={cn(
                'w-full py-3 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2',
                loading
                  ? 'opacity-50 cursor-not-allowed'
                  : isLight
                  ? 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80'
                  : 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80'
              )}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5" />
                  提交分数
                </>
              )}
            </button>
          </div>
        ) : (
          // 排行榜界面
          <div className="space-y-6">
            {/* 标题 */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bebas tracking-wider">🏆 排行榜</h2>
              <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>
                {gameTitle} · {difficulty === 'easy' ? '简单模式' : '困难模式'}
              </p>
            </div>

            {/* 当前玩家排名展示 */}
            {playerRank && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'p-4 rounded-lg border-2',
                  playerRank <= 3
                    ? isLight
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-yellow-900/20 border-yellow-500'
                    : isLight
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-blue-900/20 border-blue-500'
                )}
              >
                <div className="text-center">
                  <div className="text-sm font-semibold mb-1">
                    {playerRank <= 3 ? '🎉 恭喜！你进入了前三名！' : '你的排名'}
                  </div>
                  <div className="text-2xl font-bold text-wangfeng-purple">
                    第 {playerRank} 名 · 得分 {score}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 排行榜列表 */}
            <div className="space-y-2">
              <button
                onClick={() => setExpandLeaderboard(!expandLeaderboard)}
                className={cn(
                  'w-full flex items-center justify-between p-4 rounded-lg font-semibold transition-colors',
                  isLight
                    ? 'bg-gray-100 hover:bg-gray-200'
                    : 'bg-gray-900 hover:bg-gray-800'
                )}
              >
                <span>前10名排行榜</span>
                <motion.div
                  animate={{ rotate: expandLeaderboard ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.div>
              </button>

              <AnimatePresence>
                {expandLeaderboard && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {leaderboard.map((entry) => (
                      <motion.div
                        key={`${entry.rank}-${entry.created_at}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: entry.rank * 0.05 }}
                        className={cn(
                          'p-4 rounded-lg border flex items-center justify-between',
                          entry.rank === playerRank
                            ? isLight
                              ? 'bg-wangfeng-purple/10 border-wangfeng-purple'
                              : 'bg-wangfeng-purple/20 border-wangfeng-purple'
                            : isLight
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-gray-900/50 border-gray-700'
                        )}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-center font-bold w-8">
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold">{entry.player_name}</div>
                            <div className={cn(
                              'text-xs',
                              isLight ? 'text-gray-600' : 'text-gray-400'
                            )}>
                              {entry.created_at}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-wangfeng-purple">{entry.score}</div>
                          <div className={cn(
                            'text-xs',
                            isLight ? 'text-gray-600' : 'text-gray-400'
                          )}>
                            {entry.accuracy}% 正确
                          </div>
                          {entry.avg_response_time !== undefined && (
                            <div className={cn(
                              'text-xs',
                              isLight ? 'text-gray-600' : 'text-gray-400'
                            )}>
                              {entry.avg_response_time}s 平均用时
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className={cn(
                'w-full py-3 rounded-lg font-bold text-lg transition-all',
                isLight
                  ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              )}
            >
              关闭
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default GameResultModal;
