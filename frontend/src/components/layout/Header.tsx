import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import {
  User,
  LogOut,
  PenSquare,
  UserCircle2,
  ChevronDown,
  CalendarPlus,
  ClipboardCheck,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/ui/AuthModal';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, currentRole } = useAuth();
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const { theme, toggleTheme } = useTheme();
  const isLightMode = theme === 'white';

  const navigation = [
    { name: '首页', path: '/' },
    { name: '关于汪峰', path: '/about' },
    { name: '音乐作品', path: '/discography' },
    { name: '行程信息', path: '/tour-dates' },
    { name: '图片画廊', path: '/gallery' },
    { name: '峰言峰语', path: '/feng-yan-feng-yu' },
    { name: '峰迷聊峰', path: '/feng-mi-liao-feng' },
    { name: '数据科普', path: '/shu-ju-ke-pu' },
    { name: '获奖记录', path: '/awards' },
    { name: '最新动态', path: '/news' },
    { name: '联系我们', path: '/contact' },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
    setIsActionMenuOpen(false);
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWriteArticle = () => {
    if (currentRole === 'guest') return;
    setIsActionMenuOpen(false);
    setIsMenuOpen(false);
    navigate('/write-article');
  };

  const handleLogout = () => {
    setIsActionMenuOpen(false);
    setIsMenuOpen(false);
    logout();
  };

  const handlePublishSchedule = () => {
    if (currentRole === 'guest') return;
    setIsActionMenuOpen(false);
    setIsMenuOpen(false);
    navigate('/publish-schedule');
  };

  useEffect(() => {
    if (!isActionMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isActionMenuOpen]);

  const actionMenuItems = [
    {
      key: 'write-article',
      label: '写文章',
      onSelect: currentRole !== 'guest' ? handleWriteArticle : undefined,
      icon: PenSquare,
      disabled: currentRole === 'guest',
    },
    {
      key: 'publish-schedule',
      label: '发布行程',
      onSelect: currentRole !== 'guest' ? handlePublishSchedule : undefined,
      icon: CalendarPlus,
      disabled: currentRole === 'guest',
    },
    {
      key: 'review',
      label: '审核',
      icon: ClipboardCheck,
      disabled: true,
    },
    {
      key: 'admin',
      label: '管理',
      icon: Settings,
      disabled: true,
    },
    {
      key: 'profile',
      label: '个人资料',
      disabled: true,
    },
    {
      key: 'logout',
      label: '退出登录',
      onSelect: handleLogout,
      icon: LogOut,
    },
  ];

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-wangfeng-purple/30',
      isLightMode ? 'bg-white/90' : 'bg-black/90'
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 左侧 Logo 或标题（可选） */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-wangfeng-purple">
            感受峰 感受存在
            </Link>
          </div>

          {/* 中央导航 */}
          <div className="flex-1 flex justify-center">
            {/* Desktop Navigation - centered with underline animation */}
            <nav className="hidden lg:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={handleLinkClick}
                  className={cn(
                    'text-base font-medium transition-all duration-300 relative group',
                    location.pathname === item.path
                      ? 'text-wangfeng-purple'
                      : isLightMode
                      ? 'theme-text-primary hover:text-wangfeng-purple'
                      : 'text-white hover:text-wangfeng-purple'
                  )}
                >
                  {item.name}
                  {/* Current page underline */}
                  {location.pathname === item.path && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-wangfeng-purple"></span>
                  )}
                  {/* Hover underline animation */}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-wangfeng-purple transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </nav>
          </div>

          {/* 右侧：用户操作菜单或登录按钮 */}
          <div className="hidden lg:flex items-center space-x-4">
            <button
              type="button"
              onClick={toggleTheme}
              className={cn(
                'flex items-center justify-center rounded-full border px-3 py-2 transition-colors',
                isLightMode
                  ? 'border-wangfeng-purple/40 bg-white/80 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white'
                  : 'border-wangfeng-purple/50 bg-black/60 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white'
              )}
              title={`切换到${isLightMode ? '深色模式' : '浅色模式'}`}
            >
              {isLightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            {user ? (
              <div className="relative" ref={actionMenuRef}>
                <button
                  onClick={() => setIsActionMenuOpen((prev) => !prev)}
                  className={cn(
                    'flex items-center gap-2 rounded-full border border-wangfeng-purple/50 px-3 py-2 text-sm transition-colors hover:border-wangfeng-purple',
                    isLightMode
                      ? 'bg-white/80 text-wangfeng-purple'
                      : 'bg-black/60 text-white'
                  )}
                  aria-haspopup="true"
                  aria-expanded={isActionMenuOpen}
                >
                  <UserCircle2 className="w-5 h-5 text-wangfeng-purple" />
                  <ChevronDown className="w-4 h-4 text-wangfeng-purple" />
                </button>

                {isActionMenuOpen && (
                  <div
                    className={cn(
                      'absolute right-0 mt-2 w-52 rounded-xl border border-wangfeng-purple/30 p-2 shadow-glow backdrop-blur-md',
                      isLightMode ? 'bg-white/95 text-gray-800' : 'bg-black/90'
                    )}
                  >
                    {actionMenuItems.map((item) => {
                      const ItemIcon = item.icon;
                      const isLogout = item.key === 'logout';

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            if (item.disabled || !item.onSelect) return;
                            item.onSelect();
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                            item.disabled
                              ? 'cursor-not-allowed text-gray-500'
                              : isLightMode
                              ? 'theme-text-primary hover:bg-wangfeng-purple/20'
                              : 'text-white hover:bg-wangfeng-purple/20',
                            isLogout && !item.disabled && 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                          )}
                          disabled={item.disabled}
                        >
                          {ItemIcon && <ItemIcon className="w-4 h-4" />}
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center space-x-2 rounded-lg bg-wangfeng-purple px-4 py-2 text-white transition-colors hover:bg-wangfeng-purple/80"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">登录</span>
              </button>
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className={cn(
                'transition-colors hover:text-wangfeng-purple',
                isLightMode ? 'theme-text-primary' : 'text-white'
              )}
            >
              {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-wangfeng-purple/30">
            <nav className="flex flex-col space-y-2">
              <button
                type="button"
                onClick={toggleTheme}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
                  isLightMode
                    ? 'bg-white text-wangfeng-purple border border-wangfeng-purple/40'
                    : 'bg-black/60 text-wangfeng-purple border border-wangfeng-purple/40'
                )}
              >
                {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {isLightMode ? '深色模式' : '浅色模式'}
              </button>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={handleLinkClick}
                  className={cn(
                    'block text-sm font-medium py-2 transition-colors hover:text-wangfeng-purple',
                    location.pathname === item.path
                      ? 'text-wangfeng-purple'
                      : isLightMode
                      ? 'theme-text-primary'
                      : 'text-white'
                  )}
                >
                  {item.name}
                </Link>
              ))}

              {/* 移动端用户操作或登录按钮 */}
              <div className="mt-4 space-y-2">
                {user ? (
                  <div className={cn(
                    'space-y-1 rounded-xl border border-wangfeng-purple/30 p-2',
                    isLightMode ? 'bg-white/80' : 'bg-black/80'
                  )}>
                    {actionMenuItems.map((item) => {
                      const ItemIcon = item.icon;
                      const isLogout = item.key === 'logout';

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            if (item.disabled || !item.onSelect) return;
                            item.onSelect();
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                            item.disabled
                              ? 'cursor-not-allowed text-gray-500'
                              : isLightMode
                              ? 'theme-text-primary hover:bg-wangfeng-purple/20'
                              : 'text-white hover:bg-wangfeng-purple/20',
                            isLogout && !item.disabled && 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                          )}
                          disabled={item.disabled}
                        >
                          {ItemIcon && <ItemIcon className="w-4 h-4" />}
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsAuthModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 rounded-lg bg-wangfeng-purple px-4 py-2 text-white transition-colors hover:bg-wangfeng-purple/80"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">登录</span>
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}

        {/* 认证模态框 */}
        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    </header>
  );
};

export default Header;
