// -*- coding: utf-8 -*-
/**
 * 权限感知内容工作流API客户端
 * 用于与后端 /api/v3/content 端点通信
 */

const API_BASE_URL = 'http://localhost:1994/api/v3/content';

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  author: string;
  author_id?: string;
  category_primary?: string;
  category_secondary?: string;
  review_status: 'pending' | 'approved' | 'rejected';
  reviewer_id?: string;
  review_notes?: string;
  rejection_reason?: string;
  created_at: string;
  created_by_id?: number;
  submit_time?: string;
  submitted_by_id?: number;
  reviewed_at?: string;
  is_published: boolean;
}

/**
 * 创建新文章
 */
export async function createArticle(article: any, token: string): Promise<Article> {
  const response = await fetch(`${API_BASE_URL}/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(article),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '创建文章失败');
  }

  return response.json();
}

/**
 * 更新文章
 */
export async function updateArticle(id: string, article: any, token: string): Promise<Article> {
  const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(article),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '更新文章失败');
  }

  return response.json();
}

/**
 * 删除文章
 */
export async function deleteArticle(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '删除文章失败');
  }
}

/**
 * 提交文章进行审核
 */
export async function submitArticleForReview(id: string, token: string): Promise<Article> {
  const response = await fetch(`${API_BASE_URL}/articles/${id}/submit-review`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '提交审核失败');
  }

  return response.json();
}

/**
 * 批准文章
 */
export async function approveArticle(id: string, token: string): Promise<Article> {
  const response = await fetch(`${API_BASE_URL}/articles/${id}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '批准文章失败');
  }

  return response.json();
}

/**
 * 拒绝文章
 */
export async function rejectArticle(id: string, reason: string, token: string): Promise<Article> {
  const response = await fetch(`${API_BASE_URL}/articles/${id}/reject?reason=${encodeURIComponent(reason)}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '拒绝文章失败');
  }

  return response.json();
}

/**
 * 获取待审核文章列表
 */
export async function getPendingArticles(
  skip: number = 0,
  limit: number = 50,
  category?: string,
  token?: string
): Promise<Article[]> {
  let url = `${API_BASE_URL}/pending-review?skip=${skip}&limit=${limit}`;
  if (category) {
    url += `&category=${encodeURIComponent(category)}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '获取待审核列表失败');
  }

  return response.json();
}

/**
 * 获取当前用户的文章列表
 */
export async function getMyArticles(
  skip: number = 0,
  limit: number = 50,
  statusFilter?: string,
  token?: string
): Promise<Article[]> {
  let url = `${API_BASE_URL}/my-articles?skip=${skip}&limit=${limit}`;
  if (statusFilter) {
    url += `&status_filter=${encodeURIComponent(statusFilter)}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '获取我的文章失败');
  }

  return response.json();
}

/**
 * 获取所有文章（管理员视图）
 */
export async function getAllArticles(
  skip: number = 0,
  limit: number = 50,
  statusFilter?: string,
  authorId?: number,
  token?: string
): Promise<Article[]> {
  let url = `${API_BASE_URL}/all-articles?skip=${skip}&limit=${limit}`;
  if (statusFilter) {
    url += `&status_filter=${encodeURIComponent(statusFilter)}`;
  }
  if (authorId) {
    url += `&author_id=${authorId}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '获取所有文章失败');
  }

  return response.json();
}

export const contentWorkflowAPI = {
  createArticle,
  updateArticle,
  deleteArticle,
  submitArticleForReview,
  approveArticle,
  rejectArticle,
  getPendingArticles,
  getMyArticles,
  getAllArticles,
};
