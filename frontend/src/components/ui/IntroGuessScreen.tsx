import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { buildApiUrl } from '@/config/api';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBubble, setShowBubble] = useState(false);

  // 音频播放相关
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playStartTime, setPlayStartTime] = useState<number | null>(null);
  const [answerTime, setAnswerTime] = useState<number | null>(null);

  useEffect(() => {
    loadQuestion();
  }, [gameId]);

  // 音频时间更新
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // 10秒后自动停止
      if (audio.currentTime >= 10) {
        audio.pause();
        setIsPlaying(false);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // 气泡反馈自动消散
  useEffect(() => {
    if (showBubble) {
      const timer = setTimeout(() => {
        setShowBubble(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showBubble]);

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
      setCurrentTime(0);
      setPlayStartTime(null);
      setAnswerTime(null);
      setTotalQuestions(totalQuestions + 1);

      // 重置音频
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.pause();
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
      // 只允许从开始播放一次，设置起始时间
      if (currentTime === 0) {
        setPlayStartTime(Date.now());
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const resetAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    setPlayStartTime(null);
    setAnswerTime(null);
  };

  const handleAnswerSelect = (answer: string) => {
    if (!showResult && !selectedAnswer) {
      setSelectedAnswer(answer);
      // 记录答题时间
      if (playStartTime) {
        setAnswerTime(Date.now() - playStartTime);
      }
    }
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !question) return;

    const correct = selectedAnswer === question.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);
    setShowBubble(true);

    // 暂停音频
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    // 计算分数：根据答题时间
    if (correct) {
      let points = 10;
      if (answerTime !== null) {
        const secondsElapsed = answerTime / 1000;
        // 前1秒：10分，10秒后：5分，中间线性递减
        if (secondsElapsed <= 1) {
          points = 10;
        } else if (secondsElapsed >= 10) {
          points = 5;
        } else {
          // 线性递减：10 - (secondsElapsed - 1) * 5 / 9
          points = Math.round(10 - (secondsElapsed - 1) * 5 / 9);
        }
      }
      setScore(score + points);
    }
  };

  const handleNextQuestion = () => {
    if (totalQuestions < 10) {
      loadQuestion();
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
      'min-h-screen rounded-2xl p-8 transition-colors',
      isLight ? 'bg-gray-50' : 'bg-black/40 backdrop-blur-sm'
    )}>
      {/* 标题和进度 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className={cn(
            'text-3xl font-bebas tracking-wider mb-2',
            isLight ? 'text-gray-900' : 'text-white'
          )}>
            {gameTitle}
          </h1>
          <p className={isLight ? 'text-gray-600' : 'text-gray-400'}>
            {totalQuestions}/10 · 总分：{score}
          </p>
        </div>
        <button
          onClick={handleBackClick}
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

      {question && (
        <motion.div
          key={`question-${question.song_id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-8"
        >
          {/* 音频播放器 */}
          <div className={cn(
            'rounded-xl p-8 space-y-4',
            isLight
              ? 'bg-white border border-gray-200'
              : 'bg-black/60 border border-wangfeng-purple/30'
          )}>
            <h2 className={cn(
              'text-lg font-semibold',
              isLight ? 'text-gray-900' : 'text-white'
            )}>
              听前奏，猜歌名 🎵
            </h2>

            {/* 进度条 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-2">
                <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>
                  {currentTime.toFixed(1)}s / 10s
                </span>
                <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>
                  {answerTime ? `答题用时: ${(answerTime / 1000).toFixed(1)}s` : '等待答题'}
                </span>
              </div>
              <div className={cn(
                'h-2 rounded-full overflow-hidden',
                isLight ? 'bg-gray-300' : 'bg-gray-700'
              )}>
                <motion.div
                  className="h-full bg-gradient-to-r from-wangfeng-purple to-pink-500"
                  initial={{ width: '0%' }}
                  animate={{ width: `${(currentTime / 10) * 100}%` }}
                  transition={{ duration: 0.1, ease: 'linear' }}
                />
              </div>
            </div>

            {/* 隐藏的音频元素 */}
            <audio
              ref={audioRef}
              src={question.audio_url}
              crossOrigin="anonymous"
              onError={() => setError('音频加载失败')}
            />

            {/* 控制按钮 */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={playAudio}
                disabled={showResult}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all',
                  showResult
                    ? 'opacity-50 cursor-not-allowed'
                    : isLight
                    ? 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80'
                    : 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80'
                )}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>暂停</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>播放</span>
                  </>
                )}
              </button>

              <button
                onClick={resetAudio}
                disabled={showResult}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all',
                  showResult
                    ? 'opacity-50 cursor-not-allowed'
                    : isLight
                    ? 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                )}
              >
                <RotateCcw className="w-4 h-4" />
                <span>重置</span>
              </button>
            </div>
          </div>

          {/* 选项 */}
          <div className="space-y-3">
            <h3 className={cn(
              'text-sm font-semibold',
              isLight ? 'text-gray-600' : 'text-gray-400'
            )}>
              选择正确的歌名：
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'p-4 rounded-lg text-left font-semibold transition-all border-2 flex items-center gap-3',
                      showCorrect
                        ? 'bg-green-500/20 border-green-500 text-green-600'
                        : showIncorrect
                        ? 'bg-red-500/20 border-red-500 text-red-600'
                        : isSelected
                        ? isLight
                          ? 'bg-wangfeng-purple/20 border-wangfeng-purple text-gray-900'
                          : 'bg-wangfeng-purple/20 border-wangfeng-purple text-white'
                        : isLight
                        ? 'bg-white border-gray-300 text-gray-900 hover:border-wangfeng-purple'
                        : 'bg-black/30 border-gray-600 text-gray-300 hover:border-wangfeng-purple'
                    )}
                  >
                    {showCorrect ? (
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    ) : showIncorrect ? (
                      <XCircle className="w-5 h-5 flex-shrink-0" />
                    ) : null}
                    <span>{option}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* 提交按钮 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {!showResult ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className={cn(
                  'w-full py-4 rounded-lg font-bold text-lg transition-all',
                  selectedAnswer
                    ? isLight
                      ? 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80'
                      : 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80'
                    : 'opacity-50 cursor-not-allowed bg-gray-500 text-white'
                )}
              >
                提交答案
              </button>
            ) : (
              <div className="space-y-4">
                <div className={cn(
                  'p-4 rounded-lg text-center text-lg font-bold',
                  isCorrect
                    ? 'bg-green-500/20 text-green-600 border border-green-500'
                    : 'bg-red-500/20 text-red-600 border border-red-500'
                )}>
                  {isCorrect ? '✓ 答对了！' : '✗ 答错了'}
                  {isCorrect && answerTime && (
                    <p className="text-sm mt-2">
                      答题用时: {(answerTime / 1000).toFixed(1)}秒
                    </p>
                  )}
                </div>
                {totalQuestions < 10 ? (
                  <button
                    onClick={handleNextQuestion}
                    className={cn(
                      'w-full py-4 rounded-lg font-bold text-lg transition-all',
                      isLight
                        ? 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80'
                        : 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/80'
                    )}
                  >
                    下一题
                  </button>
                ) : (
                  <button
                    onClick={onBack}
                    className={cn(
                      'w-full py-4 rounded-lg font-bold text-lg transition-all',
                      isLight
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    )}
                  >
                    完成游戏 (总分: {score})
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* 气泡反馈 */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <div className={cn(
              'text-6xl font-bold',
              isCorrect ? 'text-green-500' : 'text-red-500'
            )}>
              {isCorrect ? '✓' : '✗'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntroGuessScreen;
