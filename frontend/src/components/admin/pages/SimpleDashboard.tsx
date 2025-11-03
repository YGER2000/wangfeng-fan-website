import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  Calendar,
  Video,
  Image,
  Settings,
  TrendingUp,
  Home,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface QuickLinkProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  color: string;
}

const QuickLink: React.FC<QuickLinkProps> = ({ title, description, icon, link, color }) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  return (
    <Link to={link}>
      <Card
        className={cn(
          'border transition-all hover:scale-105 cursor-pointer',
          isLight
            ? 'bg-white border-gray-200 hover:border-wangfeng-purple/40'
            : 'bg-black/60 border-wangfeng-purple/40 hover:shadow-strong-glow'
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex-1">
            <CardTitle className={cn(
              "text-lg font-semibold mb-1",
              isLight ? "text-gray-900" : "text-white"
            )}>{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
          <div className={cn('p-3 rounded-lg', color)}>{icon}</div>
        </CardHeader>
      </Card>
    </Link>
  );
};

const SimpleDashboard: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLight = theme === 'white';

  const quickLinks = [
    {
      title: '文章管理',
      description: '发布和管理文章内容',
      icon: <FileText className="w-6 h-6 text-wangfeng-purple" />,
      link: '/admin/articles/list',
      color: 'bg-wangfeng-purple/20'
    },
    {
      title: '行程管理',
      description: '管理演出和活动行程',
      icon: <Calendar className="w-6 h-6 text-blue-500" />,
      link: '/admin/manage/schedules/list',
      color: 'bg-blue-500/20'
    },
    {
      title: '视频管理',
      description: '管理视频内容',
      icon: <Video className="w-6 h-6 text-purple-500" />,
      link: '/admin/videos/list',
      color: 'bg-purple-500/20'
    },
    {
      title: '图片管理',
      description: '管理图片画廊',
      icon: <Image className="w-6 h-6 text-green-500" />,
      link: '/admin/gallery/list',
      color: 'bg-green-500/20'
    },
  ];

  return (
    <div className="space-y-6">
      {/* 欢迎卡片 */}
      <Card
        className={cn(
          'border',
          isLight ? 'bg-white border-gray-200' : 'bg-black/60 border-wangfeng-purple/40'
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-wangfeng-purple flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                管理后台
              </CardTitle>
              <CardDescription className="mt-2">
                欢迎回来，{user?.username || '管理员'}！
              </CardDescription>
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wangfeng-purple/20 text-wangfeng-purple hover:bg-wangfeng-purple/30 transition-colors border border-wangfeng-purple/40"
            >
              <Home className="w-4 h-4" />
              返回网站
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* 快捷入口 */}
      <div>
        <h2 className={cn(
          "text-lg font-semibold mb-4",
          isLight ? "text-gray-900" : "text-white"
        )}>
          快捷入口
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <QuickLink key={link.title} {...link} />
          ))}
        </div>
      </div>

      {/* 功能说明 */}
      <Card
        className={cn(
          'border',
          isLight ? 'bg-white border-gray-200' : 'bg-black/60 border-wangfeng-purple/40'
        )}
      >
        <CardHeader>
          <CardTitle className="text-wangfeng-purple flex items-center gap-2">
            <Settings className="w-5 h-5" />
            功能说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className={cn(
              "p-3 rounded-lg border",
              isLight ? "bg-gray-50 border-gray-200" : "bg-black/40 border-wangfeng-purple/30"
            )}>
              <h3 className={cn("font-medium mb-1", isLight ? "text-gray-900" : "text-white")}>
                文章管理
              </h3>
              <p className="text-gray-500">
                可以发布新文章、编辑已有文章、管理文章分类和标签
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-lg border",
              isLight ? "bg-gray-50 border-gray-200" : "bg-black/40 border-wangfeng-purple/30"
            )}>
              <h3 className={cn("font-medium mb-1", isLight ? "text-gray-900" : "text-white")}>
                行程管理
              </h3>
              <p className="text-gray-500">
                管理演唱会、Livehouse、音乐节等各类演出行程信息
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-lg border",
              isLight ? "bg-gray-50 border-gray-200" : "bg-black/40 border-wangfeng-purple/30"
            )}>
              <h3 className={cn("font-medium mb-1", isLight ? "text-gray-900" : "text-white")}>
                视频管理
              </h3>
              <p className="text-gray-500">
                管理各类视频内容，包括演出现场、MV、访谈等
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-lg border",
              isLight ? "bg-gray-50 border-gray-200" : "bg-black/40 border-wangfeng-purple/30"
            )}>
              <h3 className={cn("font-medium mb-1", isLight ? "text-gray-900" : "text-white")}>
                图片管理
              </h3>
              <p className="text-gray-500">
                上传和管理图片画廊，包括巡演返图、工作花絮、日常生活等
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 提示信息 */}
      <div className={cn(
        "p-4 rounded-lg border text-center text-sm",
        isLight
          ? "bg-blue-50 border-blue-200 text-blue-800"
          : "bg-blue-500/10 border-blue-500/30 text-blue-300"
      )}>
        <p>💡 提示：使用左侧导航栏可以快速访问各个功能模块</p>
      </div>
    </div>
  );
};

export default SimpleDashboard;
