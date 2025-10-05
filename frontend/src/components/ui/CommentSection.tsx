import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { Comment } from '../../types/comment';
import { commentService } from '../../services/commentService';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';

interface CommentSectionProps {
  postId: string;
  title?: string;
  className?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  title = '评论',
  className = '',
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 加载评论列表
  const loadComments = async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const commentsData = await commentService.getCommentsByPostId(postId);
      setComments(commentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载评论失败');
      console.error('加载评论失败:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  // 处理评论添加
  const handleCommentAdded = () => {
    loadComments(true);
  };

  // 处理评论更新
  const handleCommentUpdate = (commentId: string, newContent: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, content: newContent, updated_at: new Date().toISOString() }
        : comment
    ));
  };

  // 处理评论删除
  const handleCommentDelete = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageCircle size={20} className="text-wangfeng-purple" />
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
            {comments.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({comments.length})
              </span>
            )}
          </h3>
        </div>

        {/* 刷新按钮 */}
        <button
          onClick={() => loadComments(true)}
          disabled={isRefreshing}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:animate-spin"
          title="刷新评论"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* 评论表单 */}
      <CommentForm
        postId={postId}
        onCommentAdded={handleCommentAdded}
      />

      {/* 评论列表 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wangfeng-purple"></div>
            <span className="ml-2 text-gray-500">加载评论中...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">{error}</div>
            <button
              onClick={() => loadComments()}
              className="px-4 py-2 bg-wangfeng-purple text-white rounded-lg hover:bg-wangfeng-dark transition-colors"
            >
              重试
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle size={24} className="mx-auto mb-2 text-gray-300" />
            <p>还没有评论，来发表第一条评论吧！</p>
          </div>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onUpdate={handleCommentUpdate}
                onDelete={handleCommentDelete}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 刷新提示 */}
      {isRefreshing && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center text-sm text-wangfeng-purple"
        >
          正在刷新评论...
        </motion.div>
      )}
    </div>
  );
};