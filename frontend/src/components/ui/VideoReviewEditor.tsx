/**
 * 视频审核编辑器 - 两步工作流
 * 用于审核员审核和编辑待发布的视频，或管理员编辑已发布的视频
 * 步骤1: 编辑视频基本信息
 * 步骤2: 审批操作（保存/批准/拒绝）或更新操作（仅更新）
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Calendar,
  User,
  Tag as TagIcon,
  Folder,
  Video as VideoIcon,
  X,
  Upload
} from 'lucide-react';
import { videoAPI, VideoData, TagData } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import TagSelectionPanel from '@/components/admin/shared/TagSelectionPanel';
import SimpleToast, { ToastType } from '@/components/ui/SimpleToast';
import type { ReviewStatus } from '@/components/ui/StatusBadge';

type StepAction =
  | 'saveDraft'
  | 'submit'
  | 'withdrawToDraft'
  | 'resubmit'
  | 'update'
  | 'approve'
  | 'reject'
  | 'delete';

type ButtonStyle = 'danger' | 'gray' | 'primaryBlue' | 'primaryPurple' | 'success' | 'warning';

interface StepButtonConfig {
  label: string;
  action: StepAction;
  style: ButtonStyle;
}

interface VideoActionPayload {
  video?: VideoData & { review_status?: ReviewStatus; is_published?: number };
  rejectReason?: string;
}

interface VideoReviewEditorProps {
  videoId: string;
  mode: 'edit' | 'review';
  videoStatus?: ReviewStatus;
  isAdminView?: boolean;
  onAction?: (action: StepAction, payload: VideoActionPayload) => Promise<void>;
  backPath?: string;
}

const VIDEO_CATEGORIES = [
  { value: '演出现场', label: '演出现场' },
  { value: '单曲现场', label: '单曲现场' },
  { value: '综艺节目', label: '综艺节目' },
  { value: '歌曲mv', label: '歌曲mv' },
  { value: '访谈节目', label: '访谈节目' },
  { value: '纪录片', label: '纪录片' },
  { value: '其他', label: '其他' },
];

const VideoReviewEditor = ({
  videoId,
  mode,
  videoStatus,
  isAdminView = false,
  onAction,
  backPath: backPathOverride,
}: VideoReviewEditorProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, currentRole } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const isEditMode = mode === 'edit';
  const isReviewMode = mode === 'review';
  const resolvedAdminView =
    isAdminView || currentRole === 'admin' || currentRole === 'super_admin';

  const navigationState = location.state as { backPath?: string } | null;
  const defaultBackPath = backPathOverride
    || navigationState?.backPath
    || (isReviewMode
      ? '/admin/manage/videos'
      : resolvedAdminView
        ? '/admin/manage/videos'
        : '/admin/my-videos');

  const backButtonLabel = isReviewMode
    ? '返回审核中心'
    : resolvedAdminView
      ? '返回视频管理'
      : '返回我的视频';
  const backPath = defaultBackPath;

  // 步骤管理
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // 视频数据
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 表单数据
  const [formData, setFormData] = useState<VideoData>({
    title: '',
    description: '',
    author: user?.username || '汪峰',
    category: '演出现场',
    bvid: '',
    publish_date: new Date().toISOString().split('T')[0],
    cover_url: '',
    tags: []
  });

  const [selectedTags, setSelectedTags] = useState<TagData[]>([]);

  // 操作状态
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<ReviewStatus>((videoStatus || 'draft') as ReviewStatus);

  // 日期选择状态
  const [selectedDate, setSelectedDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  });

  const years = Array.from({ length: 101 }, (_, i) => 1971 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const days = Array.from({ length: getDaysInMonth(selectedDate.year, selectedDate.month) }, (_, i) => i + 1);

  // 权限检查
  useEffect(() => {
    if (isReviewMode && currentRole !== 'admin' && currentRole !== 'super_admin') {
      navigate('/admin/dashboard');
    }
  }, [currentRole, navigate, isReviewMode]);

  // 加载视频数据
  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true);
        const videoData = await videoAPI.getById(videoId);

        // 如果是审核模式，检查视频状态
        if (isReviewMode && videoData.review_status !== 'pending') {
          setError('该视频不处于待审核状态，无法审核');
          setTimeout(() => navigate(backPath), 2000);
          return;
        }

        setVideo(videoData);
        setWorkflowStatus((videoData.review_status as ReviewStatus) || 'draft');
        setFormData({
          title: videoData.title,
          description: videoData.description || '',
          author: videoData.author,
          category: videoData.category,
          bvid: videoData.bvid,
          publish_date: videoData.publish_date,
          cover_url: videoData.cover_thumb || videoData.cover_local || videoData.cover_url || '',
          tags: videoData.tags || []
        });

        // 设置日期
        try {
          const dateStr = videoData.publish_date;
          const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
          const [year, month, day] = datePart.split('-').map(Number);

          if (!isNaN(year) && !isNaN(month) && !isNaN(day) &&
              year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            setSelectedDate({ year, month, day });
          }
        } catch (dateError) {
          console.error('日期解析失败:', dateError);
        }
      } catch (err: any) {
        console.error('加载视频失败:', err);
        setError(err.message || '加载视频失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoId, isEditMode, navigate]);

  // 当selectedDate改变时，更新表单中的publish_date字段
  useEffect(() => {
    const formattedDate = `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
    setFormData(prev => ({ ...prev, publish_date: formattedDate }));
  }, [selectedDate]);

  // 更新选中的日期
  const updateSelectedDate = (field: 'year' | 'month' | 'day', value: number) => {
    setSelectedDate(prev => {
      const newDate = { ...prev, [field]: value };
      const daysInMonth = getDaysInMonth(newDate.year, newDate.month);
      if (field !== 'day' && newDate.day > daysInMonth) {
        newDate.day = daysInMonth;
      }
      return newDate;
    });
  };

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 步骤导航
  const handleNextStep = () => {
    if (!formData.title.trim()) {
      setToast({ message: '请输入视频标题', type: 'error' });
      return;
    }
    if (!formData.bvid.trim()) {
      setToast({ message: '请输入B站视频ID', type: 'error' });
      return;
    }
    if (!/^BV[A-Za-z0-9]+$/.test(formData.bvid)) {
      setToast({ message: '请输入有效的B站视频ID（格式如：BV123456789）', type: 'error' });
      return;
    }
    setToast(null);
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setToast(null);
    setCurrentStep(1);
  };

  // 生成标签上下文文本
  const tagContext = [
    formData.title,
    formData.description,
    formData.author,
    formData.category
  ].filter(Boolean).join(' ');

  const getTagValues = useCallback(() => {
    const explicitTags = selectedTags
      .map(tag => tag.display_name || tag.name || tag.value)
      .filter((value): value is string => Boolean(value && value.trim()))
      .map(value => value.trim());

    if (explicitTags.length > 0) {
      return Array.from(new Set(explicitTags));
    }

    return formData.tags?.filter(tag => tag && tag.trim()) || [];
  }, [selectedTags, formData.tags]);

  const buildVideoPayload = useCallback(
    (statusOverride?: ReviewStatus) => {
      const status = statusOverride || workflowStatus;
      return {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        author: formData.author?.trim() || user?.username || '汪峰',
        category: formData.category,
        bvid: formData.bvid.trim(),
        publish_date: formData.publish_date,
        cover_url: formData.cover_url,
        tags: getTagValues(),
        review_status: status,
        is_published: status === 'approved' ? 1 : 0,
      };
    },
    [formData, workflowStatus, getTagValues, user?.username]
  );

  const triggerAction = useCallback(
    async (action: StepAction, options?: { rejectReason?: string }) => {
      if (isReviewMode && !token) {
        setToast({ message: '请重新登录后操作', type: 'error' });
        return false;
      }

      const needsValidation = ['saveDraft', 'submit', 'withdrawToDraft', 'resubmit', 'update'].includes(action);
      if (needsValidation) {
        if (!formData.title.trim() || !formData.bvid.trim()) {
          setToast({ message: '请完善标题与视频ID', type: 'error' });
          return false;
        }
        if (!/^BV[A-Za-z0-9]+$/.test(formData.bvid.trim())) {
          setToast({ message: '请输入有效的B站视频ID（格式如：BV123456789）', type: 'error' });
          return false;
        }
      }

      if (action === 'delete') {
        if (!window.confirm('确定要删除这个视频吗？此操作不可恢复。')) {
          return false;
        }
      }

      const setLoadingState = (value: boolean) => {
        if (action === 'approve') {
          setIsApproving(value);
        } else if (action === 'reject') {
          setIsRejecting(value);
        } else {
          setIsSaving(value);
        }
      };

      const statusMap: Partial<Record<StepAction, ReviewStatus>> = {
        saveDraft: 'draft',
        withdrawToDraft: 'draft',
        submit: 'pending',
        resubmit: 'pending',
        update: 'approved',
        approve: 'approved',
        reject: 'rejected',
      };

      const rejectionReason = options?.rejectReason?.trim();
      if (action === 'reject' && !rejectionReason) {
        setToast({ message: '请输入驳回原因', type: 'error' });
        return false;
      }

      try {
        setToast(null);
        setLoadingState(true);

        const targetStatus = statusMap[action] || workflowStatus;
        const payload = buildVideoPayload(targetStatus);
        let result: any = null;

        if (onAction) {
          await onAction(action, {
            video: payload as VideoData & { review_status?: ReviewStatus; is_published?: number },
            rejectReason: rejectionReason,
          });
        } else if (action === 'delete') {
          await videoAPI.delete(videoId, token);
        } else if (action === 'approve') {
          await videoAPI.update(videoId, payload as any, token);
          const approveUrl = `http://localhost:1994/api/admin/reviews/video/${videoId}/approve`;
          const response = await fetch(approveUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({ reviewNotes: '' }),
          });
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || '批准失败');
          }
          result = await response.json().catch(() => null);
        } else if (action === 'reject') {
          const rejectUrl = `http://localhost:1994/api/admin/reviews/video/${videoId}/reject`;
          const response = await fetch(rejectUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({ reviewNotes: rejectionReason }),
          });
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || '拒绝失败');
          }
          result = await response.json().catch(() => null);
        } else {
          result = await videoAPI.update(videoId, payload as any, token);
        }

        const nextStatus = (result as any)?.review_status || targetStatus || workflowStatus;
        setWorkflowStatus(nextStatus as ReviewStatus);

        const successMessages: Partial<Record<StepAction, string>> = {
          saveDraft: '✅ 视频已保存为草稿！',
          submit: '视频已提交审核，等待审核通过。',
          resubmit: '已重新提交审核，等待管理员审核。',
          withdrawToDraft: '已撤回并保存草稿，可继续编辑。',
          update: '视频已更新！',
          approve: '视频已批准并发布。',
          reject: '视频已驳回。',
          delete: '视频已删除。',
        };

        const message = successMessages[action];
        if (message) {
          setToast({ message, type: 'success' });
        }

        const delayActions: StepAction[] = ['saveDraft', 'withdrawToDraft', 'approve', 'reject', 'delete'];
        const delay = delayActions.includes(action) ? 1500 : 3000;

        setTimeout(() => {
          navigate(backPath);
        }, delay);

        return true;
      } catch (error) {
        console.error('操作失败:', error);
        const errorMessages: Partial<Record<StepAction, string>> = {
          saveDraft: '保存草稿失败，请重试',
          submit: '提交审核失败，请重试',
          resubmit: '重新提交失败，请重试',
          withdrawToDraft: '撤回失败，请稍后再试',
          update: '更新失败，请重试',
          approve: '批准失败，请稍后重试',
          reject: '驳回失败，请稍后重试',
          delete: '删除失败，请稍后重试',
        };
        setToast({ message: errorMessages[action] || '操作失败，请重试', type: 'error' });
        return false;
      } finally {
        setLoadingState(false);
      }
    },
    [backPath, buildVideoPayload, formData, isReviewMode, navigate, onAction, token, videoId, workflowStatus]
  );

  const stepButtons = useMemo<StepButtonConfig[]>(() => {
    if (isReviewMode && workflowStatus === 'pending') {
      return [
        { label: '拒绝', action: 'reject', style: 'warning' },
        { label: '批准发布', action: 'approve', style: 'success' },
      ];
    }

    if (resolvedAdminView && workflowStatus === 'approved') {
      return [
        { label: '删除视频', action: 'delete', style: 'danger' },
        { label: '更新视频', action: 'update', style: 'primaryPurple' },
      ];
    }

    if (workflowStatus === 'draft' || workflowStatus === 'rejected') {
      return [
        { label: '删除视频', action: 'delete', style: 'danger' },
        { label: '暂存草稿', action: 'saveDraft', style: 'gray' },
        { label: '提交审核', action: 'submit', style: 'primaryBlue' },
      ];
    }

    if (!resolvedAdminView && workflowStatus === 'pending') {
      return [
        { label: '删除视频', action: 'delete', style: 'danger' },
        { label: '撤回并保存为草稿', action: 'withdrawToDraft', style: 'gray' },
      ];
    }

    if (!resolvedAdminView && workflowStatus === 'approved') {
      return [
        { label: '删除视频', action: 'delete', style: 'danger' },
        { label: '重新提交审核', action: 'resubmit', style: 'primaryBlue' },
      ];
    }

    return [];
  }, [resolvedAdminView, isReviewMode, workflowStatus]);

  const getButtonClasses = useCallback((style: ButtonStyle) => {
    const base =
      'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

    switch (style) {
      case 'danger':
        return cn(
          base,
          isLight
            ? 'border border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
            : 'border border-red-500/80 text-red-300 hover:bg-red-500/20'
        );
      case 'gray':
        return cn(
          base,
          isLight
            ? 'border border-gray-400 text-gray-700 hover:bg-gray-100'
            : 'border border-white/20 text-gray-200 hover:bg-white/10'
        );
      case 'primaryBlue':
        return cn(base, 'bg-blue-600 text-white hover:bg-blue-700');
      case 'primaryPurple':
        return cn(base, 'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90');
      case 'success':
        return cn(base, 'bg-green-600 text-white hover:bg-green-700');
      case 'warning':
        return cn(
          base,
          isLight
            ? 'border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'
            : 'border border-orange-500/80 text-orange-300 hover:bg-orange-500/20'
        );
      default:
        return base;
    }
  }, [isLight]);

  const isActionBusy = (action: StepAction) => {
    if (action === 'approve') return isApproving;
    if (action === 'reject') return isRejecting;
    return isSaving;
  };


  // 获取B站视频链接
  const getBilibiliUrl = (bvid: string) => {
    return `https://www.bilibili.com/video/${bvid}`;
  };

  // 加载状态
  if (loading) {
    return (
      <div className={cn(
        "h-full flex items-center justify-center",
        isLight ? "bg-gray-50" : "bg-transparent"
      )}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-wangfeng-purple" />
          <p className={cn("text-sm", isLight ? "text-gray-600" : "text-gray-400")}>
            加载视频数据中...
          </p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className={cn(
        "h-full flex items-center justify-center",
        isLight ? "bg-gray-50" : "bg-transparent"
      )}>
        <div className={cn(
          "max-w-md p-6 rounded-lg border flex items-start gap-4",
          isLight
            ? "bg-red-50 border-red-200"
            : "bg-red-500/10 border-red-500/30"
        )}>
          <AlertCircle className={cn(
            "w-6 h-6 flex-shrink-0 mt-0.5",
            isLight ? "text-red-600" : "text-red-400"
          )} />
          <div>
            <p className={cn(
              "font-medium",
              isLight ? "text-red-900" : "text-red-200"
            )}>
              {error}
            </p>
            <button
              onClick={() => navigate(backPath)}
              className={cn(
                "text-sm underline mt-2",
                isLight ? "text-red-700 hover:text-red-900" : "text-red-300 hover:text-red-100"
              )}
            >
              返回列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!video) return null;

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(backPath)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                isLight
                  ? "text-gray-600 hover:bg-gray-100"
                  : "text-gray-400 hover:bg-wangfeng-purple/10 hover:text-wangfeng-purple"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              {backButtonLabel}
            </button>
            <div className="h-5 w-px bg-gray-300 dark:bg-gray-700" />
            <h1 className={cn(
              "text-xl font-bold flex items-center gap-2",
              isLight ? "text-gray-900" : "text-white"
            )}>
              <VideoIcon className="h-5 w-5 text-wangfeng-purple" />
              {isEditMode ? '编辑视频' : '审核视频'}
              <span className={cn(
                "text-sm font-normal ml-2",
                isLight ? "text-gray-500" : "text-gray-400"
              )}>
                步骤 {currentStep}/2
              </span>
            </h1>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            {currentStep === 1 && (
              <button
                onClick={handleNextStep}
                className="px-5 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors flex items-center gap-2"
              >
                下一步
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {currentStep === 2 && (
              <>
                <button
                  onClick={handlePrevStep}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isLight
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  )}
                >
                  上一步
                </button>
                {stepButtons.map((button) => {
                  const disabled = isSaving || isApproving || isRejecting;
                  const busy = isActionBusy(button.action);
                  const handleClick = () => {
                    if (button.action === 'reject') {
                      setShowRejectModal(true);
                      return;
                    }
                    triggerAction(button.action);
                  };

                  return (
                    <button
                      key={button.action}
                      type="button"
                      onClick={handleClick}
                      disabled={disabled}
                      className={getButtonClasses(button.style)}
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                      {button.label}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* 步骤1: 基础信息 */}
          {currentStep === 1 && (
            <>
              {/* 基础信息区域 */}
              <div className={cn(
                "rounded-lg border p-6",
                isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
              )}>
                <h2 className={cn(
                  "text-lg font-semibold mb-4 pb-2 border-b",
                  isLight ? "text-gray-900 border-gray-200" : "text-white border-wangfeng-purple/20"
                )}>
                  基础信息
                </h2>

                <div className="space-y-5">
                  {/* 视频标题 */}
                  <div>
                    <label className={cn(
                      "block text-sm font-medium mb-2",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      视频标题 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                        isLight
                          ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                      )}
                      placeholder="请输入视频标题"
                    />
                  </div>

                  {/* B站视频ID */}
                  <div>
                    <label className={cn(
                      "block text-sm font-medium mb-2",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      B站视频ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bvid"
                      value={formData.bvid}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                        isLight
                          ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                      )}
                      placeholder="例如：BV123456789"
                    />
                    {formData.bvid && (
                      <div className="mt-2">
                        <a
                          href={getBilibiliUrl(formData.bvid)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs text-wangfeng-purple hover:text-wangfeng-purple/80 transition-colors"
                        >
                          <Upload className="h-3 w-3" />
                          在B站预览视频
                        </a>
                      </div>
                    )}
                  </div>

                  {/* 视频描述 */}
                  <div>
                    <label className={cn(
                      "block text-sm font-medium mb-2",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      视频描述
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className={cn(
                        "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 resize-none",
                        isLight
                          ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                      )}
                      placeholder="视频描述（可选）"
                    />
                  </div>

                  {/* 作者与日期 - 在同一行 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 作者 */}
                    <div>
                      <label className={cn(
                        "block text-sm font-medium mb-2",
                        isLight ? "text-gray-700" : "text-gray-300"
                      )}>
                        <User className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                        作者
                      </label>
                      <input
                        type="text"
                        name="author"
                        value={formData.author}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                          isLight
                            ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                            : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                        )}
                        placeholder="作者"
                      />
                    </div>

                    {/* 发布日期 */}
                    <div>
                      <label className={cn(
                        "block text-sm font-medium mb-2",
                        isLight ? "text-gray-700" : "text-gray-300"
                      )}>
                        <Calendar className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                        发布日期 <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {/* 年份选择 */}
                        <select
                          value={selectedDate.year}
                          onChange={(e) => updateSelectedDate('year', parseInt(e.target.value))}
                          className={cn(
                            "rounded-lg border px-2.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                            isLight
                              ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                              : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          )}
                        >
                          {years.map(year => (
                            <option key={year} value={year}>{year}年</option>
                          ))}
                        </select>

                        {/* 月份选择 */}
                        <select
                          value={selectedDate.month}
                          onChange={(e) => updateSelectedDate('month', parseInt(e.target.value))}
                          className={cn(
                            "rounded-lg border px-2.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                            isLight
                              ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                              : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          )}
                        >
                          {months.map(month => (
                            <option key={month} value={month}>{month}月</option>
                          ))}
                        </select>

                        {/* 日期选择 */}
                        <select
                          value={selectedDate.day}
                          onChange={(e) => updateSelectedDate('day', parseInt(e.target.value))}
                          className={cn(
                            "rounded-lg border px-2.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                            isLight
                              ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                              : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          )}
                        >
                          {days.map(day => (
                            <option key={day} value={day}>{day}日</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 步骤2: 分类与标签 */}
          {currentStep === 2 && (
            <>
              {/* 分类区域 */}
              <div className={cn(
                "rounded-lg border p-6 mb-6",
                isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
              )}>
                <h2 className={cn(
                  "text-lg font-semibold mb-4 pb-2 border-b",
                  isLight ? "text-gray-900 border-gray-200" : "text-white border-wangfeng-purple/20"
                )}>
                  视频分类
                </h2>

                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    isLight ? "text-gray-700" : "text-gray-300"
                  )}>
                    <Folder className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                    分类 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                      isLight
                        ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                        : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                    )}
                  >
                    {VIDEO_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 标签管理 */}
              <TagSelectionPanel
                contextText={tagContext}
                selectedTags={selectedTags}
                onChange={setSelectedTags}
                isLight={isLight}
                infoMessage="我们会根据视频标题、简介、分类等信息推荐相关标签，也可以搜索或直接创建新标签。"
              />
            </>
          )}
        </div>
      </div>

      {/* 拒绝原因模态框 */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowRejectModal(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className={cn(
              "relative w-full max-w-md rounded-2xl border shadow-2xl",
              isLight ? "bg-white border-gray-200" : "bg-black/90 border-wangfeng-purple/40"
            )}>
              <div className={cn(
                "flex items-center justify-between px-6 py-4 border-b",
                isLight ? "border-gray-200" : "border-wangfeng-purple/30"
              )}>
                <div>
                  <h2 className={cn(
                    "text-lg font-semibold flex items-center gap-2",
                    isLight ? "text-gray-900" : "text-white"
                  )}>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    拒绝视频
                  </h2>
                  <p className={cn(
                    "text-xs mt-1",
                    isLight ? "text-gray-500" : "text-gray-400"
                  )}>
                    请填写拒绝理由，帮助上传者改进内容
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className={cn(
                    "rounded-full p-2 transition-colors",
                    isLight ? "text-gray-500 hover:bg-gray-100" : "text-gray-300 hover:bg-white/10"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 py-5">
                <label className={cn(
                  "block text-sm font-semibold mb-2",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>
                  拒绝理由 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请详细说明拒绝原因..."
                  rows={5}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2",
                    isLight
                      ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20"
                      : "bg-black/60 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20"
                  )}
                />
              </div>

              <div className={cn(
                "flex justify-end gap-3 px-6 py-4 border-t",
                isLight ? "border-gray-200" : "border-wangfeng-purple/30"
              )}>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isLight
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  )}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!rejectReason.trim()) {
                      return;
                    }
                    const success = await triggerAction('reject', { rejectReason: rejectReason.trim() });
                    if (success) {
                      setShowRejectModal(false);
                      setRejectReason('');
                    }
                  }}
                  disabled={!rejectReason.trim() || isRejecting}
                  className={cn(
                    "px-6 py-2 rounded-lg text-sm font-medium transition-colors",
                    "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isRejecting ? '拒绝中...' : '确认拒绝'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast 通知 */}
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

export default VideoReviewEditor;
