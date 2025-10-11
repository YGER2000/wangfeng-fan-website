import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, User, Mail, Lock, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    verificationCode: '',
  });

  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);

  const { login, registerWithEmail } = useAuth();

  const sendVerificationCode = async () => {
    if (!formData.email) {
      setError('请先输入邮箱地址');
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      const response = await fetch('http://localhost:1994/api/verification/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          type: 'register',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '发送验证码失败');
      }

      setCodeSent(true);
      setCountdown(60);

      // 倒计时
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err: any) {
      setError(err.message || '发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(formData.username, formData.password);
      } else {
        // 使用邮箱验证码注册
        await registerWithEmail(
          formData.email,
          formData.verificationCode,
          formData.username,
          formData.password
        );
      }
      onClose();
      setFormData({ username: '', email: '', password: '', verificationCode: '' });
      setCodeSent(false);
      setCountdown(0);
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setFormData({ username: '', email: '', password: '', verificationCode: '' });
    setCodeSent(false);
    setCountdown(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen p-4">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          {/* 模态框容器 - 确保完全居中 */}
          <div className="relative flex items-center justify-center w-full h-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
              style={{ maxWidth: '400px' }}
            >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* 标题 */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'login' ? '登录账户' : '注册账户'}
            </h2>
            <p className="text-gray-400">
              {mode === 'login' ? '欢迎回到汪峰粉丝社区' : '加入汪峰粉丝大家庭'}
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 邮箱（注册时优先显示） */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  邮箱地址
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:border-wangfeng-purple focus:outline-none transition-colors"
                    placeholder="请输入邮箱地址"
                    required
                  />
                </div>
              </div>
            )}

            {/* 验证码（仅注册时显示） */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  邮箱验证码
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.verificationCode}
                      onChange={(e) => handleInputChange('verificationCode', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:border-wangfeng-purple focus:outline-none transition-colors"
                      placeholder="请输入验证码"
                      required
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={sendVerificationCode}
                    disabled={sendingCode || countdown > 0 || !formData.email}
                    className="px-4 py-3 bg-wangfeng-purple hover:bg-wangfeng-purple/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
                  >
                    {sendingCode ? (
                      '发送中...'
                    ) : countdown > 0 ? (
                      `${countdown}s`
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {codeSent ? '重新发送' : '发送验证码'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {mode === 'register' ? '昵称' : '用户名'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:border-wangfeng-purple focus:outline-none transition-colors"
                  placeholder={mode === 'register' ? '请输入昵称' : '请输入用户名'}
                  required
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:border-wangfeng-purple focus:outline-none transition-colors"
                  placeholder="请输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-wangfeng-purple hover:bg-wangfeng-purple/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
            >
              {isLoading ? '处理中...' : (mode === 'login' ? '登录' : '注册')}
            </button>
          </form>

          {/* 切换模式 */}
          <div className="text-center mt-6">
            <p className="text-gray-400">
              {mode === 'login' ? '还没有账户？' : '已有账户？'}
              <button
                onClick={switchMode}
                className="text-wangfeng-purple hover:text-wangfeng-purple/80 font-medium ml-1 transition-colors"
              >
                {mode === 'login' ? '立即注册' : '立即登录'}
              </button>
            </p>
          </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;