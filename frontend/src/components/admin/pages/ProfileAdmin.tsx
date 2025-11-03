import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { Area, Point } from 'react-easy-crop';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Save,
  X,
  Upload,
  Loader2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import { cn, withBasePath } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import SimpleToast, { ToastType } from '@/components/ui/SimpleToast';

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
  stats: {
    article_count: number;
    comment_count: number;
    like_count: number;
  };
}

// 创建裁剪后的图片
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// 获取裁剪后的图片
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // 设置canvas大小为裁剪区域大小
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // 绘制裁剪后的图片
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // 返回blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

const ProfileAdmin = () => {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === 'white';

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 头像裁剪相关
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 修改密码相关
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Toast 提示
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:1994/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('加载个人信息失败');

      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setToast({ message: '加载个人信息失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setToast({ message: '请选择图片文件', type: 'error' });
      return;
    }

    // 验证文件大小（最大10MB）
    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: '文件大小不能超过10MB', type: 'error' });
      return;
    }

    // 读取图片并显示裁剪器
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCropModal(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    };
    reader.readAsDataURL(file);

    // 清空input
    event.target.value = '';
  };

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setUploading(true);

      // 获取裁剪后的图片blob
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      // 创建FormData
      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');

      // 上传
      const response = await fetch('http://localhost:1994/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('上传失败');

      setToast({ message: '头像上传成功！', type: 'success' });
      setShowCropModal(false);
      setImageSrc(null);

      // 重新加载个人信息
      await loadProfileData();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setToast({ message: '头像上传失败', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setToast({ message: '两次输入的新密码不一致', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setToast({ message: '新密码长度不能少于6位', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('old_password', oldPassword);
      formData.append('new_password', newPassword);

      const response = await fetch('http://localhost:1994/api/profile/password', {
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

      setToast({ message: '密码修改成功！', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      setToast({ message: error.message || '密码修改失败', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '超级管理员';
      case 'admin':
        return '管理员';
      case 'user':
        return '普通用户';
      default:
        return '游客';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-wangfeng-purple" />
          <span className={cn("text-sm", isLight ? "text-gray-600" : "text-gray-400")}>
            加载中...
          </span>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className={cn("text-lg", isLight ? "text-gray-900" : "text-white")}>
            加载失败
          </p>
          <button
            onClick={loadProfileData}
            className="mt-4 px-4 py-2 bg-wangfeng-purple text-white rounded-lg hover:bg-wangfeng-purple/90 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // 构建头像 URL - 兼容相对路径或完整的 OSS 地址
  const resolvedAvatar = profileData.avatar_thumb
    ? withBasePath(profileData.avatar_thumb)
    : withBasePath('images/avatars/default-avatar.jpg');

  const avatarUrl = `${resolvedAvatar}${resolvedAvatar.includes('?') ? '&' : '?'}t=${Date.now()}`;

  return (
    <div className={cn(
      "h-full flex flex-col",
      isLight ? "bg-gray-50" : "bg-transparent"
    )}>
      {/* 顶部标题栏 */}
      <div className={cn(
        "flex-shrink-0 border-b px-6 py-4",
        isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
      )}>
        <div className="flex items-center justify-between">
          <h1 className={cn(
            "text-xl font-bold flex items-center gap-2",
            isLight ? "text-gray-900" : "text-white"
          )}>
            <User className="h-5 w-5 text-wangfeng-purple" />
            个人中心
          </h1>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* 个人信息卡片 */}
          <div className={cn(
            "rounded-lg border p-6",
            isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
          )}>
            <h2 className={cn(
              "text-lg font-semibold mb-6 pb-4 border-b flex items-center gap-2",
              isLight ? "text-gray-900 border-gray-200" : "text-white border-wangfeng-purple/20"
            )}>
              <User className="h-5 w-5 text-wangfeng-purple" />
              基本信息
            </h2>

            <div className="flex flex-col md:flex-row gap-8">
              {/* 头像区域 */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className={cn(
                    "w-32 h-32 rounded-full overflow-hidden border-4",
                    isLight ? "border-gray-200" : "border-wangfeng-purple/40"
                  )}>
                    <img
                      key={avatarUrl}
                      src={avatarUrl}
                      alt="用户头像"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.error('头像加载失败:', target.src);
                        if (!target.src.includes('default-avatar.jpg')) {
                          target.src = withBasePath('images/avatars/default-avatar.jpg');
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Camera className="h-8 w-8 text-white" />
                  </button>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isLight
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-wangfeng-purple/10 text-wangfeng-purple hover:bg-wangfeng-purple/20 border border-wangfeng-purple/30"
                  )}
                >
                  <Upload className="h-4 w-4" />
                  更换头像
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* 信息列表 */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    isLight ? "text-gray-700" : "text-gray-300"
                  )}>
                    用户名
                  </label>
                  <div className={cn(
                    "rounded-lg px-4 py-2.5 text-sm",
                    isLight ? "bg-gray-50 text-gray-900" : "bg-black/40 text-gray-200"
                  )}>
                    {profileData.username}
                  </div>
                </div>

                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    isLight ? "text-gray-700" : "text-gray-300"
                  )}>
                    <Mail className="inline h-4 w-4 mr-1 -mt-0.5" />
                    邮箱
                  </label>
                  <div className={cn(
                    "rounded-lg px-4 py-2.5 text-sm",
                    isLight ? "bg-gray-50 text-gray-900" : "bg-black/40 text-gray-200"
                  )}>
                    {profileData.email}
                  </div>
                </div>

                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    isLight ? "text-gray-700" : "text-gray-300"
                  )}>
                    <Shield className="inline h-4 w-4 mr-1 -mt-0.5" />
                    角色权限
                  </label>
                  <div className={cn(
                    "rounded-lg px-4 py-2.5 text-sm",
                    isLight ? "bg-gray-50" : "bg-black/40"
                  )}>
                    <span className="text-wangfeng-purple font-medium">
                      {getRoleName(profileData.role)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    isLight ? "text-gray-700" : "text-gray-300"
                  )}>
                    <Calendar className="inline h-4 w-4 mr-1 -mt-0.5" />
                    注册时间
                  </label>
                  <div className={cn(
                    "rounded-lg px-4 py-2.5 text-sm",
                    isLight ? "bg-gray-50 text-gray-900" : "bg-black/40 text-gray-200"
                  )}>
                    {new Date(profileData.created_at).toLocaleDateString('zh-CN')}
                  </div>
                </div>

                {profileData.last_login && (
                  <div className="md:col-span-2">
                    <label className={cn(
                      "block text-sm font-medium mb-2",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      上次登录
                    </label>
                    <div className={cn(
                      "rounded-lg px-4 py-2.5 text-sm",
                      isLight ? "bg-gray-50 text-gray-900" : "bg-black/40 text-gray-200"
                    )}>
                      {new Date(profileData.last_login).toLocaleString('zh-CN')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 修改密码卡片 */}
          <div className={cn(
            "rounded-lg border p-6",
            isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
          )}>
            <h2 className={cn(
              "text-lg font-semibold mb-6 pb-4 border-b flex items-center gap-2",
              isLight ? "text-gray-900 border-gray-200" : "text-white border-wangfeng-purple/20"
            )}>
              <Lock className="h-5 w-5 text-wangfeng-purple" />
              修改密码
            </h2>

            <form onSubmit={handleChangePassword} className="max-w-lg space-y-5">
              <div>
                <label className={cn(
                  "block text-sm font-medium mb-2",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>
                  旧密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className={cn(
                      "w-full rounded-lg border px-4 py-2.5 pr-10 text-sm transition-colors focus:outline-none focus:ring-2",
                      isLight
                        ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                        : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                    )}
                    placeholder="请输入当前密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={cn(
                  "block text-sm font-medium mb-2",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>
                  新密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className={cn(
                      "w-full rounded-lg border px-4 py-2.5 pr-10 text-sm transition-colors focus:outline-none focus:ring-2",
                      isLight
                        ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                        : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                    )}
                    placeholder="请输入新密码（至少6位）"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={cn(
                  "block text-sm font-medium mb-2",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>
                  确认新密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className={cn(
                      "w-full rounded-lg border px-4 py-2.5 pr-10 text-sm transition-colors focus:outline-none focus:ring-2",
                      isLight
                        ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                        : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                    )}
                    placeholder="请再次输入新密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className={cn(
                  "flex items-center justify-center gap-2 w-full px-6 py-2.5 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors",
                  saving && "opacity-50 cursor-not-allowed"
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    修改中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    修改密码
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 图片裁剪模态框 */}
      {showCropModal && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className={cn(
            "relative w-full max-w-3xl mx-4 rounded-lg border overflow-hidden",
            isLight ? "bg-white border-gray-200" : "bg-black border-wangfeng-purple/40"
          )}>
            {/* 标题栏 */}
            <div className={cn(
              "flex items-center justify-between px-6 py-4 border-b",
              isLight ? "border-gray-200" : "border-wangfeng-purple/20"
            )}>
              <h3 className={cn(
                "text-lg font-semibold",
                isLight ? "text-gray-900" : "text-white"
              )}>
                裁剪头像
              </h3>
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setImageSrc(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 裁剪区域 */}
            <div className="relative h-[400px] bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* 控制面板 */}
            <div className={cn(
              "px-6 py-4 space-y-4",
              isLight ? "bg-gray-50" : "bg-black/40"
            )}>
              {/* 缩放控制 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cn(
                    "text-sm font-medium",
                    isLight ? "text-gray-700" : "text-gray-300"
                  )}>
                    <ZoomIn className="inline h-4 w-4 mr-1 -mt-0.5" />
                    缩放
                  </label>
                  <span className={cn(
                    "text-sm",
                    isLight ? "text-gray-600" : "text-gray-400"
                  )}>
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* 旋转控制 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cn(
                    "text-sm font-medium",
                    isLight ? "text-gray-700" : "text-gray-300"
                  )}>
                    <RotateCw className="inline h-4 w-4 mr-1 -mt-0.5" />
                    旋转
                  </label>
                  <span className={cn(
                    "text-sm",
                    isLight ? "text-gray-600" : "text-gray-400"
                  )}>
                    {rotation}°
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* 提示文字 */}
              <p className={cn(
                "text-xs text-center",
                isLight ? "text-gray-500" : "text-gray-400"
              )}>
                💡 拖动图片调整位置，使用滑块调整缩放和旋转
              </p>

              {/* 按钮组 */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCropModal(false);
                    setImageSrc(null);
                  }}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                    isLight
                      ? "border-gray-300 text-gray-700 hover:bg-gray-100"
                      : "border-wangfeng-purple/40 text-gray-300 hover:bg-wangfeng-purple/10"
                  )}
                >
                  取消
                </button>
                <button
                  onClick={handleCropConfirm}
                  disabled={uploading}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors",
                    uploading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      上传中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      确认上传
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ProfileAdmin;
