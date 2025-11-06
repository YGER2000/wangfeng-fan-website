import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, FileText, MessageSquare, Heart, Camera, Lock, Upload } from 'lucide-react';
import { cn, withBasePath } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/config/api';

interface ProfileStats {
  article_count: number;
  comment_count: number;
  like_count: number;
}

interface ProfileData {
  id: number;
  username: string;
  email: string;
  avatar: string;
  avatar_thumb: string;
  role: string;
  status: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  stats: ProfileStats;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category_primary: string;
  category_secondary: string;
  status: string;
  review_status: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [myArticles, setMyArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'articles' | 'security'>('info');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 修改密码表单
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  useEffect(() => {
    if (activeTab === 'articles') {
      loadMyArticles();
    }
  }, [activeTab]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildApiUrl('/profile/me'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('加载个人信息失败');

      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('加载个人信息失败');
    } finally {
      setLoading(false);
    }
  };

  const loadMyArticles = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(buildApiUrl('/profile/my-articles?limit=50'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('加载文章列表失败');

      const data = await response.json();
      setMyArticles(data.articles);
    } catch (error) {
      console.error('Error loading articles:', error);
      alert('加载文章列表失败');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小（最大10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过10MB');
      return;
    }

    // 预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 上传
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('access_token');
      const response = await fetch(buildApiUrl('/profile/avatar'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('上传失败');

      const data = await response.json();
      alert('头像上传成功！');

      // 重新加载个人信息
      await loadProfileData();
      setAvatarPreview(null);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('头像上传失败');
      setAvatarPreview(null);
    }

    // 清空input
    event.target.value = '';
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('两次输入的新密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      alert('新密码长度不能少于6位');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('old_password', oldPassword);
      formData.append('new_password', newPassword);

      const token = localStorage.getItem('access_token');
      const response = await fetch(buildApiUrl('/profile/password'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '修改失败');
      }

      alert('密码修改成功！');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(error.message || '密码修改失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent theme-text-primary py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple mx-auto mb-4"></div>
          <p className="text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  if (!profileData || !user) {
    return (
      <div className="min-h-screen bg-transparent theme-text-primary py-20 flex items-center justify-center">
        <p>请先登录</p>
      </div>
    );
  }

  const currentAvatar = avatarPreview || withBasePath(profileData.avatar_thumb);

  return (
    <div className="min-h-screen bg-transparent theme-text-primary py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 页头 */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bebas tracking-wider theme-text-primary mb-4">
              个人中心 <span className="text-wangfeng-purple animate-pulse-glow">PROFILE</span>
            </h1>
            <p className="theme-text-muted">管理你的个人信息和内容</p>
          </div>

          {/* 个人卡片 */}
          <div className="theme-bg-card rounded-2xl border theme-border-primary shadow-glow p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* 头像 */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-wangfeng-purple shadow-lg">
                  <img
                    src={currentAvatar}
                    alt="用户头像"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={handleAvatarClick}
                  className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Camera className="h-8 w-8 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              {/* 基本信息 */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold theme-text-primary mb-2">{profileData.username}</h2>
                <p className="theme-text-muted mb-4">{profileData.email}</p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-wangfeng-purple" />
                    <span className="theme-text-muted">
                      加入于 {new Date(profileData.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  {profileData.last_login && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-wangfeng-purple" />
                      <span className="theme-text-muted">
                        上次登录 {new Date(profileData.last_login).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 统计数据 */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-wangfeng-purple">{profileData.stats.article_count}</div>
                  <div className="text-sm theme-text-muted">文章</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-wangfeng-purple">{profileData.stats.comment_count}</div>
                  <div className="text-sm theme-text-muted">评论</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-wangfeng-purple">{profileData.stats.like_count}</div>
                  <div className="text-sm theme-text-muted">点赞</div>
                </div>
              </div>
            </div>
          </div>

          {/* 选项卡 */}
          <div className="flex gap-4 mb-8 border-b theme-border-primary">
            {[
              { key: 'info' as const, label: '基本信息', icon: User },
              { key: 'articles' as const, label: '我的文章', icon: FileText },
              { key: 'security' as const, label: '账号安全', icon: Lock },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 border-b-2 transition-colors',
                  activeTab === tab.key
                    ? 'border-wangfeng-purple text-wangfeng-purple'
                    : 'border-transparent theme-text-muted hover:text-wangfeng-purple'
                )}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* 选项卡内容 */}
          <div className="theme-bg-card rounded-2xl border theme-border-primary shadow-glow p-8">
            {activeTab === 'info' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-wangfeng-purple mb-6">基本信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 theme-text-muted">用户名</label>
                    <div className="theme-bg-secondary rounded-lg px-4 py-3 theme-text-primary">
                      {profileData.username}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 theme-text-muted">邮箱</label>
                    <div className="theme-bg-secondary rounded-lg px-4 py-3 theme-text-primary">
                      {profileData.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 theme-text-muted">角色</label>
                    <div className="theme-bg-secondary rounded-lg px-4 py-3 theme-text-primary">
                      {profileData.role === 'super_admin' ? '超级管理员' : profileData.role === 'admin' ? '管理员' : '普通用户'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 theme-text-muted">账号状态</label>
                    <div className="theme-bg-secondary rounded-lg px-4 py-3 theme-text-primary">
                      {profileData.status === 'active' ? '正常' : '已封禁'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'articles' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-wangfeng-purple mb-6">我的文章</h3>
                {myArticles.length === 0 ? (
                  <div className="text-center py-12 theme-text-muted">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>暂无文章</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myArticles.map((article) => (
                      <div
                        key={article.id}
                        className="theme-bg-secondary rounded-lg p-6 hover:border-wangfeng-purple/50 border border-transparent transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-xl font-semibold theme-text-primary mb-2">{article.title}</h4>
                            <p className="theme-text-muted text-sm mb-3 line-clamp-2">{article.excerpt}</p>
                            <div className="flex items-center gap-4 text-xs theme-text-muted">
                              <span>{article.category_primary} / {article.category_secondary}</span>
                              <span>•</span>
                              <span>{new Date(article.created_at).toLocaleDateString('zh-CN')}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <span className={cn(
                              'px-3 py-1 rounded-full text-xs',
                              article.is_published
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            )}>
                              {article.is_published ? '已发布' : '待审核'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-wangfeng-purple mb-6">修改密码</h3>
                <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                  <div>
                    <label className="block text-sm font-medium mb-2 theme-text-muted">旧密码</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      className="w-full theme-bg-secondary rounded-lg px-4 py-3 theme-text-primary border theme-border-primary focus:border-wangfeng-purple focus:outline-none"
                      placeholder="请输入旧密码"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 theme-text-muted">新密码</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full theme-bg-secondary rounded-lg px-4 py-3 theme-text-primary border theme-border-primary focus:border-wangfeng-purple focus:outline-none"
                      placeholder="请输入新密码（至少6位）"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 theme-text-muted">确认新密码</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full theme-bg-secondary rounded-lg px-4 py-3 theme-text-primary border theme-border-primary focus:border-wangfeng-purple focus:outline-none"
                      placeholder="请再次输入新密码"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-wangfeng-purple text-white rounded-lg px-6 py-3 font-semibold hover:bg-wangfeng-purple/80 transition-colors"
                  >
                    修改密码
                  </button>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
