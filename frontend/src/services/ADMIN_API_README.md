# Admin API Service Documentation

This document provides comprehensive documentation for the Admin API service layer.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Authentication](#authentication)
- [API Reference](#api-reference)
  - [Dashboard APIs](#dashboard-apis)
  - [Article Management APIs](#article-management-apis)
  - [User Management APIs](#user-management-apis)
  - [Schedule Management APIs](#schedule-management-apis)
  - [Comment Management APIs](#comment-management-apis)
  - [Admin Log APIs](#admin-log-apis)
- [TypeScript Types](#typescript-types)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

---

## Overview

The Admin API Service (`admin.ts`) provides a clean, type-safe interface to interact with the backend admin APIs. It includes:

- ✅ Full TypeScript support with comprehensive type definitions
- ✅ Axios-based HTTP client with automatic JWT authentication
- ✅ Global error handling and response interceptors
- ✅ Consistent API patterns across all endpoints
- ✅ Automatic token management

**Backend API Base URL**: `http://localhost:1994`

---

## Installation

The service uses `axios` for HTTP requests. It's already installed as a dependency.

```bash
pnpm add axios
```

---

## Authentication

The service automatically handles JWT authentication:

1. **Token Storage**: JWT tokens are stored in `localStorage` under the key `access_token`
2. **Auto-Injection**: The token is automatically added to all requests via the `Authorization` header
3. **Auto-Redirect**: On 401 Unauthorized responses, the user is automatically redirected to login

```typescript
// The token is automatically attached to all requests
// No manual header configuration needed!
const stats = await adminService.getDashboardStats();
```

---

## API Reference

### Dashboard APIs

#### Get Dashboard Statistics

```typescript
adminService.getDashboardStats(): Promise<DashboardStats>
```

Returns comprehensive dashboard statistics including user counts, article counts, and time-based metrics.

**Example:**
```typescript
const stats = await adminService.getDashboardStats();
console.log(`Total Users: ${stats.total_users}`);
console.log(`Pending Articles: ${stats.pending_articles}`);
```

**Response Type:**
```typescript
interface DashboardStats {
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
```

---

#### Get Dashboard Charts

```typescript
adminService.getDashboardCharts(): Promise<DashboardChartData>
```

Returns data for dashboard visualizations.

**Example:**
```typescript
const charts = await adminService.getDashboardCharts();
charts.user_growth.forEach(data => {
  console.log(`${data.date}: ${data.count} users`);
});
```

---

### Article Management APIs

#### Get Articles List

```typescript
adminService.getArticles(filters?: ArticlesFilters): Promise<ArticleAdminResponse[]>
```

Retrieve articles with optional filtering.

**Parameters:**
```typescript
interface ArticlesFilters {
  skip?: number;        // Pagination offset (default: 0)
  limit?: number;       // Results per page (default: 50, max: 100)
  status?: ReviewStatus; // Filter by review status
  search?: string;      // Search in title/content
  category?: string;    // Filter by category
}
```

**Example:**
```typescript
// Get pending articles
const pending = await adminService.getArticles({
  status: ReviewStatus.PENDING,
  skip: 0,
  limit: 20
});

// Search articles
const searched = await adminService.getArticles({
  search: '汪峰',
  category: 'news'
});
```

---

#### Get Articles Count

```typescript
adminService.getArticlesCount(filters?): Promise<number>
```

Get total count of articles matching filters (useful for pagination).

**Example:**
```typescript
const count = await adminService.getArticlesCount({
  status: ReviewStatus.PENDING
});
const totalPages = Math.ceil(count / 20);
```

---

#### Get Article Details

```typescript
adminService.getArticle(articleId: string): Promise<ArticleAdminResponse>
```

Get detailed information about a specific article.

---

#### Approve Article

```typescript
adminService.approveArticle(
  articleId: string,
  reviewData?: ArticleReviewAction
): Promise<ArticleAdminResponse>
```

Approve an article for publication.

**Example:**
```typescript
await adminService.approveArticle('article-123', {
  review_notes: 'Quality content, approved for publication'
});
```

---

#### Reject Article

```typescript
adminService.rejectArticle(
  articleId: string,
  reviewData: ArticleReviewAction
): Promise<ArticleAdminResponse>
```

Reject an article. **Note:** `review_notes` is required when rejecting.

**Example:**
```typescript
await adminService.rejectArticle('article-123', {
  review_notes: 'Content does not meet community guidelines'
});
```

---

#### Delete Article

```typescript
adminService.deleteArticle(articleId: string): Promise<MessageResponse>
```

Permanently delete an article. **Requires Super Admin role.**

---

### User Management APIs

#### Get Users List

```typescript
adminService.getUsers(filters?: UsersFilters): Promise<UserAdminResponse[]>
```

Retrieve users with optional filtering.

**Parameters:**
```typescript
interface UsersFilters {
  skip?: number;
  limit?: number;
  role?: UserRole;       // Filter by user role
  status?: UserStatus;   // Filter by user status
  search?: string;       // Search username/email
}
```

**Example:**
```typescript
// Get all admins
const admins = await adminService.getUsers({
  role: UserRole.ADMIN
});

// Search users
const users = await adminService.getUsers({
  search: 'john',
  status: UserStatus.ACTIVE
});
```

---

#### Get Users Count

```typescript
adminService.getUsersCount(filters?): Promise<number>
```

---

#### Get User Details

```typescript
adminService.getUser(userId: string): Promise<UserAdminResponse>
```

---

#### Update User Role

```typescript
adminService.updateUserRole(
  userId: string,
  roleData: UserUpdateRole
): Promise<UserAdminResponse>
```

Update a user's role. **Requires Super Admin role.**

**Example:**
```typescript
await adminService.updateUserRole('user-123', {
  role: UserRole.ADMIN
});
```

**Available Roles:**
- `UserRole.USER` - Regular user
- `UserRole.ADMIN` - Administrator
- `UserRole.SUPER_ADMIN` - Super Administrator

---

#### Ban User

```typescript
adminService.banUser(
  userId: string,
  banData?: UserBanAction
): Promise<UserAdminResponse>
```

Ban a user from the platform.

**Example:**
```typescript
await adminService.banUser('user-123', {
  reason: 'Violation of community guidelines - spam posting'
});
```

---

#### Unban User

```typescript
adminService.unbanUser(
  userId: string,
  unbanData?: UserUnbanAction
): Promise<UserAdminResponse>
```

Remove ban from a user.

**Example:**
```typescript
await adminService.unbanUser('user-123', {
  reason: 'Appeal accepted - first offense'
});
```

---

### Schedule Management APIs

#### Get Schedules List

```typescript
adminService.getSchedules(filters?: SchedulesFilters): Promise<ScheduleAdminResponse[]>
```

Retrieve concert/event schedules.

**Example:**
```typescript
const schedules = await adminService.getSchedules({
  skip: 0,
  limit: 20
});
```

---

#### Get Schedules Count

```typescript
adminService.getSchedulesCount(): Promise<number>
```

---

#### Update Schedule

```typescript
adminService.updateSchedule(
  scheduleId: number,
  payload: ScheduleUpdatePayload
): Promise<ScheduleAdminResponse>
```

Update schedule metadata and optionally upload a new poster image. Payload fields are optional; only supplied values get updated.

---

#### Publish Schedule

```typescript
adminService.publishSchedule(scheduleId: number): Promise<ScheduleAdminResponse>
```

Marks a schedule as published (automatically requires review approval).

---

#### Delete Schedule

```typescript
adminService.deleteSchedule(scheduleId: number): Promise<MessageResponse>
```

Permanently remove a schedule (published schedules require super admin role).

---

### Comment Management APIs

#### Get Comments List

```typescript
adminService.getComments(filters?: CommentsFilters): Promise<CommentAdminResponse[]>
```

Retrieve comments with optional filtering.

**Parameters:**
```typescript
interface CommentsFilters {
  skip?: number;
  limit?: number;
  article_id?: string;  // Filter by article
}
```

**Note:** Comments are stored in MongoDB. Current implementation returns a message indicating MongoDB integration is needed.

---

### Admin Log APIs

#### Get Admin Logs

```typescript
adminService.getLogs(filters?: LogsFilters): Promise<AdminLogResponse[]>
```

Retrieve admin activity logs with filtering.

**Parameters:**
```typescript
interface LogsFilters {
  skip?: number;
  limit?: number;
  action?: LogActionType;           // Filter by action type
  resource_type?: LogResourceType;  // Filter by resource type
  operator_id?: string;             // Filter by operator
  start_date?: string;              // Filter by date range
  end_date?: string;
}
```

**Example:**
```typescript
// Get all article approval logs
const approvalLogs = await adminService.getLogs({
  action: LogActionType.APPROVE,
  resource_type: LogResourceType.ARTICLE
});

// Get logs for specific date range
const recentLogs = await adminService.getLogs({
  start_date: '2025-10-01',
  end_date: '2025-10-06',
  limit: 100
});
```

---

#### Get Logs Count

```typescript
adminService.getLogsCount(filters?): Promise<number>
```

---

#### Get Recent Logs

```typescript
adminService.getRecentLogs(limit?: number): Promise<AdminLogResponse[]>
```

Get most recent admin activity logs.

**Example:**
```typescript
const recent = await adminService.getRecentLogs(10);
```

---

## TypeScript Types

### Enums

```typescript
enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

enum LogActionType {
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

enum LogResourceType {
  USER = 'user',
  ARTICLE = 'article',
  COMMENT = 'comment',
  SCHEDULE = 'schedule',
  SYSTEM = 'system',
}
```

### Response Types

All response types are fully documented in `admin.ts`. Key types include:

- `ArticleAdminResponse` - Article with admin metadata
- `UserAdminResponse` - User with admin metadata
- `AdminLogResponse` - Admin activity log entry
- `DashboardStats` - Dashboard statistics
- `ScheduleAdminResponse` - Schedule/event information

---

## Error Handling

The service includes comprehensive error handling:

### Automatic Error Handling

1. **401 Unauthorized**: Automatically clears token and redirects to login
2. **403 Forbidden**: Logs permission error to console
3. **404 Not Found**: Logs resource not found error
4. **5xx Server Errors**: Logs server error

### Manual Error Handling

```typescript
try {
  await adminService.approveArticle('article-123');
} catch (err) {
  // Error is already formatted by the interceptor
  const message = err instanceof Error ? err.message : 'Unknown error';
  console.error('Operation failed:', message);

  // Show user-friendly message
  alert(message);
}
```

### Network Errors

```typescript
// Network timeout or connection issues
try {
  await adminService.getDashboardStats();
} catch (err) {
  // Will receive: "Unable to connect to server. Please check your connection."
}
```

---

## Usage Examples

### Complete Dashboard Component

```typescript
import { useEffect, useState } from 'react';
import { adminService, DashboardStats } from '@/services/admin';

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>Failed to load dashboard</div>;

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      <div className="stats-grid">
        <StatCard title="Total Users" value={stats.total_users} />
        <StatCard title="Pending Articles" value={stats.pending_articles} />
        <StatCard title="Today's New Users" value={stats.today_new_users} />
      </div>
    </div>
  );
}
```

### Article Review Workflow

```typescript
async function reviewArticle(articleId: string, approve: boolean) {
  try {
    if (approve) {
      await adminService.approveArticle(articleId, {
        review_notes: 'Content approved'
      });
      alert('Article approved successfully');
    } else {
      const reason = prompt('Enter rejection reason:');
      if (!reason) return;

      await adminService.rejectArticle(articleId, {
        review_notes: reason
      });
      alert('Article rejected');
    }

    // Refresh article list
    refreshArticles();
  } catch (err) {
    alert('Review operation failed: ' + err.message);
  }
}
```

### User Management with Search

```typescript
function UserManagementPanel() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  const loadUsers = async () => {
    const data = await adminService.getUsers({
      search,
      limit: 50
    });
    setUsers(data);
  };

  useEffect(() => {
    const timer = setTimeout(loadUsers, 300); // Debounce
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {/* Render users */}
    </div>
  );
}
```

---

## Best Practices

1. **Always handle errors**: Use try-catch blocks for all API calls
2. **Use TypeScript types**: Import and use the provided types for type safety
3. **Token management**: Ensure token is stored in localStorage after login
4. **Loading states**: Show loading indicators during API calls
5. **Pagination**: Use `skip` and `limit` with count APIs for proper pagination
6. **Debounce searches**: Debounce search inputs to avoid excessive API calls

---

## Support

For more examples, see `admin.example.tsx`.

Backend API Documentation: Check `/Users/yger/WithFaith/wangfeng-fan-website/backend/app/routers/admin.py`
