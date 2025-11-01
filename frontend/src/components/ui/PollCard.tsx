import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface PollOption {
  id: string;
  label: string;
  image_url?: string;
  vote_count: number;
  percentage?: number;
}

interface PollCardProps {
  id: string;
  title: string;
  description?: string;
  status: 'upcoming' | 'active' | 'ended';
  totalVotes: number;
  options: PollOption[];
  timeRemaining?: string;
  onVote: (pollId: string, optionId: string) => Promise<void>;
  isVoted?: boolean;
}

const PollCard = ({
  id,
  title,
  description,
  status,
  totalVotes,
  options,
  timeRemaining,
  onVote,
  isVoted = false,
}: PollCardProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusLabels = {
    upcoming: '即将开始',
    active: '火热进行中',
    ended: '已结束',
  };

  const statusColors = {
    upcoming: 'bg-blue-500/20 text-blue-400',
    active: 'bg-red-500/20 text-red-400',
    ended: 'bg-gray-500/20 text-gray-400',
  };

  const handleVote = async (optionId: string) => {
    if (isVoted || status !== 'active') return;

    setSelectedOption(optionId);
    setIsSubmitting(true);

    try {
      await onVote(id, optionId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxVotes = Math.max(...options.map(o => o.vote_count || 0), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        'rounded-xl border overflow-hidden',
        'transition-all duration-300',
        isLight
          ? 'bg-white border-gray-200'
          : 'bg-black/40 border-wangfeng-purple/30'
      )}
    >
      {/* 头部 */}
      <div className={cn(
        'px-6 py-4 border-b',
        isLight
          ? 'bg-gray-50 border-gray-200'
          : 'bg-black/60 border-wangfeng-purple/20'
      )}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className={cn(
                'text-xl font-semibold',
                isLight ? 'text-gray-900' : 'text-white'
              )}>
                {title}
              </h3>
              <span className={cn(
                'text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap',
                statusColors[status]
              )}>
                {statusLabels[status]}
              </span>
            </div>
            {description && (
              <p className={cn(
                'text-sm',
                isLight ? 'text-gray-600' : 'text-gray-400'
              )}>
                {description}
              </p>
            )}
          </div>
          {timeRemaining && (
            <div className={cn(
              'text-right text-xs whitespace-nowrap',
              isLight ? 'text-gray-500' : 'text-gray-500'
            )}>
              <div>投票: {totalVotes}</div>
              <div>{timeRemaining}</div>
            </div>
          )}
        </div>
      </div>

      {/* 投票选项 */}
      <div className="p-6 space-y-4">
        {options.map((option) => {
          const percentage = maxVotes > 0 ? (option.vote_count / maxVotes) * 100 : 0;
          return (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                  <input
                    type="radio"
                    checked={selectedOption === option.id}
                    onChange={() => handleVote(option.id)}
                    disabled={isVoted || status !== 'active' || isSubmitting}
                    className="w-4 h-4 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {option.image_url && (
                      <img
                        src={option.image_url}
                        alt={option.label}
                        className="w-8 h-8 rounded flex-shrink-0"
                      />
                    )}
                    <span className={cn(
                      'text-sm truncate',
                      isLight ? 'text-gray-700' : 'text-gray-300'
                    )}>
                      {option.label}
                    </span>
                  </div>
                </label>
                <span className={cn(
                  'text-xs ml-2 flex-shrink-0',
                  isLight ? 'text-gray-500' : 'text-gray-500'
                )}>
                  {option.percentage || (totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0)}%
                </span>
              </div>

              {/* 进度条 */}
              <div className={cn(
                'h-2 rounded-full overflow-hidden',
                isLight ? 'bg-gray-200' : 'bg-gray-700'
              )}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-wangfeng-purple to-wangfeng-light"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 提示信息 */}
      {isVoted && (
        <div className={cn(
          'px-6 py-3 border-t text-sm text-center font-semibold',
          isLight
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-green-500/10 border-green-500/20 text-green-400'
        )}>
          ✓ 感谢您的投票！
        </div>
      )}

      {status === 'ended' && (
        <div className={cn(
          'px-6 py-3 border-t text-sm text-center',
          isLight
            ? 'bg-gray-50 border-gray-200 text-gray-600'
            : 'bg-gray-900/20 border-gray-700 text-gray-400'
        )}>
          此投票已结束
        </div>
      )}
    </motion.div>
  );
};

export default PollCard;
