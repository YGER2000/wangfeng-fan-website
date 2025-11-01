import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface GameCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  playCount?: number;
  onPlay: (gameId: string) => void;
}

const GameCard = ({
  id,
  title,
  description,
  icon,
  difficulty,
  playCount = 0,
  onPlay,
}: GameCardProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const difficultyLabels = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };

  const difficultyColors = {
    easy: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    hard: 'bg-red-500/20 text-red-400',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className={cn(
        'relative rounded-xl border overflow-hidden cursor-pointer group',
        'transition-all duration-300 h-full',
        isLight
          ? 'bg-white border-gray-200 hover:border-wangfeng-purple hover:shadow-lg'
          : 'bg-black/40 border-wangfeng-purple/30 hover:bg-wangfeng-purple/10 hover:border-wangfeng-purple/50'
      )}
      onClick={() => onPlay(id)}
    >
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-wangfeng-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* 内容 */}
      <div className="relative p-6 h-full flex flex-col">
        {/* 图标 + 标题 */}
        <div className="flex items-start gap-4 mb-4">
          <div className="text-4xl group-hover:scale-110 transition-transform duration-300">{icon}</div>
          <div className="flex-1">
            <h3 className={cn(
              'text-xl font-semibold mb-2',
              isLight ? 'text-gray-900' : 'text-white'
            )}>
              {title}
            </h3>
            <span className={cn(
              'text-xs px-2 py-1 rounded-full font-semibold inline-block',
              difficultyColors[difficulty]
            )}>
              {difficultyLabels[difficulty]}
            </span>
          </div>
        </div>

        {/* 描述 */}
        <p className={cn(
          'flex-1 mb-4 text-sm',
          isLight ? 'text-gray-600' : 'text-gray-400'
        )}>
          {description}
        </p>

        {/* 底部信息和按钮 */}
        <div className="flex items-center justify-between">
          <span className={cn(
            'text-xs',
            isLight ? 'text-gray-500' : 'text-gray-500'
          )}>
            {playCount} 人已玩
          </span>
          <button className={cn(
            'px-4 py-2 rounded-lg font-semibold transition-all',
            'bg-wangfeng-purple text-white hover:bg-wangfeng-dark'
          )}>
            开始游戏 →
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default GameCard;
