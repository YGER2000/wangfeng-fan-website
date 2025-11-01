import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, RotateCcw, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface GameQuestion {
  type: string;
  lyrics?: string;
  incomplete_lyrics?: string;
  full_line?: string;
  options: string[];
  correct_answer: string;
  song_title?: string;
  song_id: string;
  album?: string;
  question_type?: string;
  lyric_hint?: string;
}

interface GameScreenProps {
  gameId: string;
  gameTitle: string;
  onBack: () => void;
}

const GameScreen = ({ gameId, gameTitle, onBack }: GameScreenProps) => {
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

  useEffect(() => {
    loadQuestion();
  }, [gameId]);

  // 气泡反馈自动消散
  useEffect(() => {
    if (showBubble) {
      const timer = setTimeout(() => {
        setShowBubble(false);
      }, 2000); // 2秒后消散
      return () => clearTimeout(timer);
    }
  }, [showBubble]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:1994/api/games/${gameId}/question`);

      if (!response.ok) {
        throw new Error('加载问题失败');
      }

      const data = await response.json();
      setQuestion(data);
      setSelectedAnswer(null);
      setShowResult(false);
      setTotalQuestions(totalQuestions + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载问题失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (!showResult) {
      setSelectedAnswer(answer);
    }
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !question) return;

    const correct = selectedAnswer === question.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);
    setShowBubble(true);

    if (correct) {
      setScore(score + 10);
    }
  };

  const handleNextQuestion = () => {
    loadQuestion();
  };

  const renderGameContent = () => {
    if (loading) {
      return (
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
      );
    }

    if (error) {
      return (
        <div className={cn(
          'text-center py-20 rounded-lg border',
          isLight
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        )}>
          <p className="text-lg font-semibold">{error}</p>
          <button
            onClick={loadQuestion}
            className="mt-4 px-4 py-2 bg-wangfeng-purple text-white rounded-lg hover:bg-wangfeng-dark"
          >
            重试
          </button>
        </div>
      );
    }

    if (!question) {
      return <div>加载失败</div>;
    }

    return (
      <>
        {/* 问题内容 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            'rounded-lg p-6 mb-8 border',
            isLight
              ? 'bg-gray-50 border-gray-200'
              : 'bg-black/40 border-wangfeng-purple/30'
          )}
        >
          {question.type === 'lyrics_guesser' && (
            <div>
              <h3 className={cn(
                'text-lg font-semibold mb-4',
                isLight ? 'text-gray-900' : 'text-white'
              )}>
                听这些歌词，猜出歌曲名称：
              </h3>
              <div className={cn(
                'p-4 rounded-lg border-l-4 border-wangfeng-purple italic text-center',
                isLight
                  ? 'bg-white border-wangfeng-purple text-gray-700'
                  : 'bg-wangfeng-purple/5 border-wangfeng-purple text-gray-300'
              )}>
                {question.lyrics}
              </div>
            </div>
          )}

          {question.type === 'fill_lyrics' && (
            <div>
              <h3 className={cn(
                'text-lg font-semibold mb-4',
                isLight ? 'text-gray-900' : 'text-white'
              )}>
                填空：请选择正确的词语
              </h3>
              <div className={cn(
                'p-4 rounded-lg border-l-4 border-wangfeng-purple text-center text-lg',
                isLight
                  ? 'bg-white border-wangfeng-purple text-gray-700'
                  : 'bg-wangfeng-purple/5 border-wangfeng-purple text-gray-300'
              )}>
                <span className="font-semibold">{question.incomplete_lyrics}</span>
              </div>
            </div>
          )}

          {question.type === 'song_matcher' && (
            <div>
              <h3 className={cn(
                'text-lg font-semibold mb-4',
                isLight ? 'text-gray-900' : 'text-white'
              )}>
                这首歌来自哪个专辑?
              </h3>
              <div className={cn(
                'p-4 rounded-lg border-l-4 border-wangfeng-purple',
                isLight
                  ? 'bg-white border-wangfeng-purple text-gray-700'
                  : 'bg-wangfeng-purple/5 border-wangfeng-purple text-gray-300'
              )}>
                <p className="font-semibold mb-2">{question.song_title}</p>
                <p className="text-sm italic">"{question.lyric_hint}"</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* 选项 */}
        <div className="grid gap-3 mb-8">
          <AnimatePresence>
            {question.options.map((option, index) => (
              <motion.button
                key={option}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleAnswerSelect(option)}
                disabled={showResult}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left font-semibold',
                  selectedAnswer === option
                    ? 'border-wangfeng-purple bg-wangfeng-purple/10'
                    : isLight
                      ? 'border-gray-300 hover:border-wangfeng-purple bg-white'
                      : 'border-wangfeng-purple/30 hover:border-wangfeng-purple/50 bg-black/20',
                  showResult && {
                    'border-green-500 bg-green-500/10': option === question.correct_answer,
                    'border-red-500 bg-red-500/10': option === selectedAnswer && !isCorrect,
                  }
                )}
              >
                {option}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* 结果显示 - 浮动气泡 */}
        <AnimatePresence>
          {showBubble && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                top: '80px',
                left: '50%',
                translateX: '-50%',
                zIndex: 50,
              }}
              className={cn(
                'px-6 py-4 rounded-full shadow-lg flex items-center gap-3 font-semibold whitespace-nowrap',
                isCorrect
                  ? isLight
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-green-500/20 border border-green-500/30 text-green-300'
                  : isLight
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-red-500/20 border border-red-500/30 text-red-300'
              )}
            >
              <span className="text-lg">{isCorrect ? '✓' : '✗'}</span>
              <span>{isCorrect ? '回答正确！' : '回答错误'}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 错误答案的解释 - 浮动卡片 */}
        <AnimatePresence>
          {showResult && !isCorrect && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              style={{
                position: 'fixed',
                top: '160px',
                left: '50%',
                translateX: '-50%',
                zIndex: 50,
              }}
              className={cn(
                'px-6 py-3 rounded-lg shadow-lg text-sm text-center',
                isLight
                  ? 'bg-blue-50 border border-blue-200 text-blue-700'
                  : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
              )}
            >
              正确答案：<span className="font-semibold text-wangfeng-purple">{question?.correct_answer}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 按钮 */}
        <div className="flex gap-4">
          {!showResult ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className={cn(
                'flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2',
                selectedAnswer
                  ? 'bg-wangfeng-purple text-white hover:bg-wangfeng-dark'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              )}
            >
              提交答案 <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="flex-1 py-3 rounded-lg font-semibold bg-wangfeng-purple text-white hover:bg-wangfeng-dark transition-all flex items-center justify-center gap-2"
            >
              下一题 <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* 头部 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={cn(
                'p-2 rounded-lg transition-all flex items-center gap-2',
                isLight
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              )}
              title="返回游戏活动主页"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-semibold">返回</span>
            </button>
            <div>
              <h2 className={cn(
                'text-3xl font-bebas tracking-wider',
                isLight ? 'text-gray-900' : 'text-white'
              )}>
                {gameTitle}
              </h2>
            </div>
          </div>
          <div className={cn(
            'text-right',
            isLight ? 'text-gray-600' : 'text-gray-400'
          )}>
            <p className="text-sm">总分数: <span className="font-semibold text-wangfeng-purple">{score}</span></p>
            <p className="text-sm">已做题: {totalQuestions}</p>
          </div>
        </div>

        {/* 进度条 */}
        <div className={cn(
          'h-1 rounded-full overflow-hidden',
          isLight ? 'bg-gray-200' : 'bg-gray-700'
        )}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(totalQuestions * 10) % 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-wangfeng-purple to-wangfeng-light"
          />
        </div>
      </div>

      {/* 游戏内容 */}
      {renderGameContent()}
    </motion.div>
  );
};

export default GameScreen;
