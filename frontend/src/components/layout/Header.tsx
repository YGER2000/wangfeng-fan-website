import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import {
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, currentRole } = useAuth();
  const isLightMode = theme === 'white';

  const navigation = [
    { name: '首页', path: '/' },
    { name: '关于汪峰', path: '/about' },
    { name: '行程信息', path: '/tour-dates' },
    { name: '音乐作品', path: '/discography' },
    { name: '视频精选', path: '/video-archive' },
    { name: '图片画廊', path: '/gallery' },
    { name: '资料科普', path: '/shu-ju-ke-pu' },
    { name: '峰言峰语', path: '/feng-yan-feng-yu' },
    { name: '峰迷荟萃', path: '/feng-mi-liao-feng' },
    { name: '游戏活动', path: '/game-activity' },
    { name: '关于本站', path: '/about-site' },
  ];

  // 判断当前路径是否匹配导航项
  const isCurrentPath = (itemPath: string) => {
    return location.pathname === itemPath;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 处理后台管理按钮点击
  const handleAdminClick = () => {
    setIsMenuOpen(false);
    // 检查是否已登录且有管理权限
    if (user && (currentRole === 'admin' || currentRole === 'super_admin')) {
      navigate('/admin/dashboard');
    } else {
      // 未登录或权限不足，跳转到登录页
      navigate('/admin');
    }
  };

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-wangfeng-purple/30',
      'bg-black/90'  // 固定为黑色背景，不随主题变化
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
                    'text-base font-medium transition-all duration-300 relative group text-white',  // 固定为白色文字
                    isCurrentPath(item.path)
                      ? 'text-wangfeng-purple'
                      : 'hover:text-wangfeng-purple'
                  )}
                >
                  {item.name}
                  {/* Current page underline */}
                  {isCurrentPath(item.path) && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-wangfeng-purple"></span>
                  )}
                  {/* Hover underline animation */}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-wangfeng-purple transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </nav>
          </div>

          {/* 右侧：主题切换和后台管理按钮 */}
          <div className="hidden lg:flex items-center space-x-4">
            <button
              type="button"
              onClick={toggleTheme}
              className={cn(
                'flex items-center justify-center rounded-full border px-3 py-2 transition-colors',
                'border-wangfeng-purple/50 bg-black/60 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white'
              )}
              title={`切换到${isLightMode ? '深色模式' : '浅色模式'}`}
            >
              {isLightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              onClick={handleAdminClick}
              className="flex items-center space-x-2 rounded-lg bg-wangfeng-purple px-4 py-2 text-white transition-colors hover:bg-wangfeng-purple/80"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">后台管理</span>
            </button>
          </div>

          {/* 移动端菜单按钮 */}
          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className={cn(
                'transition-colors hover:text-wangfeng-purple',
                'text-white'  // 固定为白色文字
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
                  'bg-black/60 text-wangfeng-purple border border-wangfeng-purple/40'  // 固定为黑色背景和紫色文字
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
                    isCurrentPath(item.path)
                      ? 'text-wangfeng-purple'
                      : 'text-white'  // 固定为白色文字
                  )}
                >
                  {item.name}
                </Link>
              ))}

              {/* 移动端后台管理按钮 */}
              <div className="mt-4">
                <button
                  onClick={handleAdminClick}
                  className="w-full flex items-center justify-center space-x-2 rounded-lg bg-wangfeng-purple px-4 py-2 text-white transition-colors hover:bg-wangfeng-purple/80"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">后台管理</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
