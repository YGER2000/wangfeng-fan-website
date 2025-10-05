import { Comment, CommentCreate, CommentUpdate, CommentStats } from '../types/comment';

const API_BASE_URL = 'http://localhost:8001';

export const commentService = {
  // 创建评论
  async createComment(data: CommentCreate, token: string): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/api/comments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '创建评论失败');
    }

    return response.json();
  },

  // 获取文章评论列表
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const response = await fetch(`${API_BASE_URL}/api/comments/post/${postId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取评论失败');
    }

    return response.json();
  },

  // 获取单个评论
  async getComment(commentId: string): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取评论失败');
    }

    return response.json();
  },

  // 更新评论
  async updateComment(commentId: string, data: CommentUpdate, token: string): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '更新评论失败');
    }

    return response.json();
  },

  // 删除评论
  async deleteComment(commentId: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '删除评论失败');
    }
  },

  // 获取评论数
  async getCommentCount(postId: string): Promise<CommentStats> {
    const response = await fetch(`${API_BASE_URL}/api/comments/post/${postId}/count`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取评论数失败');
    }

    return response.json();
  },
};