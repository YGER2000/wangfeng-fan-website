import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Users,
  ShieldCheck,
  LogOut,
  Bell,
  RefreshCcw,
  Search,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

const navItems = [
  { label: '概览', to: '/admin', icon: LayoutDashboard },
  { label: '文章审核', to: '/admin/review', icon: FileText },
  { label: '行程管理', to: '/admin/schedules', icon: CalendarDays },
  { label: '视频管理', to: '/admin/videos', icon: Video },
  { label: '用户与角色', to: '/admin/users', icon: Users },
  { label: '审计日志', to: '/admin/audit', icon: ShieldCheck },
];

const AdminLayout = () => {
  const { theme } = useTheme();
  const { logout, user } = useAuth();
  const location = useLocation();
  const isLight = theme === 'white';

  const activeTitle = useMemo(() => {
    const matchingItem = navItems.find((item) => location.pathname.startsWith(item.to));
    return matchingItem?.label ?? '概览';
  }, [location.pathname]);

  return (
    <div className={cn(
      "relative overflow-hidden pt-24 pb-12",
      isLight ? "bg-gray-50" : ""
    )}>
      <div
        className={cn(
          'absolute inset-0 -z-10 opacity-80',
          isLight
            ? 'bg-white'
            : 'bg-gradient-to-br from-black via-wangfeng-black to-wangfeng-purple/20'
        )}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:px-8">
        <aside
          className={cn(
            'w-full shrink-0 rounded-2xl border shadow-glow backdrop-blur-md transition-colors lg:max-w-xs',
            isLight
              ? 'bg-white border-gray-200 text-gray-900'
              : 'bg-black/40 border-wangfeng-purple/40 text-gray-100'
          )}
        >
          <div className={cn(
            "flex items-center justify-between gap-3 border-b px-5 py-4",
            isLight ? "border-gray-200" : "border-wangfeng-purple/30"
          )}>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-wangfeng-purple">WANG FENG</p>
              <h2 className="text-lg font-semibold text-wangfeng-purple/90">后台运营中心</h2>
            </div>
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold',
                isLight
                  ? 'bg-wangfeng-purple/10 border-wangfeng-purple/30 text-wangfeng-purple'
                  : 'bg-black/50 border-wangfeng-purple/60 text-wangfeng-light'
              )}
            >
              管理
            </div>
          </div>

          <nav className="flex flex-col gap-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300',
                      isActive
                        ? isLight
                          ? 'border border-wangfeng-purple/40 bg-wangfeng-purple/10 text-wangfeng-purple'
                          : 'border border-wangfeng-purple/60 bg-wangfeng-purple/20 text-wangfeng-light'
                        : isLight
                          ? 'text-gray-700 hover:bg-gray-100 hover:text-wangfeng-purple'
                          : 'text-gray-300 hover:bg-wangfeng-purple/10 hover:text-wangfeng-light'
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  <span
                    className={cn(
                      'ml-auto h-2 w-2 rounded-full transition-opacity duration-300',
                      location.pathname.startsWith(item.to)
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-50'
                    )}
                    style={{
                      boxShadow: '0 0 10px rgba(139, 92, 246, 0.8)',
                      backgroundColor: '#8B5CF6',
                    }}
                  />
                </NavLink>
              );
            })}
          </nav>

          <div className={cn(
            "border-t px-5 py-4 text-xs",
            isLight
              ? "border-gray-200 text-gray-600"
              : "border-wangfeng-purple/30 text-gray-500"
          )}>
            <p>当前账号：</p>
            <p className="mt-1 font-medium text-wangfeng-purple">
              {user?.username || '管理员'}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className={cn(
              'mx-4 mb-4 flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
              isLight
                ? 'border-wangfeng-purple/30 text-wangfeng-purple hover:bg-wangfeng-purple/10'
                : 'border-wangfeng-purple/30 text-wangfeng-light hover:bg-wangfeng-purple/20'
            )}
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </aside>

        <section className="flex-1 space-y-6">
          <header className="flex flex-col gap-4 rounded-2xl border border-wangfeng-purple/30 p-6 shadow-glow backdrop-blur-md lg:flex-row lg:items-center lg:justify-between bg-black/50">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-wangfeng-purple">{new Date().toLocaleDateString('zh-CN')}</p>
              <h1 className="mt-2 text-2xl font-bold text-wangfeng-purple">
                {activeTitle}
              </h1>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-xl border border-wangfeng-purple/40 bg-black/60 text-gray-200 px-3 py-2 text-sm shadow-inner transition-colors">
                <Search className="h-4 w-4 text-wangfeng-purple" />
                <input
                  type="search"
                  placeholder="快速检索内容、用户或操作"
                  className="w-full bg-transparent text-sm outline-none text-gray-200 placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-wangfeng-purple/40 bg-black/60 text-wangfeng-light hover:bg-wangfeng-purple/30 transition-colors"
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-wangfeng-purple/40 bg-black/60 text-wangfeng-light hover:bg-wangfeng-purple/30 transition-colors"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    3
                  </span>
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-6">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminLayout;
