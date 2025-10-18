// API 基础配置
const API_BASE_URL = 'http://localhost:1994/api';

// 文章相关API
export interface ArticleData {
  id?: string;
  title: string;
  content: string;
  excerpt?: string;
  author: string;
  category: string;
  category_primary?: string;    // 新增：一级分类
  category_secondary?: string;  // 新增：二级分类
  tags: string[];
  cover_url?: string;           // 新增：封面图片URL
  meta_description?: string;
  meta_keywords?: string;
}

export interface Article extends ArticleData {
  id: string;
  slug: string;
  cover_url?: string;           // 封面图片URL
  is_published: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  published_at: string;
  view_count: number;
  like_count: number;
  category_primary: string;
  category_secondary: string;
}

// 视频相关接口
export interface VideoData {
  id?: string;
  title: string;
  description?: string;
  author: string;
  category: string;
  bvid: string;
  publish_date: string;
  cover_url?: string;  // B站视频封面URL
  cover_local?: string;  // 本地缓存的封面路径(640x480, 4:3)
  cover_thumb?: string;  // 本地缓存的缩略图路径(480x360, 4:3)
}

export interface Video extends VideoData {
  id: string;
  created_at: string;
  updated_at: string;
  cover_url?: string;
  cover_local?: string;
  cover_thumb?: string;
}

export type ScheduleCategory = '演唱会' | 'livehouse' | '音乐节' | '商演拼盘' | '综艺晚会' | '直播' | '商业活动' | '其他';

export interface ScheduleItemResponse {
  id: number;
  date: string;
  city: string;
  venue?: string;
  theme: string;
  category: ScheduleCategory;
  description?: string | null;
  image?: string | null;
  image_thumb?: string | null;
  source: 'legacy' | 'custom';
  review_status?: 'pending' | 'approved';
  is_published?: number;
  article_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

// API 请求函数
export const articleAPI = {
  // 创建文章
  create: async (articleData: ArticleData, token?: string | null): Promise<Article> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/articles/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(articleData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '创建文章失败');
    }

    return response.json();
  },

  // 获取文章列表
  getList: async (params?: {
    skip?: number;
    limit?: number;
    category?: string;
  }): Promise<Article[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);

    const response = await fetch(`${API_BASE_URL}/articles/?${searchParams}`);
    
    if (!response.ok) {
      throw new Error('获取文章列表失败');
    }
    
    return response.json();
  },

  // 根据ID获取文章
  getById: async (id: string): Promise<Article> => {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`);
    
    if (!response.ok) {
      throw new Error('获取文章失败');
    }
    
    return response.json();
  },

  // 根据slug获取文章
  getBySlug: async (slug: string): Promise<Article> => {
    const response = await fetch(`${API_BASE_URL}/articles/slug/${slug}`);
    
    if (!response.ok) {
      throw new Error('获取文章失败');
    }
    
    return response.json();
  },

  // 更新文章
  update: async (id: string, articleData: Partial<ArticleData>, token?: string | null): Promise<Article> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(articleData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '更新文章失败');
    }

    return response.json();
  },

  // 删除文章
  delete: async (id: string, token?: string | null): Promise<void> => {
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '删除文章失败');
    }
  },

  // 搜索文章
  search: async (params: {
    q: string;
    skip?: number;
    limit?: number;
  }): Promise<Article[]> => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.q);
    if (params.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/articles/search?${searchParams}`);
    
    if (!response.ok) {
      throw new Error('搜索文章失败');
    }
    
    return response.json();
  },

  // 获取分类列表
  getCategories: async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/articles/categories`);
    
    if (!response.ok) {
      throw new Error('获取分类失败');
    }
    
    return response.json();
  },

  // 获取文章总数
  getCount: async (category?: string): Promise<{ count: number }> => {
    const searchParams = new URLSearchParams();
    if (category) searchParams.append('category', category);

    const response = await fetch(`${API_BASE_URL}/articles/count?${searchParams}`);

    if (!response.ok) {
      throw new Error('获取文章数量失败');
    }

    return response.json();
  },
};

// 图片上传 API
export const uploadAPI = {
  // 上传图片（通用）
  uploadImage: async (file: File): Promise<{ url: string; filename: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '上传图片失败');
    }

    return response.json();
  },
};

// 视频相关 API
export const videoAPI = {
  // 获取视频列表
  getList: async (params?: {
    skip?: number;
    limit?: number;
    category?: string;
  }): Promise<Video[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);

    const response = await fetch(`${API_BASE_URL}/videos/?${searchParams}`);
    
    if (!response.ok) {
      throw new Error('获取视频列表失败');
    }
    
    return response.json();
  },

  // 根据ID获取视频
  getById: async (id: string): Promise<Video> => {
    const response = await fetch(`${API_BASE_URL}/videos/${id}`);
    
    if (!response.ok) {
      throw new Error('获取视频失败');
    }
    
    return response.json();
  },

  // 创建视频
  create: async (videoData: VideoData, token?: string | null): Promise<Video> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/videos/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(videoData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '创建视频失败');
    }
    
    return response.json();
  },

  // 更新视频
  update: async (id: string, videoData: Partial<VideoData>, token?: string | null): Promise<Video> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(videoData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '更新视频失败');
    }

    return response.json();
  },

  // 删除视频
  delete: async (id: string, token?: string | null): Promise<void> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '删除视频失败');
    }
  },

  // 获取视频总数
  getCount: async (category?: string): Promise<{ count: number }> => {
    const searchParams = new URLSearchParams();
    if (category) searchParams.append('category', category);

    const response = await fetch(`${API_BASE_URL}/videos/count?${searchParams}`);
    
    if (!response.ok) {
      throw new Error('获取视频数量失败');
    }
    
    return response.json();
  },
};

// 行程相关 API
export const scheduleAPI = {
  list: async (): Promise<ScheduleItemResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/schedules`);
    if (!response.ok) {
      throw new Error('获取行程列表失败');
    }
    return response.json();
  },

  create: async (formData: FormData, token?: string | null): Promise<ScheduleItemResponse> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/schedules`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || '创建行程失败');
    }

    return response.json();
  },
};

// 标签相关类型定义
export interface TagData {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContentTagData {
  tag_id: number;
  content_type: 'video' | 'article' | 'gallery' | 'schedule' | 'music';
  content_id: number;
}

export interface ContentItem {
  id: number;
  type: 'video' | 'article' | 'gallery';
  title: string;
  url: string;
  thumbnail?: string;
}

// 标签相关 API
export const tagAPI = {
  // 获取所有标签
  list: async (skip: number = 0, limit: number = 100): Promise<TagData[]> => {
    const response = await fetch(`${API_BASE_URL}/tags?skip=${skip}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('获取标签列表失败');
    }
    return response.json();
  },

  // 搜索标签
  search: async (query: string, limit: number = 20): Promise<TagData[]> => {
    const response = await fetch(`${API_BASE_URL}/tags/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('搜索标签失败');
    }
    return response.json();
  },

  // 创建标签
  create: async (name: string, description?: string): Promise<TagData> => {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || '创建标签失败');
    }
    return response.json();
  },

  // 批量创建标签
  batchCreate: async (tagNames: string[]): Promise<TagData[]> => {
    const response = await fetch(`${API_BASE_URL}/tags/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tagNames),
    });
    if (!response.ok) {
      throw new Error('批量创建标签失败');
    }
    return response.json();
  },

  // 获取单个标签
  get: async (tagId: number): Promise<TagData> => {
    const response = await fetch(`${API_BASE_URL}/tags/${tagId}`);
    if (!response.ok) {
      throw new Error('获取标签详情失败');
    }
    return response.json();
  },

  // 更新标签
  update: async (tagId: number, name?: string, description?: string): Promise<TagData> => {
    const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) {
      throw new Error('更新标签失败');
    }
    return response.json();
  },

  // 删除标签
  delete: async (tagId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('删除标签失败');
    }
  },

  // 获取内容的标签
  getContentTags: async (contentType: string, contentId: number): Promise<TagData[]> => {
    const response = await fetch(`${API_BASE_URL}/tags/content/${contentType}/${contentId}`);
    if (!response.ok) {
      throw new Error('获取内容标签失败');
    }
    return response.json();
  },

  // 设置内容的标签（替换）
  setContentTags: async (contentType: string, contentId: number, tagIds: number[]): Promise<TagData[]> => {
    const response = await fetch(`${API_BASE_URL}/tags/content/${contentType}/${contentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tagIds),
    });
    if (!response.ok) {
      throw new Error('设置内容标签失败');
    }
    return response.json();
  },

  // 为内容添加单个标签
  addTagToContent: async (data: ContentTagData): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/tags/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('添加标签失败');
    }
    return response.json();
  },

  // 从内容中移除标签
  removeTagFromContent: async (tagId: number, contentType: string, contentId: number): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/tags/content?tag_id=${tagId}&content_type=${contentType}&content_id=${contentId}`,
      {
        method: 'DELETE',
      }
    );
    if (!response.ok) {
      throw new Error('移除标签失败');
    }
  },

  // 获取标签关联的所有内容ID
  getTagContents: async (tagId: number): Promise<{
    videos: number[];
    articles: number[];
    galleries: number[];
    schedules: number[];
    music: number[];
  }> => {
    const response = await fetch(`${API_BASE_URL}/tags/${tagId}/contents`);
    if (!response.ok) {
      throw new Error('获取标签内容失败');
    }
    return response.json();
  },
};

// 获取本地存储的token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Admin Schedule API
export const adminScheduleAPI = {
  // 获取行程列表（管理员）
  getList: async (params?: {
    skip?: number;
    limit?: number;
  }): Promise<ScheduleItemResponse[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());

    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/admin/schedules?${searchParams}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('获取行程列表失败');
    }

    return response.json();
  },

  // 获取行程总数
  getCount: async (): Promise<number> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/admin/schedules/count`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('获取行程总数失败');
    }

    const data = await response.json();
    return data.count;
  },

  // 审核通过行程
  approve: async (scheduleId: number): Promise<ScheduleItemResponse> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/admin/schedules/${scheduleId}/approve`, {
      method: 'PUT',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '审核通过失败');
    }

    return response.json();
  },

  // 拒绝行程
  reject: async (scheduleId: number): Promise<void> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/admin/schedules/${scheduleId}/reject`, {
      method: 'PUT',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '拒绝行程失败');
    }
  },

  // 发布行程
  publish: async (scheduleId: number): Promise<ScheduleItemResponse> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/admin/schedules/${scheduleId}/publish`, {
      method: 'PUT',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '发布行程失败');
    }

    return response.json();
  },

  // 取消发布行程
  unpublish: async (scheduleId: number): Promise<ScheduleItemResponse> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/admin/schedules/${scheduleId}/unpublish`, {
      method: 'PUT',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '取消发布失败');
    }

    return response.json();
  },

  // 删除行程
  delete: async (scheduleId: number): Promise<void> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/admin/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '删除行程失败');
    }
  },
};
