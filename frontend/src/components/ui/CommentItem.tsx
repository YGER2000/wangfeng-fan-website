import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Comment } from '../../types/comment';
import { commentService } from '../../services/commentService';

interface CommentItemProps {
  comment: Comment;
  onUpdate: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onUpdate,
  onDelete,
}) => {
  const { user, token, hasPermission } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查是否可以编辑（作者）
  const canEdit = user && user.id === comment.user_id;
  
  // 检查是否可以删除（作者或管理员）
  const canDelete = user && (user.id === comment.user_id || hasPermission('admin'));

  // 格式化时间
  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInHours * 60);
        return `${diffInMinutes}分钟前`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}小时前`;
      } else if (diffInHours < 24 * 7) {
        return `${Math.floor(diffInHours / 24)}天前`;
      } else {
        return date.toLocaleDateString('zh-CN');
      }
    } catch {
      return '未知时间';
    }
  };

  // 处理编辑保存
  const handleSave = async () => {
    if (!token || !editContent.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await commentService.updateComment(comment.id, { content: editContent.trim() }, token);
      onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理删除
  const handleDelete = async () => {
    if (!token || !window.confirm('确定要删除这条评论吗？')) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await commentService.deleteComment(comment.id, token);
      onDelete(comment.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
      setIsLoading(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setEditContent(comment.content);
    setIsEditing(false);
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
    >
      {/* 用户信息栏 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-wangfeng-purple/10 rounded-full flex items-center justify-center">
            <User size={16} className="text-wangfeng-purple" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {comment.user_full_name || comment.username}
            </div>
            <div className="text-xs text-gray-500">
              {formatTime(comment.created_at)}
              {comment.updated_at !== comment.created_at && (
                <span className="ml-1 text-gray-400">(已编辑)</span>
              )}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        {(canEdit || canDelete) && !isEditing && (
          <div className="flex items-center space-x-1">
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="编辑评论"
              >
                <Edit2 size={14} />
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="删除评论"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 评论内容 */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-wangfeng-purple focus:border-transparent"
            rows={3}
            placeholder="编辑评论内容..."
            disabled={isLoading}
          />
          
          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={isLoading || !editContent.trim()}
              className="px-4 py-1.5 bg-wangfeng-purple text-white rounded-lg hover:bg-wangfeng-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? '保存中...' : '保存'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-1.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
          {comment.content}
        </div>
      )}

      {error && !isEditing && (
        <div className="mt-2 text-sm text-red-500">{error}</div>
      )}
    </motion.div>
  );
};