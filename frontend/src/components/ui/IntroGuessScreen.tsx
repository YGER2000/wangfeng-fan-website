import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { buildApiUrl } from '@/config/api';
import GameResultModal from './GameResultModal';

interface GameQuestion {
  type: string;
  song_title: string;
  audio_url: string;
  duration: number;
  options: string[];
  correct_answer: string;
  song_id: string;
  album: string;
}

interface IntroGuessScreenProps {
  gameId: string;
  gameTitle: string;
  difficulty: 'easy' | 'hard';
  onBack: () => void;
}

const IntroGuessScreen = ({ gameId, gameTitle, difficulty, onBack }: IntroGuessScreenProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const [question, setQuestion] = useState<GameQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);  // 新增：记录每题的答题用时

  // 音频播放相关
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playStartTime, setPlayStartTime] = useState<number | null>(null);
  const [answerTime, setAnswerTime] = useState<number | null>(null);

  // 新增：是否播放过前奏（答题后播放全曲）
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isPlayingFullSong, setIsPlayingFullSong] = useState(false);

  // 新增：游戏是否完成
  const [gameCompleted, setGameCompleted] = useState(false);

  useEffect(() => {
    loadQuestion();
  }, [gameId]);

  // 音频时间更新
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // 未答题时：10秒后自动停止（只播放前奏）
      if (!hasAnswered && audio.currentTime >= 10) {
        audio.pause();
        setIsPlaying(false);
      }
      // 已答题时：播放整首歌，正常结束
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setIsPlayingFullSong(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [hasAnswered]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(buildApiUrl(`/games/${gameId}/question?difficulty=${difficulty}`));

      if (!response.ok) {
        throw new Error('加载问题失败');
      }

      const data = await response.json();
      setQuestion(data);
      setSelectedAnswer(null);
      setShowResult(false);
      setHasAnswered(false);
      setIsPlayingFullSong(false);
      setCurrentTime(0);
      setPlayStartTime(null);
      setAnswerTime(null);
      setTotalQuestions(totalQuestions + 1);

      // 重置音频并预加载
      if (audioRef.current) {
        audioRef.current.src = data.audio_url;
        audioRef.current.currentTime = 0;
        audioRef.current.pause();
        // 预加载音频以消除播放延迟
        audioRef.current.load();
      }
      setIsPlaying(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载问题失败');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // 未答题时：从开始播放（前奏）
      if (!hasAnswered && currentTime === 0) {
        setPlayStartTime(Date.now());
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult || selectedAnswer) return;

    setSelectedAnswer(answer);
    const correct = answer === question?.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);

    // 记录答题时间
    const timeTaken = playStartTime ? Date.now() - playStartTime : 0;
    setAnswerTime(timeTaken);

    // 暂停当前播放
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    // 计算答题用时（秒），错误和超时都算10秒
    const responseTimeSeconds = correct
      ? Math.min(timeTaken / 1000, 10)  // 正确答案：记录实际时间，最多10秒
      : 10;  // 错误答案：算10秒

    setResponseTimes([...responseTimes, responseTimeSeconds]);

    // 计算分数
    if (correct) {
      let points = 10;
      const secondsElapsed = timeTaken / 1000;
      if (secondsElapsed <= 1) {
        points = 10;
      } else if (secondsElapsed >= 10) {
        points = 5;
      } else {
        points = Math.round(10 - (secondsElapsed - 1) * 5 / 9);
      }
      setScore(score + points);
      setCorrectAnswers(correctAnswers + 1);
    }

    // 标记已答题，准备播放全曲
    setHasAnswered(true);
    // 重置音频到开始
    audioRef.current!.currentTime = 0;
    // 自动开始播放整首歌
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
        setIsPlayingFullSong(true);
      }
    }, 500);
  };

  const handleNextQuestion = () => {
    if (totalQuestions < 10) {
      loadQuestion();
    } else {
      // 游戏完成，显示结果模态框
      setGameCompleted(true);
    }
  };

  const handleBackClick = () => {
    onBack();
  };

  if (loading) {
    return (
      <div className={cn(
        'min-h-screen flex items-center justify-center rounded-2xl p-8',
        isLight ? 'bg-gray-100' : 'bg-black/40'
      )}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-wangfeng-purple border-t-transparent mx-auto mb-4"></div>
          <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>加载游戏中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        'min-h-screen flex items-center justify-center rounded-2xl p-8',
        isLight ? 'bg-gray-100' : 'bg-black/40'
      )}>
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={onBack}
            className={cn(
              'px-6 py-3 rounded-lg font-semibold transition-all',
              isLight
                ? 'bg-gray-900 text-white hover:bg-gray-700'
                : 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80'
            )}
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'min-h-screen p-6 transition-colors flex flex-col',
      isLight ? 'bg-gray-50' : 'bg-black/40 backdrop-blur-sm'
    )}>
      {/* 导航栏 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className={cn(
            'text-4xl font-bebas tracking-wider mb-2',
            isLight ? 'text-gray-900' : 'text-white'
          )}>
            {gameTitle}
          </h1>
          <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>
            {totalQuestions}/10 · 总分：{score}
          </p>
        </div>
        <button
          onClick={onBack}
          className={cn(
            'px-6 py-3 rounded-full font-semibold transition-all',
            isLight
              ? 'bg-gray-300 text-gray-900 hover:bg-gray-400'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          )}
        >
          返回
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-wangfeng-purple border-t-transparent mx-auto mb-4"></div>
            <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>加载游戏中...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={onBack}
              className={cn(
                'px-6 py-3 rounded-lg font-semibold transition-all',
                isLight
                  ? 'bg-gray-900 text-white hover:bg-gray-700'
                  : 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80'
              )}
            >
              返回
            </button>
          </div>
        </div>
      ) : question ? (
        <motion.div
          key={`question-${question.song_id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          {/* 时间轴 - 替代播放按钮 */}
          <div className={cn(
            'rounded-xl p-6 mb-8',
            isLight
              ? 'bg-white border border-gray-200'
              : 'bg-black/60 border border-wangfeng-purple/30'
          )}>
            <h2 className={cn(
              'text-lg font-semibold mb-4',
              isLight ? 'text-gray-900' : 'text-white'
            )}>
              听前奏，猜歌名 🎵
            </h2>

            {/* 时间进度条 */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>
                  {currentTime.toFixed(1)}s / {hasAnswered ? '全曲' : '10s'}
                </span>
              </div>
              <div className={cn(
                'h-3 rounded-full overflow-hidden',
                isLight ? 'bg-gray-300' : 'bg-gray-700'
              )}>
                <motion.div
                  className="h-full bg-gradient-to-r from-wangfeng-purple to-pink-500"
                  initial={{ width: '0%' }}
                  animate={{ width: hasAnswered ? `${(currentTime / 200) * 100}%` : `${(currentTime / 10) * 100}%` }}
                  transition={{ duration: 0.1, ease: 'linear' }}
                />
              </div>
            </div>

            {/* 状态文字 - 统一框 */}
            <div className={cn(
              'p-4 rounded-lg text-center font-semibold min-h-20 flex items-center justify-center',
              showResult
                ? isCorrect
                  ? 'bg-green-500/20 text-green-600 border border-green-500'
                  : 'bg-red-500/20 text-red-600 border border-red-500'
                : isLight
                ? 'bg-gray-100 text-gray-700'
                : 'bg-gray-700 text-gray-300'
            )}>
              {!showResult ? (
                // 未答题状态：显示当前耗时或正在播放整首歌
                <span>
                  {isPlayingFullSong ? '🎵 正在播放整首歌...' : `⏱️ 当前耗时: ${currentTime.toFixed(1)}s`}
                </span>
              ) : (
                // 已答题状态：显示答题结果
                <div className="text-center w-full">
                  <div className="text-lg mb-1">
                    {isCorrect ? '✓ 答对了！' : '✗ 答错了'}
                  </div>
                  <div className="text-sm leading-tight">
                    {isCorrect ? (
                      <>
                        用时: {(answerTime! / 1000).toFixed(1)}s ·
                        <span className="text-green-400 ml-1">
                          + {10 - Math.max(0, Math.round((answerTime! / 1000 - 1) * 5 / 9))} 分
                        </span>
                      </>
                    ) : (
                      `正确答案: ${question.correct_answer}`
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 隐藏的音频元素 */}
            <audio
              ref={audioRef}
              src={question.audio_url}
              crossOrigin="anonymous"
              preload="auto"
              onError={() => setError('音频加载失败')}
            />
          </div>

          {/* 选项 - 纵向排列 */}
          <div className="space-y-3 mb-8">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === question.correct_answer;
              const showCorrect = showResult && isCorrectOption;
              const showIncorrect = showResult && isSelected && !isCorrectOption;

              return (
                <motion.button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showResult}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'w-full p-4 rounded-lg text-center font-semibold transition-all border-2 flex items-center justify-center gap-3',
                    showCorrect
                      ? 'bg-green-500/20 border-green-500 text-green-600'
                      : showIncorrect
                      ? 'bg-red-500/20 border-red-500 text-red-600'
                      : isSelected
                      ? isLight
                        ? 'bg-wangfeng-purple/20 border-wangfeng-purple text-gray-900'
                        : 'bg-wangfeng-purple/20 border-wangfeng-purple text-white'
                      : isLight
                      ? 'bg-white border-gray-300 text-gray-900 hover:border-wangfeng-purple hover:bg-gray-50'
                      : 'bg-black/30 border-gray-600 text-gray-300 hover:border-wangfeng-purple hover:bg-black/40'
                  )}
                >
                  {showCorrect ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  ) : showIncorrect ? (
                    <XCircle className="w-5 h-5 flex-shrink-0" />
                  ) : null}
                  <span className="flex-1 text-center">{option}</span>
                </motion.button>
              );
            })}
          </div>

          {/* 底部按钮 */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => {
              if (!showResult) {
                playAudio();
              } else {
                handleNextQuestion();
              }
            }}
            disabled={false}
            className={cn(
              'w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2',
              isLight
                ? 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80'
                : 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80'
            )}
          >
            {!showResult ? (
              <>
                <Play className="w-5 h-5" />
                {isPlaying ? '暂停' : '开始播放'}
              </>
            ) : totalQuestions >= 10 ? (
              `完成游戏 (总分: ${score})`
            ) : (
              <>
                <Play className="w-5 h-5" />
                下一题
              </>
            )}
          </motion.button>
        </motion.div>
      ) : null}

      {/* 游戏完成时显示结果模态框 */}
      <AnimatePresence>
        {gameCompleted && (
          <GameResultModal
            gameId={gameId}
            gameTitle={gameTitle}
            score={score}
            totalQuestions={totalQuestions}
            correctAnswers={correctAnswers}
            difficulty={difficulty}
            responseTimes={responseTimes}
            onClose={() => {
              setGameCompleted(false);
              onBack();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntroGuessScreen;
