/**
 * Admin API Service - Usage Examples
 *
 * This file demonstrates how to use the admin API service in React components.
 * DO NOT include this file in production builds - it's for reference only.
 */

import { useEffect, useState } from 'react';
import {
  adminService,
  adminAPI,
  DashboardStats,
  ArticleAdminResponse,
  UserAdminResponse,
  AdminLogResponse,
  ReviewStatus,
  UserRole,
  UserStatus,
  LogActionType,
  LogResourceType,
} from './admin';

// ============= Example 1: Dashboard Component =============
export function DashboardExample() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // Using adminService helper
        const dashboardStats = await adminService.getDashboardStats();
        setStats(dashboardStats);

        // Or using adminAPI instance directly
        const chartData = await adminAPI.getDashboardCharts();
        console.log('Chart data:', chartData);

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return null;

  return (
    <div>
      <h1>Dashboard Statistics</h1>
      <div>
        <p>Total Users: {stats.total_users}</p>
        <p>Total Articles: {stats.total_articles}</p>
        <p>Pending Articles: {stats.pending_articles}</p>
        <p>Today New Users: {stats.today_new_users}</p>
      </div>
    </div>
  );
}

// ============= Example 2: Article Management Component =============
export function ArticleManagementExample() {
  const [articles, setArticles] = useState<ArticleAdminResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function fetchArticles() {
      try {
        // Get pending articles with pagination
        const pendingArticles = await adminService.getArticles({
          status: ReviewStatus.PENDING,
          skip: 0,
          limit: 20,
        });
        setArticles(pendingArticles);

        // Get total count for pagination
        const count = await adminService.getArticlesCount({
          status: ReviewStatus.PENDING,
        });
        setTotalCount(count);
      } catch (err) {
        console.error('Failed to fetch articles:', err);
      }
    }

    fetchArticles();
  }, []);

  const handleApprove = async (articleId: string) => {
    try {
      await adminService.approveArticle(articleId, {
        review_notes: 'Approved - content meets quality standards',
      });

      // Refresh article list
      const updated = articles.filter(a => a.id !== articleId);
      setArticles(updated);

      alert('Article approved successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve article');
    }
  };

  const handleReject = async (articleId: string) => {
    try {
      await adminService.rejectArticle(articleId, {
        review_notes: 'Content does not meet quality standards',
      });

      // Refresh article list
      const updated = articles.filter(a => a.id !== articleId);
      setArticles(updated);

      alert('Article rejected');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject article');
    }
  };

  return (
    <div>
      <h2>Pending Articles ({totalCount})</h2>
      {articles.map(article => (
        <div key={article.id}>
          <h3>{article.title}</h3>
          <p>Author: {article.author}</p>
          <p>Status: {article.review_status}</p>
          <button onClick={() => handleApprove(article.id)}>Approve</button>
          <button onClick={() => handleReject(article.id)}>Reject</button>
        </div>
      ))}
    </div>
  );
}

// ============= Example 3: User Management Component =============
export function UserManagementExample() {
  const [users, setUsers] = useState<UserAdminResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const userList = await adminService.getUsers({
        search: searchTerm,
        skip: 0,
        limit: 50,
      });
      setUsers(userList);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const handleBanUser = async (userId: string) => {
    try {
      await adminService.banUser(userId, {
        reason: 'Violation of community guidelines',
      });

      // Update user in list
      setUsers(users.map(u =>
        u.id === userId ? { ...u, status: UserStatus.BANNED } : u
      ));

      alert('User banned successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await adminService.unbanUser(userId, {
        reason: 'Appeal accepted',
      });

      // Update user in list
      setUsers(users.map(u =>
        u.id === userId ? { ...u, status: UserStatus.ACTIVE } : u
      ));

      alert('User unbanned successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unban user');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      await adminService.updateUserRole(userId, { role: newRole });

      // Update user in list
      setUsers(users.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));

      alert('User role updated successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  return (
    <div>
      <h2>User Management</h2>
      <input
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {users.map(user => (
        <div key={user.id}>
          <h3>{user.username} ({user.email})</h3>
          <p>Role: {user.role}</p>
          <p>Status: {user.status}</p>

          {user.status === UserStatus.ACTIVE && (
            <button onClick={() => handleBanUser(user.id)}>Ban User</button>
          )}

          {user.status === UserStatus.BANNED && (
            <button onClick={() => handleUnbanUser(user.id)}>Unban User</button>
          )}

          <select onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}>
            <option value={UserRole.USER}>User</option>
            <option value={UserRole.ADMIN}>Admin</option>
            <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
          </select>
        </div>
      ))}
    </div>
  );
}

// ============= Example 4: Admin Logs Component =============
export function AdminLogsExample() {
  const [logs, setLogs] = useState<AdminLogResponse[]>([]);
  const [filters, setFilters] = useState({
    action: undefined as LogActionType | undefined,
    resource_type: undefined as LogResourceType | undefined,
  });

  useEffect(() => {
    async function fetchLogs() {
      try {
        // Get recent logs with filters
        const recentLogs = await adminService.getLogs({
          ...filters,
          skip: 0,
          limit: 50,
        });
        setLogs(recentLogs);
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      }
    }

    fetchLogs();
  }, [filters]);

  return (
    <div>
      <h2>Admin Activity Logs</h2>

      <div>
        <select onChange={(e) => setFilters({
          ...filters,
          action: e.target.value as LogActionType || undefined
        })}>
          <option value="">All Actions</option>
          <option value={LogActionType.APPROVE}>Approve</option>
          <option value={LogActionType.REJECT}>Reject</option>
          <option value={LogActionType.BAN}>Ban</option>
          <option value={LogActionType.UNBAN}>Unban</option>
        </select>

        <select onChange={(e) => setFilters({
          ...filters,
          resource_type: e.target.value as LogResourceType || undefined
        })}>
          <option value="">All Resources</option>
          <option value={LogResourceType.ARTICLE}>Article</option>
          <option value={LogResourceType.USER}>User</option>
          <option value={LogResourceType.COMMENT}>Comment</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Operator</th>
            <th>Action</th>
            <th>Resource</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.created_at).toLocaleString()}</td>
              <td>{log.operator_username}</td>
              <td>{log.action}</td>
              <td>{log.resource_type}</td>
              <td>{log.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============= Example 5: Schedules Management =============
export function SchedulesManagementExample() {
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    async function fetchSchedules() {
      try {
        const data = await adminService.getSchedules({
          skip: 0,
          limit: 20,
        });
        setSchedules(data);
      } catch (err) {
        console.error('Failed to fetch schedules:', err);
      }
    }

    fetchSchedules();
  }, []);

  return (
    <div>
      <h2>Concert Schedules</h2>
      {schedules.map((schedule: any) => (
        <div key={schedule.id}>
          <h3>{schedule.title}</h3>
          <p>{schedule.venue} - {schedule.city}</p>
          <p>{new Date(schedule.event_date).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}

// ============= Example 6: Error Handling Patterns =============
export function ErrorHandlingExample() {
  const [error, setError] = useState<string | null>(null);

  const handleOperation = async () => {
    try {
      setError(null);

      // API operation
      await adminService.approveArticle('article-123');

      alert('Operation successful!');
    } catch (err) {
      // Error is already handled by axios interceptor
      // But you can add custom handling here
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);

      // Log error for debugging
      console.error('Operation failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleOperation}>Perform Operation</button>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
    </div>
  );
}

// ============= Example 7: Pagination Pattern =============
export function PaginationExample() {
  const [articles, setArticles] = useState<ArticleAdminResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    async function fetchPaginatedArticles() {
      try {
        const [data, count] = await Promise.all([
          adminService.getArticles({
            skip: (page - 1) * pageSize,
            limit: pageSize,
          }),
          adminService.getArticlesCount(),
        ]);

        setArticles(data);
        setTotalPages(Math.ceil(count / pageSize));
      } catch (err) {
        console.error('Failed to fetch articles:', err);
      }
    }

    fetchPaginatedArticles();
  }, [page]);

  return (
    <div>
      <h2>Articles (Page {page} of {totalPages})</h2>

      {articles.map(article => (
        <div key={article.id}>{article.title}</div>
      ))}

      <div>
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
