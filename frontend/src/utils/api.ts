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
  review_status: 'pending' | 'approved' | 'rejected';  // 审核状态
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
  tags: string[];  // 标签列表
}

export interface Video extends VideoData {
  id: string;
  created_at: string;
  updated_at: string;
  review_status: 'pending' | 'approved' | 'rejected';  // 审核状态
  is_published: number;  // 是否已发布: 0未发布/1已发布
  cover_url?: string;
  cover_local?: string;
  cover_thumb?: string;
  tags: string[];  // 标签列表
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
    published_only?: boolean;
  }): Promise<Article[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);
    if (params?.published_only !== undefined) searchParams.append('published_only', params.published_only.toString());

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

    const url = category
      ? `${API_BASE_URL}/articles/count?${searchParams}`
      : `${API_BASE_URL}/articles/count`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('获取文章总数失败');
    }

    return response.json();
  },

  // 获取当前用户的文章（我的文章）
  getMyArticles: async (params?: {
    skip?: number;
    limit?: number;
    category?: string;
  }, token?: string | null): Promise<Article[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/articles/my?${searchParams}`, {
      headers
    });

    if (!response.ok) {
      throw new Error('获取我的文章失败');
    }

    return response.json();
  },

  // 获取所有文章（管理员）
  getAllArticles: async (params?: {
    skip?: number;
    limit?: number;
    category?: string;
    review_status?: string;
  }, token?: string | null): Promise<Article[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);
    if (params?.review_status) searchParams.append('review_status', params.review_status);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/articles/all?${searchParams}`, {
      headers
    });

    if (!response.ok) {
      throw new Error('获取所有文章失败');
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

  // 获取当前用户的视频（我的视频）
  getMyVideos: async (params?: {
    skip?: number;
    limit?: number;
    category?: string;
  }, token?: string | null): Promise<Video[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/videos/my?${searchParams}`, {
      headers
    });

    if (!response.ok) {
      throw new Error('获取我的视频失败');
    }

    return response.json();
  },

  // 获取所有视频（管理员）
  getAllVideos: async (params?: {
    skip?: number;
    limit?: number;
    category?: string;
    review_status?: string;
  }, token?: string | null): Promise<Video[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);
    if (params?.review_status) searchParams.append('review_status', params.review_status);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/videos/all?${searchParams}`, {
      headers
    });

    if (!response.ok) {
      throw new Error('获取所有视频失败');
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
export interface TagCategoryData {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TagData {
  id: number;
  name: string;
  display_name: string;
  value: string;
  category_id: number;
  category_name?: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTagPayload {
  categoryId?: number;
  categoryName?: string;
  value: string;
  description?: string;
}

export interface UpdateTagPayload {
  categoryId?: number;
  categoryName?: string;
  value?: string;
  description?: string;
}

export interface CreateTagCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateTagCategoryPayload {
  name?: string;
  description?: string;
}

export interface ContentTagData {
  tag_id: number;
  content_type: 'video' | 'article' | 'gallery' | 'schedule' | 'music';
  content_id: string;
}

export interface ContentItem {
  id: number;
  type: 'video' | 'article' | 'gallery';
  title: string;
  url: string;
  thumbnail?: string;
}

const TAG_DEFAULT_CATEGORY_NAME = '其他';
const TAG_VALUE_SEPARATORS = ['：', ':'];

const parseTagStringInput = (input: string): CreateTagPayload => {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('标签内容不能为空');
  }

  for (const separator of TAG_VALUE_SEPARATORS) {
    const index = trimmed.indexOf(separator);
    if (index !== -1) {
      const categoryPart = trimmed.slice(0, index).trim();
      const valuePart = trimmed.slice(index + 1).trim();
      if (categoryPart && valuePart) {
        return {
          categoryName: categoryPart,
          value: valuePart,
        };
      }
    }
  }

  return {
    categoryName: TAG_DEFAULT_CATEGORY_NAME,
    value: trimmed,
  };
};

const normalizeCreateTagPayload = (input: CreateTagPayload | string): CreateTagPayload => {
  if (typeof input === 'string') {
    return parseTagStringInput(input);
  }

  const value = input.value?.trim();
  if (!value) {
    throw new Error('标签值不能为空');
  }

  const categoryId = input.categoryId;
  const categoryName = input.categoryName?.trim() || undefined;
  if (categoryId === undefined && !categoryName) {
    throw new Error('请选择或填写标签种类');
  }

  return {
    categoryId,
    categoryName,
    value,
    description: input.description,
  };
};

const normalizeUpdateTagPayload = (input: UpdateTagPayload): UpdateTagPayload => ({
  categoryId: input.categoryId,
  categoryName: input.categoryName?.trim() || undefined,
  value: input.value !== undefined ? input.value.trim() : undefined,
  description: input.description,
});

const buildTagRequestBody = (
  payload: CreateTagPayload | UpdateTagPayload,
): Record<string, unknown> => ({
  category_id: payload.categoryId,
  category_name: payload.categoryName,
  value: payload.value,
  description: payload.description,
});

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

  // 获取标签种类
  listCategories: async (): Promise<TagCategoryData[]> => {
    const response = await fetch(`${API_BASE_URL}/tags/categories`);
    if (!response.ok) {
      throw new Error('获取标签种类失败');
    }
    return response.json();
  },

  // 创建标签种类
  createCategory: async (payload: CreateTagCategoryPayload): Promise<TagCategoryData> => {
    const name = payload.name.trim();
    if (!name) {
      throw new Error('标签种类名称不能为空');
    }
    const body = {
      name,
      description: payload.description,
    };
    const response = await fetch(`${API_BASE_URL}/tags/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || '创建标签种类失败');
    }
    return response.json();
  },

  // 更新标签种类
  updateCategory: async (categoryId: number, payload: UpdateTagCategoryPayload): Promise<TagCategoryData> => {
    const response = await fetch(`${API_BASE_URL}/tags/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: payload.name?.trim(),
        description: payload.description,
      }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || '更新标签种类失败');
    }
    return response.json();
  },

  // 删除标签种类
  deleteCategory: async (categoryId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tags/categories/${categoryId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || '删除标签种类失败');
    }
  },

  // 创建标签
  create: async (input: CreateTagPayload | string): Promise<TagData> => {
    const payload = normalizeCreateTagPayload(input);
    const response = await fetch(`${API_BASE_URL}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildTagRequestBody(payload)),
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
  update: async (tagId: number, updates: UpdateTagPayload): Promise<TagData> => {
    const payload = normalizeUpdateTagPayload(updates);
    const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildTagRequestBody(payload)),
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
  getContentTags: async (contentType: string, contentId: string): Promise<TagData[]> => {
    const response = await fetch(`${API_BASE_URL}/tags/content/${contentType}/${encodeURIComponent(contentId)}`);
    if (!response.ok) {
      throw new Error('获取内容标签失败');
    }
    return response.json();
  },

  // 设置内容的标签（替换）
  setContentTags: async (contentType: string, contentId: string, tagIds: number[]): Promise<TagData[]> => {
    const response = await fetch(`${API_BASE_URL}/tags/content/${contentType}/${encodeURIComponent(contentId)}`, {
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
  removeTagFromContent: async (tagId: number, contentType: string, contentId: string): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/tags/content?tag_id=${tagId}&content_type=${contentType}&content_id=${encodeURIComponent(String(contentId))}`,
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

// 图片画廊相关接口
export interface PhotoGroupData {
  id?: string;
  title: string;
  category: string;
  date: string;
  display_date: string;
  year: string;
  description?: string;
  cover_image_url?: string;
  cover_image_thumb_url?: string;
  author_id?: string;
}

export interface PhotoGroup extends PhotoGroupData {
  id: string;
  is_published: boolean;
  review_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  photo_count?: number;
  created_by?: string;
  tags?: string[];
}

// 图片画廊 API
export const galleryAPI = {
  // 获取照片组列表（我的图组）
  getMyPhotoGroups: async (params?: {
    skip?: number;
    limit?: number;
    category?: string;
  }, token?: string | null): Promise<PhotoGroup[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/gallery/groups/my?${searchParams}`, {
      headers
    });

    if (!response.ok) {
      throw new Error('获取我的图组失败');
    }

    return response.json();
  },

  // 获取所有照片组（管理员）
  getAllPhotoGroups: async (params?: {
    skip?: number;
    limit?: number;
    category?: string;
    review_status?: string;
  }, token?: string | null): Promise<PhotoGroup[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);
    if (params?.review_status) searchParams.append('review_status', params.review_status);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/gallery/groups/all?${searchParams}`, {
      headers
    });

    if (!response.ok) {
      throw new Error('获取所有图组失败');
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

  // 获取单个行程详情
  getById: async (scheduleId: number): Promise<ScheduleItemResponse> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/admin/schedules/${scheduleId}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('获取行程详情失败');
    }

    return response.json();
  },

  // 更新行程
  update: async (scheduleId: number, formData: FormData, token?: string | null): Promise<ScheduleItemResponse> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/admin/schedules/${scheduleId}`, {
      method: 'PUT',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '更新行程失败');
    }

    return response.json();
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
