import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { likeService } from '../../services/likeService';
import { LikeStats } from '../../types/like';

interface LikeButtonProps {
  postId: string;
  className?: string;
  showCount?: boolean;
  showRecentUsers?: boolean;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  postId,
  className = '',
  showCount = true,
  showRecentUsers = false,
}) => {
  const { user, token } = useAuth();
  const [likeStats, setLikeStats] = useState<LikeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载点赞统计
  const loadLikeStats = async () => {
    try {
      setError(null);
      const stats = await likeService.getLikeStats(postId, token || undefined);
      setLikeStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      console.error('加载点赞统计失败:', err);
    }
  };

  useEffect(() => {
    loadLikeStats();
  }, [postId, token]);

  // 处理点赞点击
  const handleLikeClick = async () => {
    if (!user || !token) {
      setError('请先登录');
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await likeService.toggleLike(postId, token);
      setLikeStats(response.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
      console.error('点赞操作失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (error && !likeStats) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        {error}
      </div>
    );
  }

  const isLiked = likeStats?.user_liked || false;
  const likeCount = likeStats?.like_count || 0;
  const recentUsers = likeStats?.recent_likes || [];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <motion.button
        onClick={handleLikeClick}
        disabled={isLoading || !user}
        className={`
          flex items-center space-x-1 px-3 py-1.5 rounded-full transition-all duration-200
          ${isLiked
            ? 'bg-red-50 text-red-600 border border-red-200'
            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
          }
          ${!user ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
        `}
        whileTap={{ scale: 0.95 }}
        title={!user ? '请先登录' : isLiked ? '取消点赞' : '点赞'}
      >
        <motion.div
          animate={isLiked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Heart
            size={16}
            className={`
              ${isLiked ? 'fill-current text-red-600' : ''}
              transition-colors duration-200
            `}
          />
        </motion.div>
        
        {showCount && (
          <AnimatePresence mode="wait">
            <motion.span
              key={likeCount}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-sm font-medium"
            >
              {likeCount}
            </motion.span>
          </AnimatePresence>
        )}
      </motion.button>

      {showRecentUsers && recentUsers.length > 0 && (
        <div className="text-xs text-gray-500">
          {recentUsers.slice(0, 3).join('、')}
          {recentUsers.length > 3 && ` 等${likeCount}人`}
          点赞了
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="text-xs text-red-500"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
};