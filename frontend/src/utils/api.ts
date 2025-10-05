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
  meta_description?: string;
  meta_keywords?: string;
}

export interface Article extends ArticleData {
  id: string;
  slug: string;
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

export type ScheduleCategory = '演唱会' | '音乐节' | '商演' | '综艺活动' | '其他';

export interface ScheduleItemResponse {
  id: number;
  date: string;
  city: string;
  venue?: string;
  theme: string;
  category: ScheduleCategory;
  description?: string | null;
  image?: string | null;
  source: 'legacy' | 'custom';
  created_at?: string;
  updated_at?: string;
}

// API 请求函数
export const articleAPI = {
  // 创建文章
  create: async (articleData: ArticleData): Promise<Article> => {
    const response = await fetch(`${API_BASE_URL}/articles/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
  update: async (id: string, articleData: Partial<ArticleData>): Promise<Article> => {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(articleData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '更新文章失败');
    }
    
    return response.json();
  },

  // 删除文章
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'DELETE',
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
