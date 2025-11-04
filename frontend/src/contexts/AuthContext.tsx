import React, { createContext, useContext, useState, useEffect } from 'react';
import { buildApiUrl } from '@/config/api';

export type UserRole = 'guest' | 'user' | 'admin' | 'super_admin';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  role_name: string;
  is_active: boolean;
}

export const getRoleHierarchy = (role: UserRole): number => {
  const hierarchy = {
    guest: 0,
    user: 1,
    admin: 2,
    super_admin: 3
  };
  return hierarchy[role] || 0;
};

export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return getRoleHierarchy(userRole) >= getRoleHierarchy(requiredRole);
};

export interface AuthContextType {
  user: User | null;
  token: string | null;
  currentRole: UserRole;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, code: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (requiredRole: UserRole) => boolean;
  initSuperAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 当前用户角色，未登录时为游客
  const currentRole: UserRole = user?.role || 'guest';

  // 解析JWT token获取过期时间
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // 转换为毫秒
      return Date.now() >= expirationTime;
    } catch (error) {
      console.error('解析token失败:', error);
      return true; // 解析失败视为过期
    }
  };

  useEffect(() => {
    // 从 localStorage 恢复认证状态
    const savedToken =
      localStorage.getItem('access_token') || localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      // 检查token是否过期
      if (isTokenExpired(savedToken)) {
        console.log('Token已过期，自动退出登录');
        // Token过期，清除所有认证信息
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else {
        // Token有效，恢复认证状态
        if (!localStorage.getItem('access_token')) {
          localStorage.setItem('access_token', savedToken);
        }
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(buildApiUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '登录失败');
      }

      const data = await response.json();
      const authToken = data.access_token;

      // 获取用户信息
      const userResponse = await fetch(buildApiUrl('/auth/me'), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('获取用户信息失败');
      }

      const userData = await userResponse.json();

      setToken(authToken);
      setUser(userData);
      localStorage.setItem('access_token', authToken);
      localStorage.setItem('token', authToken); // 保留旧键以兼容历史代码
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await fetch(buildApiUrl('/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '注册失败');
      }

      // 注册成功后自动登录
      await login(username, password);
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, code: string, username: string, password: string) => {
    try {
      const response = await fetch(buildApiUrl('/verification/register-with-email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
          username,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '注册失败');
      }

      // 注册成功后自动登录
      await login(username, password);
    } catch (error) {
      console.error('邮箱注册失败:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasPermissionCheck = (requiredRole: UserRole): boolean => {
    return hasPermission(currentRole, requiredRole);
  };

  const initSuperAdmin = async () => {
    try {
      const response = await fetch(buildApiUrl('/auth/init-super-admin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '初始化超级管理员失败');
      }

      const adminData = await response.json();
      console.log('超级管理员创建成功:', adminData);
    } catch (error) {
      console.error('初始化超级管理员失败:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      currentRole,
      login,
      register,
      registerWithEmail,
      logout,
      isLoading,
      hasPermission: hasPermissionCheck,
      initSuperAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
