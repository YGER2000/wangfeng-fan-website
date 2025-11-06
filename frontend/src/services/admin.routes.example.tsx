/**
 * Admin Routes Integration Example
 *
 * This file demonstrates how to integrate the admin API service
 * with React Router for protected admin routes.
 */

import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { adminService, DashboardStats } from './admin';
import { buildApiUrl } from '@/config/api';

// ============= Authentication Helper =============

/**
 * Check if user is authenticated
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  return { isAuthenticated, loading };
}

/**
 * Protected Route Component
 * Redirects to login if not authenticated
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ============= Admin Layout Component =============

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <nav className="admin-nav">
        <h1>Wang Feng Admin Panel</h1>
        <ul>
          <li><a href="/#/admin">Dashboard</a></li>
          <li><a href="/#/admin/articles">Articles</a></li>
          <li><a href="/#/admin/users">Users</a></li>
          <li><a href="/#/admin/schedules">Schedules</a></li>
          <li><a href="/#/admin/logs">Activity Logs</a></li>
        </ul>
        <button onClick={handleLogout}>Logout</button>
      </nav>
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}

// ============= Admin Dashboard Page =============

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return null;

  return (
    <AdminLayout>
      <div className="dashboard">
        <h1>Dashboard</h1>

        <div className="stats-grid">
          <StatCard
            title="Total Users"
            value={stats.total_users}
            trend={`+${stats.today_new_users} today`}
          />
          <StatCard
            title="Total Articles"
            value={stats.total_articles}
            trend={`+${stats.today_new_articles} today`}
          />
          <StatCard
            title="Pending Review"
            value={stats.pending_articles}
            highlight
          />
          <StatCard
            title="Total Comments"
            value={stats.total_comments}
            trend={`+${stats.today_new_comments} today`}
          />
        </div>

        <div className="stats-details">
          <h2>Weekly Stats</h2>
          <p>New Users: {stats.week_new_users}</p>
          <p>New Articles: {stats.week_new_articles}</p>
          <p>New Comments: {stats.week_new_comments}</p>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, trend, highlight }: {
  title: string;
  value: number;
  trend?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`stat-card ${highlight ? 'highlight' : ''}`}>
      <h3>{title}</h3>
      <p className="value">{value.toLocaleString()}</p>
      {trend && <p className="trend">{trend}</p>}
    </div>
  );
}

// ============= Router Configuration Example =============

/**
 * Example React Router configuration with admin routes
 */
export const routerConfigExample = `
import { createHashRouter } from 'react-router-dom';
import { ProtectedRoute, AdminLayout } from './services/admin.routes.example';
import { AdminDashboardPage } from './services/admin.routes.example';

const router = createHashRouter([
  // Public routes
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },

  // Protected admin routes
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <AdminDashboardPage />,
      },
      {
        path: 'articles',
        element: <ArticleManagementPage />,
      },
      {
        path: 'users',
        element: <UserManagementPage />,
      },
      {
        path: 'schedules',
        element: <ScheduleManagementPage />,
      },
      {
        path: 'logs',
        element: <ActivityLogsPage />,
      },
    ],
  },
]);

export default router;
`;

// ============= Login Page Example =============

export function LoginPageExample() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Call your auth API (not part of admin service)
      const response = await fetch(buildApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      // Store token
      localStorage.setItem('access_token', data.access_token);

      // Redirect to admin dashboard
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleLogin}>
        <h1>Admin Login</h1>

        {error && <div className="error">{error}</div>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

// ============= Permission-Based Component Example =============

/**
 * Check if user has specific role
 */
export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, decode JWT to get user role
    // For now, you could store role separately or decode token
    const token = localStorage.getItem('access_token');
    if (token) {
      // Decode JWT and extract role
      // const decoded = jwtDecode(token);
      // setRole(decoded.role);
    }
  }, []);

  return role;
}

/**
 * Conditional rendering based on role
 */
export function RoleBasedContent({ requiredRole, children }: {
  requiredRole: string;
  children: React.ReactNode;
}) {
  const userRole = useUserRole();

  // Role hierarchy: user < admin < super_admin
  const roleHierarchy = {
    'user': 0,
    'admin': 1,
    'super_admin': 2,
  };

  const hasPermission = userRole &&
    roleHierarchy[userRole as keyof typeof roleHierarchy] >=
    roleHierarchy[requiredRole as keyof typeof roleHierarchy];

  if (!hasPermission) {
    return null;
  }

  return <>{children}</>;
}

// ============= Usage in Component =============

export function UserManagementWithPermissions() {
  return (
    <AdminLayout>
      <div>
        <h1>User Management</h1>

        {/* Only show to super admins */}
        <RoleBasedContent requiredRole="super_admin">
          <button>Change User Role</button>
          <button>Delete User</button>
        </RoleBasedContent>

        {/* Show to all admins */}
        <RoleBasedContent requiredRole="admin">
          <button>Ban User</button>
          <button>Unban User</button>
        </RoleBasedContent>
      </div>
    </AdminLayout>
  );
}
