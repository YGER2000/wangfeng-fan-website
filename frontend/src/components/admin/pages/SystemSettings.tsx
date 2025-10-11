import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Settings,
  Globe,
  Bell,
  Shield,
  Database,
  Mail,
  Palette,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SystemSettings: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  // General Settings State
  const [siteName, setSiteName] = useState('汪峰粉丝网站');
  const [siteDescription, setSiteDescription] = useState('中国摇滚音乐人汪峰官方粉丝网站');
  const [siteKeywords, setSiteKeywords] = useState('汪峰,摇滚,音乐,演唱会');

  // Notification Settings State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);

  // Security Settings State
  const [requireEmailVerification, setRequireEmailVerification] = useState(true);
  const [enableCaptcha, setEnableCaptcha] = useState(true);
  const [passwordMinLength, setPasswordMinLength] = useState(8);

  // Appearance Settings State
  const [primaryColor, setPrimaryColor] = useState('#8B5CF6');
  const [defaultTheme, setDefaultTheme] = useState('dark');

  const settingsSections = [
    {
      id: 'general',
      title: '网站基础设置',
      icon: Globe,
      content: (
        <div className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-700' : 'text-gray-300')}>
              网站名称
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className={cn(
                'w-full px-4 py-2 rounded-lg border transition-colors',
                isLight
                  ? 'bg-white border-wangfeng-purple/20 focus:border-wangfeng-purple'
                  : 'bg-black/40 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple'
              )}
            />
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-700' : 'text-gray-300')}>
              网站描述
            </label>
            <textarea
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              rows={3}
              className={cn(
                'w-full px-4 py-2 rounded-lg border transition-colors',
                isLight
                  ? 'bg-white border-wangfeng-purple/20 focus:border-wangfeng-purple'
                  : 'bg-black/40 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple'
              )}
            />
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-700' : 'text-gray-300')}>
              SEO 关键词
            </label>
            <input
              type="text"
              value={siteKeywords}
              onChange={(e) => setSiteKeywords(e.target.value)}
              className={cn(
                'w-full px-4 py-2 rounded-lg border transition-colors',
                isLight
                  ? 'bg-white border-wangfeng-purple/20 focus:border-wangfeng-purple'
                  : 'bg-black/40 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple'
              )}
              placeholder="多个关键词用逗号分隔"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'notifications',
      title: '通知设置',
      icon: Bell,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={cn('font-medium', isLight ? 'text-gray-700' : 'text-gray-300')}>
                邮件通知
              </p>
              <p className="text-sm text-gray-500">接收系统邮件通知</p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                emailNotifications ? 'bg-wangfeng-purple' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform',
                  emailNotifications && 'transform translate-x-6'
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn('font-medium', isLight ? 'text-gray-700' : 'text-gray-300')}>
                评论通知
              </p>
              <p className="text-sm text-gray-500">新评论时发送通知</p>
            </div>
            <button
              onClick={() => setCommentNotifications(!commentNotifications)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                commentNotifications ? 'bg-wangfeng-purple' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform',
                  commentNotifications && 'transform translate-x-6'
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn('font-medium', isLight ? 'text-gray-700' : 'text-gray-300')}>
                系统通知
              </p>
              <p className="text-sm text-gray-500">接收系统更新通知</p>
            </div>
            <button
              onClick={() => setSystemNotifications(!systemNotifications)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                systemNotifications ? 'bg-wangfeng-purple' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform',
                  systemNotifications && 'transform translate-x-6'
                )}
              />
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 'security',
      title: '安全设置',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={cn('font-medium', isLight ? 'text-gray-700' : 'text-gray-300')}>
                邮箱验证
              </p>
              <p className="text-sm text-gray-500">新用户注册需要邮箱验证</p>
            </div>
            <button
              onClick={() => setRequireEmailVerification(!requireEmailVerification)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                requireEmailVerification ? 'bg-wangfeng-purple' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform',
                  requireEmailVerification && 'transform translate-x-6'
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn('font-medium', isLight ? 'text-gray-700' : 'text-gray-300')}>
                验证码保护
              </p>
              <p className="text-sm text-gray-500">启用登录和注册验证码</p>
            </div>
            <button
              onClick={() => setEnableCaptcha(!enableCaptcha)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                enableCaptcha ? 'bg-wangfeng-purple' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform',
                  enableCaptcha && 'transform translate-x-6'
                )}
              />
            </button>
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-700' : 'text-gray-300')}>
              密码最小长度
            </label>
            <input
              type="number"
              value={passwordMinLength}
              onChange={(e) => setPasswordMinLength(parseInt(e.target.value))}
              min={6}
              max={20}
              className={cn(
                'w-32 px-4 py-2 rounded-lg border transition-colors',
                isLight
                  ? 'bg-white border-wangfeng-purple/20 focus:border-wangfeng-purple'
                  : 'bg-black/40 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple'
              )}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'appearance',
      title: '外观设置',
      icon: Palette,
      content: (
        <div className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-700' : 'text-gray-300')}>
              主题色
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg border transition-colors',
                  isLight
                    ? 'bg-white border-wangfeng-purple/20 focus:border-wangfeng-purple'
                    : 'bg-black/40 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple'
                )}
              />
            </div>
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-700' : 'text-gray-300')}>
              默认主题
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setDefaultTheme('light')}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg border-2 transition-all',
                  defaultTheme === 'light'
                    ? 'border-wangfeng-purple bg-wangfeng-purple/10'
                    : 'border-gray-300 hover:border-wangfeng-purple/50'
                )}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">☀️</div>
                  <div className="text-sm font-medium">浅色模式</div>
                </div>
              </button>
              <button
                onClick={() => setDefaultTheme('dark')}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg border-2 transition-all',
                  defaultTheme === 'dark'
                    ? 'border-wangfeng-purple bg-wangfeng-purple/10'
                    : 'border-gray-300 hover:border-wangfeng-purple/50'
                )}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🌙</div>
                  <div className="text-sm font-medium">深色模式</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'email',
      title: '邮件服务器',
      icon: Mail,
      content: (
        <div className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-700' : 'text-gray-300')}>
              SMTP 服务器
            </label>
            <input
              type="text"
              placeholder="smtp.example.com"
              className={cn(
                'w-full px-4 py-2 rounded-lg border transition-colors',
                isLight
                  ? 'bg-white border-wangfeng-purple/20 focus:border-wangfeng-purple'
                  : 'bg-black/40 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple'
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-700' : 'text-gray-300')}>
                端口
              </label>
              <input
                type="number"
                placeholder="587"
                className={cn(
                  'w-full px-4 py-2 rounded-lg border transition-colors',
                  isLight
                    ? 'bg-white border-wangfeng-purple/20 focus:border-wangfeng-purple'
                    : 'bg-black/40 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple'
                )}
              />
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-700' : 'text-gray-300')}>
                加密方式
              </label>
              <select
                className={cn(
                  'w-full px-4 py-2 rounded-lg border transition-colors',
                  isLight
                    ? 'bg-white border-wangfeng-purple/20 focus:border-wangfeng-purple'
                    : 'bg-black/40 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple'
                )}
              >
                <option>TLS</option>
                <option>SSL</option>
                <option>无</option>
              </select>
            </div>
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-700' : 'text-gray-300')}>
              发件人邮箱
            </label>
            <input
              type="email"
              placeholder="noreply@wangfeng.com"
              className={cn(
                'w-full px-4 py-2 rounded-lg border transition-colors',
                isLight
                  ? 'bg-white border-wangfeng-purple/20 focus:border-wangfeng-purple'
                  : 'bg-black/40 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple'
              )}
            />
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-700' : 'text-gray-300')}>
              发件人密码
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className={cn(
                'w-full px-4 py-2 rounded-lg border transition-colors',
                isLight
                  ? 'bg-white border-wangfeng-purple/20 focus:border-wangfeng-purple'
                  : 'bg-black/40 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple'
              )}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-wangfeng-purple/40 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white"
          >
            发送测试邮件
          </Button>
        </div>
      ),
    },
    {
      id: 'database',
      title: '数据库管理',
      icon: Database,
      content: (
        <div className="space-y-4">
          <div className={cn(
            'p-4 rounded-lg border',
            isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800/40'
          )}>
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
              数据库连接状态: <span className="font-medium">正常</span>
            </p>
            <p className="text-xs text-gray-500">
              上次备份时间: 2024-01-15 10:30:25
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-wangfeng-purple hover:bg-wangfeng-purple/90 text-white"
            >
              <Database className="w-3 h-3 mr-1" />
              立即备份
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-wangfeng-purple/40 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              恢复备份
            </Button>
          </div>
          <div className={cn(
            'p-4 rounded-lg border',
            isLight ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-900/20 border-yellow-800/40'
          )}>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-2">
              危险操作
            </p>
            <p className="text-xs text-gray-500 mb-3">
              以下操作可能会导致数据丢失，请谨慎操作
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white"
            >
              清空缓存
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn('text-2xl font-bold', isLight ? 'text-gray-800' : 'text-white')}>
            系统设置
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            配置网站的各项系统参数
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-wangfeng-purple/40 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            恢复默认
          </Button>
          <Button
            size="sm"
            className="bg-wangfeng-purple hover:bg-wangfeng-purple/90 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            保存设置
          </Button>
        </div>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <Card
          key={section.id}
          className={cn(
            'border-wangfeng-purple/40',
            isLight ? 'bg-white/90' : 'bg-black/60'
          )}
        >
          <CardHeader>
            <CardTitle className="text-wangfeng-purple flex items-center gap-2">
              <section.icon className="w-5 h-5" />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {section.content}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SystemSettings;
