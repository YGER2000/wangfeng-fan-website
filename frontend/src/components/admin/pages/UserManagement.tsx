import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Users,
  Shield,
  Search,
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  UserCheck,
  Calendar,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminService, UserRole, UserStatus } from '@/services/admin';
import type { UserAdminResponse } from '@/services/admin';

const UserManagement: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [users, setUsers] = useState<UserAdminResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await adminService.getUsers({ limit: 100 });
      setUsers(usersData);
    } catch (err: any) {
      console.error('加载用户数据失败:', err);
      setError(err.message || '加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    const reason = prompt('请输入封禁原因：');
    if (!reason || reason.trim() === '') {
      alert('封禁原因不能为空');
      return;
    }

    try {
      setProcessingId(userId);
      await adminService.banUser(userId, { reason });
      await loadUsers();
    } catch (err: any) {
      console.error('封禁用户失败:', err);
      alert(err.message || '操作失败，请稍后重试');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      setProcessingId(userId);
      await adminService.unbanUser(userId, { reason: '已解除封禁' });
      await loadUsers();
    } catch (err: any) {
      console.error('解封用户失败:', err);
      alert(err.message || '操作失败，请稍后重试');
    } finally {
      setProcessingId(null);
    }
  };

  const roleOptions = [
    { value: 'all', label: '全部角色', icon: Users },
    { value: UserRole.ADMIN, label: '管理员', icon: Shield },
    { value: UserRole.SUPER_ADMIN, label: '超级管理员', icon: Shield },
    { value: UserRole.USER, label: '普通用户', icon: Users },
  ];

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: UserStatus.ACTIVE, label: '活跃' },
    { value: UserStatus.INACTIVE, label: '未激活' },
    { value: UserStatus.BANNED, label: '已封禁' },
  ];

  const getRoleBadge = (role: string) => {
    const colors = {
      [UserRole.SUPER_ADMIN]: 'bg-purple-500/20 text-purple-500',
      [UserRole.ADMIN]: 'bg-red-500/20 text-red-500',
      [UserRole.USER]: 'bg-gray-500/20 text-gray-500',
    };

    const labels = {
      [UserRole.SUPER_ADMIN]: '超级管理员',
      [UserRole.ADMIN]: '管理员',
      [UserRole.USER]: '普通用户',
    };

    return (
      <span className={cn('px-2 py-1 text-xs rounded-full', colors[role as keyof typeof colors] || 'bg-gray-500/20 text-gray-500')}>
        {labels[role as keyof typeof labels] || role}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500 flex items-center gap-1">
            <Unlock className="w-3 h-3" />
            活跃
          </span>
        );
      case UserStatus.INACTIVE:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500">
            未激活
          </span>
        );
      case UserStatus.BANNED:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-500 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            已封禁
          </span>
        );
      default:
        return null;
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "rounded-2xl border p-6",
        isLight ? "bg-red-50 border-red-200 text-red-800" : "bg-red-900/20 border-red-500/30 text-red-200"
      )}>
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">加载失败</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card
        className={cn(
          'border-wangfeng-purple/40',
          isLight ? 'bg-white/90' : 'bg-black/60'
        )}
      >
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex gap-2 flex-wrap">
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedRole(option.value)}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2',
                      selectedRole === option.value
                        ? 'bg-wangfeng-purple text-white shadow-glow'
                        : isLight
                        ? 'bg-white/70 text-gray-700 border border-wangfeng-purple/20 hover:border-wangfeng-purple'
                        : 'bg-black/40 text-gray-300 border border-wangfeng-purple/40 hover:border-wangfeng-purple'
                    )}
                  >
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                className="bg-wangfeng-purple hover:bg-wangfeng-purple/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加用户
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex gap-2 flex-wrap">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedStatus(option.value)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                      selectedStatus === option.value
                        ? 'bg-wangfeng-purple text-white'
                        : isLight
                        ? 'bg-white/70 text-gray-600 border border-wangfeng-purple/20'
                        : 'bg-black/40 text-gray-400 border border-wangfeng-purple/40'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索用户名或邮箱..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-4 py-2 text-sm rounded-lg border transition-colors',
                    isLight
                      ? 'bg-white border-wangfeng-purple/20 focus:border-wangfeng-purple'
                      : 'bg-black/40 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple'
                  )}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card
        className={cn(
          'border-wangfeng-purple/40',
          isLight ? 'bg-white/90' : 'bg-black/60'
        )}
      >
        <CardHeader>
          <CardTitle className="text-wangfeng-purple flex items-center gap-2">
            <Users className="w-5 h-5" />
            用户列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  isLight
                    ? 'border-wangfeng-purple/20 bg-white/50 hover:bg-white/80'
                    : 'border-wangfeng-purple/30 bg-black/30 hover:bg-black/50'
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={cn('font-medium', isLight ? 'text-gray-800' : 'text-gray-200')}>
                        {user.username}
                      </h3>
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>注册: {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        {user.last_login && (
                          <span>最后登录: {new Date(user.last_login).toLocaleString()}</span>
                        )}
                        {user.full_name && <span>姓名: {user.full_name}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    className="border-wangfeng-purple/40 text-wangfeng-purple opacity-50 cursor-not-allowed"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    编辑
                  </Button>
                  {user.status === UserStatus.BANNED ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnbanUser(user.id)}
                      disabled={processingId === user.id}
                      className={cn(
                        "border-green-500/40 text-green-500 hover:bg-green-500 hover:text-white",
                        processingId === user.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Unlock className="w-3 h-3 mr-1" />
                      {processingId === user.id ? '处理中...' : '解封'}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBanUser(user.id)}
                      disabled={processingId === user.id}
                      className={cn(
                        "border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white",
                        processingId === user.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      {processingId === user.id ? '处理中...' : '封禁'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    className="border-red-500/40 text-red-500 opacity-50 cursor-not-allowed"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
