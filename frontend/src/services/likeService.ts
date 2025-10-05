import { LikeStats, LikeToggleResponse } from '../types/like';

const API_BASE_URL = 'http://localhost:8001';

export const likeService = {
  // 切换点赞状态
  async toggleLike(postId: string, token: string): Promise<LikeToggleResponse> {
    const response = await fetch(`${API_BASE_URL}/api/likes/${postId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '点赞操作失败');
    }

    return response.json();
  },

  // 获取点赞统计
  async getLikeStats(postId: string, token?: string): Promise<LikeStats> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/likes/${postId}`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取点赞数据失败');
    }

    return response.json();
  },

  // 获取点赞用户列表
  async getLikeUsers(postId: string): Promise<Array<{id: string; username: string; created_at: string}>> {
    const response = await fetch(`${API_BASE_URL}/api/likes/${postId}/users`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取点赞用户失败');
    }

    return response.json();
  },

  // 获取点赞数
  async getLikeCount(postId: string): Promise<{post_id: string; like_count: number}> {
    const response = await fetch(`${API_BASE_URL}/api/likes/${postId}/count`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取点赞数失败');
    }

    return response.json();
  },

  // 检查用户点赞状态
  async checkUserLiked(postId: string, token: string): Promise<{post_id: string; user_liked: boolean}> {
    const response = await fetch(`${API_BASE_URL}/api/likes/${postId}/check`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '检查点赞状态失败');
    }

    return response.json();
  },
};