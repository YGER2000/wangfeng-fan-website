import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Video,
  Image,
  PlusCircle,
  List,
  LogOut,
  Home,
  Menu,
  X,
  User,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import BackgroundManager from '@/components/ui/backgrounds/BackgroundManager';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: '仪表盘',
    to: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: '文章管理',
    to: '/admin/articles',
    icon: FileText,
    children: [
      { label: '发布文章', to: '/admin/articles/create', icon: PlusCircle },
      { label: '文章列表', to: '/admin/articles/list', icon: List },
    ],
  },
  {
    label: '行程管理',
    to: '/admin/schedules',
    icon: CalendarDays,
    children: [
      { label: '发布行程', to: '/admin/schedules/create', icon: PlusCircle },
      { label: '行程列表', to: '/admin/schedules/list', icon: List },
    ],
  },
  {
    label: '视频管理',
    to: '/admin/videos',
    icon: Video,
    children: [
      { label: '发布视频', to: '/admin/videos/create', icon: PlusCircle },
      { label: '视频列表', to: '/admin/videos/list', icon: List },
    ],
  },
  {
    label: '图片管理',
    to: '/admin/gallery',
    icon: Image,
    children: [
      { label: '上传图片', to: '/admin/gallery/upload', icon: PlusCircle },
      { label: '图片列表', to: '/admin/gallery/list', icon: List },
    ],
  },
  {
    label: '标签管理',
    to: '/admin/tags',
    icon: Tag,
  },
  {
    label: '个人中心',
    to: '/admin/profile',
    icon: User,
  },
];

const NewAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const toggleExpand = (itemTo: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemTo)
        ? prev.filter((item) => item !== itemTo)
        : [...prev, itemTo]
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      isLight
        ? "bg-white"
        : "bg-transparent"
    )}>
      {/* 紫色幻想星空背景（仅深色模式） */}
      {!isLight && <BackgroundManager mode={'dark'} />}
      {/* 顶部导航栏 - 始终保持深色 */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b bg-black/90 border-wangfeng-purple/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="lg:hidden text-wangfeng-purple hover:text-wangfeng-light transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <Link to="/" className="text-xl font-bebas tracking-wider text-wangfeng-purple flex items-center gap-2">
                <span>汪峰粉丝网</span>
                <span className="text-sm text-gray-400">/ 管理后台</span>
              </Link>
            </div>

            {/* 顶部导航链接 */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className="text-sm text-gray-300 hover:text-wangfeng-purple transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                返回网站
              </Link>
            </nav>

            {/* 用户信息 */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">欢迎回来</p>
                <p className="text-sm text-wangfeng-purple font-medium">{user?.username || 'Admin'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* 侧边栏 */}
        <aside
          className={cn(
            'fixed left-0 top-16 bottom-0 w-64 backdrop-blur-md border-r overflow-y-auto transition-all duration-300 z-40',
            isLight
              ? 'bg-white border-gray-200'
              : 'bg-black/60 border-wangfeng-purple/30',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div className="flex flex-col h-full">
            {/* 导航菜单 */}
            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => (
                <div key={item.to}>
                  {item.children ? (
                    <>
                      <button
                        onClick={() => toggleExpand(item.to)}
                        className={cn(
                          'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                          isActive(item.to)
                            ? isLight
                              ? 'bg-wangfeng-purple/10 text-wangfeng-purple border border-wangfeng-purple/30'
                              : 'bg-wangfeng-purple/20 text-wangfeng-light border border-wangfeng-purple/40'
                            : isLight
                              ? 'text-gray-700 hover:bg-gray-100 hover:text-wangfeng-purple'
                              : 'text-gray-300 hover:bg-wangfeng-purple/10 hover:text-wangfeng-light'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedItems.includes(item.to) ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </button>
                      {expandedItems.includes(item.to) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-4 mt-2 space-y-1"
                        >
                          {item.children.map((child) => (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              onClick={() => setSidebarOpen(false)}
                              className={({ isActive }) =>
                                cn(
                                  'flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all',
                                  isActive
                                    ? isLight
                                      ? 'bg-wangfeng-purple/10 text-wangfeng-purple'
                                      : 'bg-wangfeng-purple/20 text-wangfeng-light'
                                    : isLight
                                      ? 'text-gray-600 hover:bg-gray-100 hover:text-wangfeng-purple'
                                      : 'text-gray-400 hover:bg-wangfeng-purple/10 hover:text-wangfeng-light'
                                )
                              }
                            >
                              <child.icon className="w-4 h-4" />
                              <span>{child.label}</span>
                            </NavLink>
                          ))}
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <NavLink
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                          isActive
                            ? isLight
                              ? 'bg-wangfeng-purple/10 text-wangfeng-purple border border-wangfeng-purple/30'
                              : 'bg-wangfeng-purple/20 text-wangfeng-light border border-wangfeng-purple/40'
                            : isLight
                              ? 'text-gray-700 hover:bg-gray-100 hover:text-wangfeng-purple'
                              : 'text-gray-300 hover:bg-wangfeng-purple/10 hover:text-wangfeng-light'
                        )
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  )}
                </div>
              ))}
            </div>

            {/* 底部退出按钮 */}
            <div className={cn(
              "p-4 border-t",
              isLight ? "border-gray-200" : "border-wangfeng-purple/30"
            )}>
              <button
                onClick={handleLogout}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  isLight
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                )}
              >
                <LogOut className="w-5 h-5" />
                <span>退出登录</span>
              </button>
            </div>
          </div>
        </aside>

        {/* 遮罩层（移动端） */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* 主内容区：充满可视区域，高度固定，避免页面最右滚动条 */}
        <main className="flex-1 lg:ml-64 p-0">
          <div className="w-full h-[calc(100vh-4rem)] overflow-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewAdminLayout;
