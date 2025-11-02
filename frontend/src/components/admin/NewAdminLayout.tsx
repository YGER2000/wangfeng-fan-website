import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Video,
  Image,
  LogOut,
  Home,
  Menu,
  X,
  User,
  Tag,
  List,
  Users,
  CheckCircle,
  ClipboardCheck,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import BackgroundManager from '@/components/ui/backgrounds/BackgroundManager';

interface NavSubItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

interface NavItem {
  label: string;
  to?: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  subItems?: NavSubItem[];
}

// 普通用户菜单
const userNavItems: NavItem[] = [
  {
    label: '仪表盘',
    to: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: '我的文章',
    to: '/admin/my-articles',
    icon: FileText,
  },
  {
    label: '我的视频',
    to: '/admin/my-videos',
    icon: Video,
  },
  {
    label: '我的图片',
    to: '/admin/my-gallery',
    icon: Image,
  },
  {
    label: '个人中心',
    to: '/admin/profile',
    icon: User,
  },
];

// 管理员额外菜单
const adminNavItems: NavItem[] = [
  {
    label: '管理中心',
    icon: List,
    adminOnly: true,
    subItems: [
      {
        label: '文章管理',
        to: '/admin/manage/articles',
        icon: FileText,
      },
      {
        label: '视频管理',
        to: '/admin/manage/videos',
        icon: Video,
      },
      {
        label: '图片管理',
        to: '/admin/manage/gallery',
        icon: Image,
      },
    ],
  },
  {
    label: '行程管理',
    to: '/admin/schedules',
    icon: CalendarDays,
    adminOnly: true,
  },
  {
    label: '标签管理',
    to: '/admin/tags',
    icon: Tag,
    adminOnly: true,
  },
];

const NewAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const toggleExpandMenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  // 获取当前用户的角色
  const { currentRole } = useAuth();
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin';

  // 合并菜单项
  const allNavItems = isAdmin ? [...userNavItems, ...adminNavItems] : userNavItems;

  // 检查当前路径是否匹配导航项
  const isNavItemActive = (navPath: string) => {
    // 精确匹配或前缀匹配（包含子路由）
    if (location.pathname === navPath || location.pathname.startsWith(navPath + '/')) {
      return true;
    }

    // 特殊情况：当用户编辑自己的内容时，应该高亮对应的"我的xxx"菜单
    // 例如：在 /admin/videos/edit/:id 时高亮 /admin/my-videos
    if (navPath === '/admin/my-videos' && /^\/admin\/videos\/edit\//.test(location.pathname)) {
      // 检查是否从我的视频导航过来（通过检查 location.state）
      return true;
    }
    if (navPath === '/admin/my-articles' && /^\/admin\/articles\/edit\//.test(location.pathname)) {
      return true;
    }
    if (navPath === '/admin/my-gallery' && /^\/admin\/gallery\/edit\//.test(location.pathname)) {
      return true;
    }

    return false;
  };

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden transition-colors duration-300",
        isLight ? "bg-white" : "bg-transparent"
      )}
    >
      {/* 深色模式背景渐变与星空 */}
      {!isLight && (
        <div className="pointer-events-none absolute inset-0 -z-30 bg-[#060212]" />
      )}
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
              {allNavItems.map((item) => {
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isExpanded = expandedMenu === item.label;
                const isMenuActive = hasSubItems
                  ? item.subItems.some(sub => isNavItemActive(sub.to))
                  : isNavItemActive(item.to || '');

                if (hasSubItems) {
                  return (
                    <div key={item.label}>
                      {/* 父菜单项 */}
                      <button
                        onClick={() => toggleExpandMenu(item.label)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                          isMenuActive || isExpanded
                            ? isLight
                              ? 'bg-wangfeng-purple/10 text-wangfeng-purple border border-wangfeng-purple/30'
                              : 'bg-wangfeng-purple/20 text-wangfeng-light border border-wangfeng-purple/40'
                            : isLight
                              ? 'text-gray-700 hover:bg-gray-100 hover:text-wangfeng-purple'
                              : 'text-gray-300 hover:bg-wangfeng-purple/10 hover:text-wangfeng-light'
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </button>

                      {/* 子菜单项 */}
                      {isExpanded && (
                        <div className="mt-1 ml-4 pl-4 border-l border-wangfeng-purple/30 space-y-1">
                          {item.subItems?.map((subItem) => (
                            <Link
                              key={subItem.to}
                              to={subItem.to}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                'w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-all',
                                isNavItemActive(subItem.to)
                                  ? isLight
                                    ? 'bg-wangfeng-purple/10 text-wangfeng-purple border border-wangfeng-purple/30'
                                    : 'bg-wangfeng-purple/20 text-wangfeng-light border border-wangfeng-purple/40'
                                  : isLight
                                    ? 'text-gray-600 hover:bg-gray-100 hover:text-wangfeng-purple'
                                    : 'text-gray-400 hover:bg-wangfeng-purple/10 hover:text-wangfeng-light'
                              )}
                            >
                              <subItem.icon className="w-4 h-4" />
                              <span>{subItem.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                // 普通菜单项（没有子菜单）
                return (
                  <Link
                    key={item.to}
                    to={item.to || '#'}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                      isNavItemActive(item.to || '')
                        ? isLight
                          ? 'bg-wangfeng-purple/10 text-wangfeng-purple border border-wangfeng-purple/30'
                          : 'bg-wangfeng-purple/20 text-wangfeng-light border border-wangfeng-purple/40'
                        : isLight
                          ? 'text-gray-700 hover:bg-gray-100 hover:text-wangfeng-purple'
                          : 'text-gray-300 hover:bg-wangfeng-purple/10 hover:text-wangfeng-light'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
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
