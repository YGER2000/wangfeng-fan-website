# Admin API Quick Start Guide

Quick reference for common admin operations.

## Setup

```typescript
import { adminService, ReviewStatus, UserRole, UserStatus } from '@/services/admin';
```

## Common Operations

### 1. Get Dashboard Stats

```typescript
const stats = await adminService.getDashboardStats();
console.log('Pending articles:', stats.pending_articles);
```

### 2. Review Articles

**Approve:**
```typescript
await adminService.approveArticle('article-id', {
  review_notes: 'Approved'
});
```

**Reject:**
```typescript
await adminService.rejectArticle('article-id', {
  review_notes: 'Does not meet standards'
});
```

**List Pending:**
```typescript
const pending = await adminService.getArticles({
  status: ReviewStatus.PENDING,
  limit: 20
});
```

### 3. Manage Users

**Ban User:**
```typescript
await adminService.banUser('user-id', {
  reason: 'Spam posting'
});
```

**Unban User:**
```typescript
await adminService.unbanUser('user-id', {
  reason: 'Appeal accepted'
});
```

**Change Role (Super Admin only):**
```typescript
await adminService.updateUserRole('user-id', {
  role: UserRole.ADMIN
});
```

**Search Users:**
```typescript
const users = await adminService.getUsers({
  search: 'john',
  status: UserStatus.ACTIVE
});
```

### 4. View Logs

**Recent Activity:**
```typescript
const logs = await adminService.getRecentLogs(10);
```

**Filter by Action:**
```typescript
const approvals = await adminService.getLogs({
  action: LogActionType.APPROVE,
  limit: 50
});
```

### 5. Pagination Pattern

```typescript
const pageSize = 20;
const currentPage = 1;

const [articles, count] = await Promise.all([
  adminService.getArticles({
    skip: (currentPage - 1) * pageSize,
    limit: pageSize
  }),
  adminService.getArticlesCount()
]);

const totalPages = Math.ceil(count / pageSize);
```

### 6. Error Handling

```typescript
try {
  await adminService.approveArticle('article-id');
  alert('Success!');
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  alert('Failed: ' + message);
}
```

## Available Filters

### ArticlesFilters
- `skip` - Pagination offset
- `limit` - Results per page (max 100)
- `status` - ReviewStatus enum
- `search` - Search term
- `category` - Category filter

### UsersFilters
- `skip` - Pagination offset
- `limit` - Results per page (max 100)
- `role` - UserRole enum
- `status` - UserStatus enum
- `search` - Username/email search

### LogsFilters
- `skip` - Pagination offset
- `limit` - Results per page (max 100)
- `action` - LogActionType enum
- `resource_type` - LogResourceType enum
- `operator_id` - Filter by operator
- `start_date` - Start date (ISO string)
- `end_date` - End date (ISO string)

## Enums Reference

```typescript
// Article Review Status
ReviewStatus.PENDING
ReviewStatus.APPROVED
ReviewStatus.REJECTED

// User Roles
UserRole.USER
UserRole.ADMIN
UserRole.SUPER_ADMIN

// User Status
UserStatus.ACTIVE
UserStatus.INACTIVE
UserStatus.BANNED

// Log Actions
LogActionType.APPROVE
LogActionType.REJECT
LogActionType.BAN
LogActionType.UNBAN
LogActionType.ROLE_CHANGE
LogActionType.DELETE

// Resource Types
LogResourceType.ARTICLE
LogResourceType.USER
LogResourceType.COMMENT
LogResourceType.SCHEDULE
LogResourceType.SYSTEM
```

## Authentication

The service automatically handles authentication via JWT tokens stored in `localStorage`:

```typescript
// After login, store token:
localStorage.setItem('access_token', token);

// All API calls will include: Authorization: Bearer {token}

// On 401 error, automatically redirects to login
```

## Tips

1. ✅ **Always use try-catch** for error handling
2. ✅ **Import types** for TypeScript autocomplete
3. ✅ **Use pagination** for large lists
4. ✅ **Debounce search** to reduce API calls
5. ✅ **Check permissions** before showing admin UI

## Complete Component Example

```typescript
import { useState, useEffect } from 'react';
import { adminService, ArticleAdminResponse, ReviewStatus } from '@/services/admin';

function ArticleReviewPanel() {
  const [articles, setArticles] = useState<ArticleAdminResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await adminService.getArticles({
        status: ReviewStatus.PENDING
      });
      setArticles(data);
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await adminService.approveArticle(id);
      await loadArticles(); // Refresh
      alert('Article approved');
    } catch (err) {
      alert('Failed to approve article');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Pending Articles ({articles.length})</h2>
      {articles.map(article => (
        <div key={article.id}>
          <h3>{article.title}</h3>
          <button onClick={() => handleApprove(article.id)}>
            Approve
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

For full documentation, see [ADMIN_API_README.md](./ADMIN_API_README.md)

For code examples, see [admin.example.tsx](./admin.example.tsx)
