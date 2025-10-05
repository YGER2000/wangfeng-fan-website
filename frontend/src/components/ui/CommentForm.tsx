import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { commentService } from '../../services/commentService';
import { CommentCreate } from '../../types/comment';

interface CommentFormProps {
  postId: string;
  onCommentAdded: () => void;
  placeholder?: string;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  postId,
  onCommentAdded,
  placeholder = '写下你的评论...',
}) => {
  const { user, token } = useAuth();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 处理提交评论
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !token) {
      setError('请先登录');
      return;
    }

    if (!content.trim()) {
      setError('评论内容不能为空');
      return;
    }

    if (content.trim().length > 1000) {
      setError('评论内容不能超过1000字');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const commentData: CommentCreate = {
        post_id: postId,
        content: content.trim(),
      };

      await commentService.createComment(commentData, token);
      setContent('');
      onCommentAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布评论失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <MessageCircle size={24} className="mx-auto mb-2 text-gray-400" />
        <p className="text-gray-600 mb-4">登录后即可发表评论</p>
        <button
          onClick={() => {
            // 这里可以触发登录模态框
            // 或者导航到登录页面
          }}
          className="px-4 py-2 bg-wangfeng-purple text-white rounded-lg hover:bg-wangfeng-dark transition-colors"
        >
          立即登录
        </button>
      </div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-4"
    >
      <div className="space-y-4">
        <div>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setError(null);
            }}
            placeholder={placeholder}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-wangfeng-purple focus:border-transparent"
            rows={4}
            disabled={isLoading}
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-gray-500">
              {content.length}/1000
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200"
          >
            {error}
          </motion.div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            以 <span className="font-medium text-wangfeng-purple">{user.full_name || user.username}</span> 的身份发布
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !content.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-wangfeng-purple text-white rounded-lg hover:bg-wangfeng-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            <span>{isLoading ? '发布中...' : '发布评论'}</span>
          </button>
        </div>
      </div>
    </motion.form>
  );
};