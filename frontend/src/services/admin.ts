import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL } from '@/config/api';

// ============= Enums =============
export enum ReviewStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

export enum LogActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  BAN = 'ban',
  UNBAN = 'unban',
  ROLE_CHANGE = 'role_change',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export enum LogResourceType {
  USER = 'user',
  ARTICLE = 'article',
  COMMENT = 'comment',
  SCHEDULE = 'schedule',
  SYSTEM = 'system',
}

// ============= Interfaces =============

// Dashboard Stats
export interface DashboardStats {
  total_users: number;
  total_articles: number;
  total_comments: number;
  total_schedules: number;
  pending_articles: number;
  today_new_users: number;
  today_new_articles: number;
  today_new_comments: number;
  week_new_users: number;
  week_new_articles: number;
  week_new_comments: number;
  month_new_users: number;
  month_new_articles: number;
  month_new_comments: number;
}

export interface UserGrowthData {
  date: string;
  count: number;
}

export interface ArticleStatsData {
  category: string;
  count: number;
}

export interface DashboardChartData {
  user_growth: UserGrowthData[];
  article_by_category: ArticleStatsData[];
  article_by_status: Record<string, number>;
}

// Article Management
export interface ArticleAdminResponse {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  author: string;
  author_id: string | null;
  category_primary: string;
  category_secondary: string;
  review_status: ReviewStatus;
  reviewer_id: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  is_published: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  view_count: number;
  like_count: number;
}

export interface ArticleReviewAction {
  review_notes?: string;
}

export interface ArticlesFilters {
  skip?: number;
  limit?: number;
  status?: ReviewStatus;
  search?: string;
  category?: string;
}

// User Management
export interface UserAdminResponse {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface UserUpdateRole {
  role: UserRole;
}

export interface UserBanAction {
  reason?: string;
}

export interface UserUnbanAction {
  reason?: string;
}

export interface UsersFilters {
  skip?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

// Schedule Management
export interface ScheduleAdminResponse {
  id: number;
  category: string;
  date: string;
  city: string;
  venue: string | null;
  theme: string;
  description: string | null;
  image: string | null;
  source: string;
  review_status: string;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface SchedulesFilters {
  skip?: number;
  limit?: number;
}

export interface ScheduleUpdatePayload {
  category?: string;
  date?: string;
  city?: string;
  venue?: string;
  theme?: string;
  description?: string;
  image?: File;
}

// Admin Log
export interface AdminLogResponse {
  id: string;
  action: LogActionType;
  resource_type: LogResourceType;
  resource_id: string | null;
  description: string | null;
  details: string | null;
  operator_id: string;
  operator_username: string;
  operator_role: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface LogsFilters {
  skip?: number;
  limit?: number;
  action?: LogActionType;
  resource_type?: LogResourceType;
  operator_id?: string;
  start_date?: string;
  end_date?: string;
}

// API Response Types
export interface CountResponse {
  count: number;
}

export interface MessageResponse {
  message: string;
  article_id?: string;
}

// ============= Axios Instance Configuration =============
class AdminAPI {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add JWT token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Log full error details for debugging
        console.error('Axios error details:', {
          message: error.message,
          code: error.code,
          hasResponse: !!error.response,
          hasRequest: !!error.request,
          config: {
            url: error.config?.url,
            method: error.config?.method,
          }
        });

        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const data = error.response.data as any;

          if (status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('access_token');
            window.location.href = '/#/login';
          } else if (status === 403) {
            // Forbidden - insufficient permissions
            console.error('Permission denied:', data.detail || 'Insufficient permissions');
          } else if (status === 404) {
            // Not found
            console.error('Resource not found:', data.detail);
          } else if (status >= 500) {
            // Server error
            console.error('Server error:', data.detail || 'Internal server error');
          }

          throw new Error(data.detail || `Request failed with status ${status}`);
        } else if (error.code === 'ECONNABORTED') {
          // Timeout error
          console.error('Request timeout');
          throw new Error('Request timeout. The file may be too large or the server is slow to respond.');
        } else if (error.request) {
          // Request made but no response received
          console.error('No response from server');
          throw new Error('Unable to connect to server. Please check your connection.');
        } else {
          // Error in request configuration
          console.error('Request error:', error.message);
          throw error;
        }
      }
    );
  }

  // ============= Dashboard APIs =============

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.axiosInstance.get<DashboardStats>('/api/admin/dashboard/stats');
    return response.data;
  }

  /**
   * Get dashboard chart data
   */
  async getDashboardCharts(): Promise<DashboardChartData> {
    const response = await this.axiosInstance.get<DashboardChartData>('/api/admin/dashboard/charts');
    return response.data;
  }

  // ============= Article Management APIs =============

  /**
   * Get articles list with filters
   */
  async getArticles(filters?: ArticlesFilters): Promise<ArticleAdminResponse[]> {
    const response = await this.axiosInstance.get<ArticleAdminResponse[]>('/api/admin/articles', {
      params: filters,
    });
    return response.data;
  }

  /**
   * Get articles count
   */
  async getArticlesCount(filters?: Omit<ArticlesFilters, 'skip' | 'limit'>): Promise<number> {
    const response = await this.axiosInstance.get<CountResponse>('/api/admin/articles/count', {
      params: filters,
    });
    return response.data.count;
  }

  /**
   * Get single article details
   */
  async getArticle(articleId: string): Promise<ArticleAdminResponse> {
    const response = await this.axiosInstance.get<ArticleAdminResponse>(
      `/api/admin/articles/${articleId}`
    );
    return response.data;
  }

  /**
   * Approve an article
   */
  async approveArticle(
    articleId: string,
    reviewData?: ArticleReviewAction
  ): Promise<ArticleAdminResponse> {
    const response = await this.axiosInstance.put<ArticleAdminResponse>(
      `/api/admin/articles/${articleId}/approve`,
      reviewData
    );
    return response.data;
  }

  /**
   * Reject an article
   */
  async rejectArticle(
    articleId: string,
    reviewData: ArticleReviewAction
  ): Promise<ArticleAdminResponse> {
    if (!reviewData.review_notes) {
      throw new Error('Rejection reason (review_notes) is required');
    }
    const response = await this.axiosInstance.put<ArticleAdminResponse>(
      `/api/admin/articles/${articleId}/reject`,
      reviewData
    );
    return response.data;
  }

  /**
   * Delete an article (super admin only)
   */
  async deleteArticle(articleId: string): Promise<MessageResponse> {
    const response = await this.axiosInstance.delete<MessageResponse>(
      `/api/admin/articles/${articleId}`
    );
    return response.data;
  }

  // ============= User Management APIs =============

  /**
   * Get users list with filters
   */
  async getUsers(filters?: UsersFilters): Promise<UserAdminResponse[]> {
    const response = await this.axiosInstance.get<UserAdminResponse[]>('/api/admin/users', {
      params: filters,
    });
    return response.data;
  }

  /**
   * Get users count
   */
  async getUsersCount(filters?: Omit<UsersFilters, 'skip' | 'limit'>): Promise<number> {
    const response = await this.axiosInstance.get<CountResponse>('/api/admin/users/count', {
      params: filters,
    });
    return response.data.count;
  }

  /**
   * Get single user details
   */
  async getUser(userId: string): Promise<UserAdminResponse> {
    const response = await this.axiosInstance.get<UserAdminResponse>(`/api/admin/users/${userId}`);
    return response.data;
  }

  /**
   * Update user role (super admin only)
   */
  async updateUserRole(userId: string, roleData: UserUpdateRole): Promise<UserAdminResponse> {
    const response = await this.axiosInstance.put<UserAdminResponse>(
      `/api/admin/users/${userId}/role`,
      roleData
    );
    return response.data;
  }

  /**
   * Ban a user
   */
  async banUser(userId: string, banData?: UserBanAction): Promise<UserAdminResponse> {
    const response = await this.axiosInstance.put<UserAdminResponse>(
      `/api/admin/users/${userId}/ban`,
      banData
    );
    return response.data;
  }

  /**
   * Unban a user
   */
  async unbanUser(userId: string, unbanData?: UserUnbanAction): Promise<UserAdminResponse> {
    const response = await this.axiosInstance.put<UserAdminResponse>(
      `/api/admin/users/${userId}/unban`,
      unbanData
    );
    return response.data;
  }

  // ============= Schedule Management APIs =============

  /**
   * Get schedules list
   */
  async getSchedules(filters?: SchedulesFilters): Promise<ScheduleAdminResponse[]> {
    const response = await this.axiosInstance.get<ScheduleAdminResponse[]>('/api/admin/schedules', {
      params: filters,
    });
    return response.data;
  }

  /**
   * Get schedules count
   */
  async getSchedulesCount(): Promise<number> {
    const response = await this.axiosInstance.get<CountResponse>('/api/admin/schedules/count');
    return response.data.count;
  }

  /**
   * Approve a schedule
   */
  async approveSchedule(scheduleId: number): Promise<ScheduleAdminResponse> {
    const response = await this.axiosInstance.put<{message: string; schedule: ScheduleAdminResponse}>(
      `/api/admin/schedules/${scheduleId}/approve`
    );
    return response.data.schedule;
  }

  /**
   * Reject a schedule (deletes it)
   */
  async rejectSchedule(scheduleId: number): Promise<MessageResponse> {
    const response = await this.axiosInstance.put<MessageResponse>(
      `/api/admin/schedules/${scheduleId}/reject`
    );
    return response.data;
  }

  /**
   * Publish a schedule
   */
  async publishSchedule(scheduleId: number): Promise<ScheduleAdminResponse> {
    const response = await this.axiosInstance.put<{message: string; schedule: ScheduleAdminResponse}>(
      `/api/admin/schedules/${scheduleId}/publish`
    );
    return response.data.schedule;
  }

  /**
   * Update a schedule (supports partial fields and poster upload)
   */
  async updateSchedule(
    scheduleId: number,
    payload: ScheduleUpdatePayload
  ): Promise<ScheduleAdminResponse> {
    const formData = new FormData();

    if (payload.category !== undefined) formData.append('category', payload.category);
    if (payload.date !== undefined) formData.append('date', payload.date);
    if (payload.city !== undefined) formData.append('city', payload.city);
    if (payload.venue !== undefined) formData.append('venue', payload.venue);
    if (payload.theme !== undefined) formData.append('theme', payload.theme);
    if (payload.description !== undefined) formData.append('description', payload.description);
    if (payload.image) formData.append('image', payload.image);

    const response = await this.axiosInstance.put<{message: string; schedule: ScheduleAdminResponse}>(
      `/api/admin/schedules/${scheduleId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for file uploads
      }
    );

    return response.data.schedule;
  }

  /**
   * Delete a schedule (super admin only for published schedules)
   */
  async deleteSchedule(scheduleId: number): Promise<MessageResponse> {
    const response = await this.axiosInstance.delete<MessageResponse>(
      `/api/admin/schedules/${scheduleId}`
    );
    return response.data;
  }

  // ============= Admin Log APIs =============

  /**
   * Get admin logs with filters
   */
  async getLogs(filters?: LogsFilters): Promise<AdminLogResponse[]> {
    const response = await this.axiosInstance.get<AdminLogResponse[]>('/api/admin/logs', {
      params: filters,
    });
    return response.data;
  }

  /**
   * Get logs count
   */
  async getLogsCount(filters?: Omit<LogsFilters, 'skip' | 'limit'>): Promise<number> {
    const response = await this.axiosInstance.get<CountResponse>('/api/admin/logs/count', {
      params: filters,
    });
    return response.data.count;
  }

  /**
   * Get recent logs
   */
  async getRecentLogs(limit: number = 10): Promise<AdminLogResponse[]> {
    const response = await this.axiosInstance.get<AdminLogResponse[]>('/api/admin/logs/recent', {
      params: { limit },
    });
    return response.data;
  }
}

// ============= Export Singleton Instance =============
export const adminAPI = new AdminAPI();

// ============= Export Individual Functions (Optional) =============
export const adminService = {
  // Dashboard
  getDashboardStats: () => adminAPI.getDashboardStats(),
  getDashboardCharts: () => adminAPI.getDashboardCharts(),

  // Articles
  getArticles: (filters?: ArticlesFilters) => adminAPI.getArticles(filters),
  getArticlesCount: (filters?: Omit<ArticlesFilters, 'skip' | 'limit'>) =>
    adminAPI.getArticlesCount(filters),
  getArticle: (articleId: string) => adminAPI.getArticle(articleId),
  approveArticle: (articleId: string, reviewData?: ArticleReviewAction) =>
    adminAPI.approveArticle(articleId, reviewData),
  rejectArticle: (articleId: string, reviewData: ArticleReviewAction) =>
    adminAPI.rejectArticle(articleId, reviewData),
  deleteArticle: (articleId: string) => adminAPI.deleteArticle(articleId),

  // Users
  getUsers: (filters?: UsersFilters) => adminAPI.getUsers(filters),
  getUsersCount: (filters?: Omit<UsersFilters, 'skip' | 'limit'>) => adminAPI.getUsersCount(filters),
  getUser: (userId: string) => adminAPI.getUser(userId),
  updateUserRole: (userId: string, roleData: UserUpdateRole) =>
    adminAPI.updateUserRole(userId, roleData),
  banUser: (userId: string, banData?: UserBanAction) => adminAPI.banUser(userId, banData),
  unbanUser: (userId: string, unbanData?: UserUnbanAction) => adminAPI.unbanUser(userId, unbanData),

  // Schedules
  getSchedules: (filters?: SchedulesFilters) => adminAPI.getSchedules(filters),
  getSchedulesCount: () => adminAPI.getSchedulesCount(),
  approveSchedule: (scheduleId: number) => adminAPI.approveSchedule(scheduleId),
  rejectSchedule: (scheduleId: number) => adminAPI.rejectSchedule(scheduleId),
  publishSchedule: (scheduleId: number) => adminAPI.publishSchedule(scheduleId),
  updateSchedule: (scheduleId: number, payload: ScheduleUpdatePayload) =>
    adminAPI.updateSchedule(scheduleId, payload),
  deleteSchedule: (scheduleId: number) => adminAPI.deleteSchedule(scheduleId),

  // Logs
  getLogs: (filters?: LogsFilters) => adminAPI.getLogs(filters),
  getLogsCount: (filters?: Omit<LogsFilters, 'skip' | 'limit'>) => adminAPI.getLogsCount(filters),
  getRecentLogs: (limit?: number) => adminAPI.getRecentLogs(limit),
};
