/**
 * 权限控制工具函数
 */

import { UserRole } from '@/contexts/AuthContext';

/**
 * 检查用户是否有权限发布指定分类的文章
 *
 * 权限规则：
 * - 游客：无发布权限
 * - 用户：只能发布 峰迷聊峰
 * - 管理员：可以发布 峰言峰语 和 数据科普
 * - 超级管理员：可以发布所有分类
 */
export function canPublishCategory(userRole: UserRole, categoryPrimary: string): boolean {
  if (userRole === 'super_admin') {
    return true; // 超级管理员可以发布所有分类
  }

  if (userRole === 'admin') {
    // 管理员可以发布 峰言峰语 和 数据科普
    return ['峰言峰语', '数据科普'].includes(categoryPrimary);
  }

  if (userRole === 'user') {
    // 普通用户只能发布 峰迷聊峰
    return categoryPrimary === '峰迷聊峰';
  }

  return false; // 游客无权限
}

/**
 * 获取用户可以发布的分类列表
 */
export function getAvailableCategories(userRole: UserRole): string[] {
  if (userRole === 'super_admin') {
    return ['峰言峰语', '峰迷聊峰', '数据科普'];
  }

  if (userRole === 'admin') {
    return ['峰言峰语', '数据科普'];
  }

  if (userRole === 'user') {
    return ['峰迷聊峰'];
  }

  return []; // 游客无权限
}

/**
 * 获取角色的中文名称
 */
export function getRoleChineseName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    'guest': '游客',
    'user': '用户',
    'admin': '管理员',
    'super_admin': '超级管理员'
  };
  return roleNames[role] || '未知';
}
