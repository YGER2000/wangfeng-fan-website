import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, currentRole } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === 'white';

  // 如果已经登录且有管理员权限，自动跳转到后台
  useEffect(() => {
    if (user && (currentRole === 'admin' || currentRole === 'super_admin')) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, currentRole, navigate]);

  // 创建星空背景效果（仅深色模式）
  useEffect(() => {
    const container = document.getElementById('login-starfield-container');

    // 浅色模式：清空星星容器
    if (isLight) {
      if (container) {
        container.innerHTML = '';
      }
      return;
    }

    // 深色模式：创建星星
    const createStar = () => {
      const star = document.createElement('div');
      star.className = 'absolute rounded-full animate-twinkle';

      // 随机决定星星颜色（大部分白色，少部分紫色）
      const isPurple = Math.random() < 0.3; // 30%概率是紫色
      star.style.backgroundColor = isPurple ? '#a855f7' : '#ffffff'; // 紫色或白色
      star.style.opacity = isPurple ? '0.6' : '0.7';

      star.style.width = Math.random() * 2 + 1 + 'px';
      star.style.height = star.style.width;
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.animationDuration = Math.random() * 3 + 2 + 's';

      return star;
    };

    if (container) {
      // 清空之前的星星
      container.innerHTML = '';
      // 创建200颗星星
      for (let i = 0; i < 200; i++) {
        container.appendChild(createStar());
      }
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [isLight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      // 登录成功后跳转到管理后台
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* 背景 - 根据主题切换 */}
      <div className={cn(
        "absolute inset-0",
        isLight
          ? "bg-gradient-to-b from-gray-50 via-white to-gray-100"
          : "bg-gradient-to-b from-black via-purple-950/20 to-black"
      )} />
      {!isLight && <div id="login-starfield-container" className="absolute inset-0 overflow-hidden" />}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        {/* Logo 和标题 */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className={cn(
              "mx-auto h-16 w-16 flex items-center justify-center rounded-full border-2 shadow-glow mb-6",
              isLight
                ? "bg-wangfeng-purple/10 border-wangfeng-purple"
                : "bg-wangfeng-purple/20 border-wangfeng-purple"
            )}
          >
            <Lock className="h-8 w-8 text-wangfeng-purple" />
          </motion.div>
          <h2 className={cn(
            "text-3xl font-bebas tracking-wider mb-2",
            isLight ? "text-gray-900" : "text-white"
          )}>
            汪峰粉丝网
          </h2>
          <h3 className="text-xl font-bebas tracking-wider text-wangfeng-purple">
            后台管理系统
          </h3>
          <p className={cn(
            "mt-2 text-sm",
            isLight ? "text-gray-600" : "text-gray-400"
          )}>
            请使用管理员账号登录
          </p>
        </div>

        {/* 登录表单 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "mt-8 backdrop-blur-md rounded-2xl border shadow-glow p-8",
            isLight
              ? "bg-white border-gray-200"
              : "bg-black/60 border-wangfeng-purple/30"
          )}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label htmlFor="username" className={cn(
                "block text-sm font-medium mb-2",
                isLight ? "text-gray-700" : "text-gray-300"
              )}>
                用户名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-wangfeng-purple" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={cn(
                    "appearance-none block w-full pl-10 pr-3 py-3 border rounded-lg",
                    "focus:outline-none focus:ring-2 focus:ring-wangfeng-purple focus:border-transparent",
                    "transition-all duration-300",
                    isLight
                      ? "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                      : "bg-black/40 border-wangfeng-purple/40 text-white placeholder-gray-500"
                  )}
                  placeholder="请输入用户名"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className={cn(
                "block text-sm font-medium mb-2",
                isLight ? "text-gray-700" : "text-gray-300"
              )}>
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-wangfeng-purple" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "appearance-none block w-full pl-10 pr-10 py-3 border rounded-lg",
                    "focus:outline-none focus:ring-2 focus:ring-wangfeng-purple focus:border-transparent",
                    "transition-all duration-300",
                    isLight
                      ? "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                      : "bg-black/40 border-wangfeng-purple/40 text-white placeholder-gray-500"
                  )}
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn(
                    "absolute inset-y-0 right-0 pr-3 flex items-center hover:text-wangfeng-purple transition-colors",
                    isLight ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className={cn(
                    "h-4 w-4 rounded text-wangfeng-purple focus:ring-wangfeng-purple focus:ring-offset-0",
                    isLight
                      ? "border-gray-300 bg-white"
                      : "border-wangfeng-purple/40 bg-black/40"
                  )}
                />
                <label htmlFor="remember-me" className={cn(
                  "ml-2 block text-sm",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>
                  记住我
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-wangfeng-purple hover:text-wangfeng-light transition-colors">
                  忘记密码?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg",
                  "text-sm font-medium text-white bg-wangfeng-purple hover:bg-wangfeng-dark",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wangfeng-purple",
                  "transition-all duration-300 shadow-glow",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LogIn className="h-5 w-5 text-white group-hover:text-white/80" aria-hidden="true" />
                </span>
                {loading ? '登录中...' : '登录'}
              </button>
            </div>
          </form>

          <div className={cn(
            "mt-6 text-center text-xs",
            isLight ? "text-gray-500" : "text-gray-500"
          )}>
            <p>仅限管理员访问</p>
            <p className="mt-1">未经授权访问将被记录</p>
          </div>
        </motion.div>

        {/* 返回首页链接 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <a
            href="/#/"
            className={cn(
              "text-sm hover:text-wangfeng-purple transition-colors",
              isLight ? "text-gray-600" : "text-gray-400"
            )}
          >
            返回网站首页
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
