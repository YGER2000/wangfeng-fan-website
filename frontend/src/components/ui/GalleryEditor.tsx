/**
 * 图组编辑器 - 统一的图组上传、编辑、审核组件
 * 支持三种模式：
 * - 'create': 上传新图组（两步式）
 * - 'edit': 编辑现有图组（两步式）
 * - 'review': 审核图组（两步式）
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  X,
  Image as ImageIcon,
  Calendar,
  Tag,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { TagData } from '@/utils/api';
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

interface GalleryActionPayload {
  groupId?: string;
  status?: ReviewStatus;
  rejectReason?: string;
}

interface Photo {
  id: string;
  photo_group_id: string;
  original_filename?: string;
  title?: string;
  description?: string;
  image_url: string;
  image_thumb_url?: string;
  image_medium_url?: string;
  file_size?: number;
  width?: number;
  height?: number;
  mime_type?: string;
  storage_type: string;
  storage_path: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface PhotoGroup {
  id: string;
  title: string;
  category: string;
  date: string;
  display_date: string;
  year: string;
  description?: string;
  cover_image_url?: string;
  cover_image_thumb_url?: string;
  storage_type: string;
  is_published: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  review_status?: string;
  photos?: Photo[];
}

interface UploadedImage {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  uploadedUrls?: {
    original: string;
    medium: string;
    thumb: string;
  };
  error?: string;
}

interface GalleryEditorProps {
  mode: 'create' | 'edit' | 'review';
  groupId?: string;
  backPath?: string;
  contentStatus?: ReviewStatus;
  isAdminView?: boolean;
  onAction?: (action: StepAction, payload: GalleryActionPayload) => Promise<void>;
  onSuccess?: (groupId: string) => void;
}

const categoryOptions = [
  { value: '巡演返图', label: '巡演返图' },
  { value: '工作花絮', label: '工作花絮' },
  { value: '日常生活', label: '日常生活' }
];

const GalleryEditor = ({
  mode,
  groupId,
  backPath = '/admin/gallery/list',
  contentStatus,
  isAdminView = false,
  onAction,
  onSuccess,
}: GalleryEditorProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const navigate = useNavigate();

  // 步骤管理
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // 状态与图组信息
  const [currentGroupId, setCurrentGroupId] = useState<string | undefined>(groupId);
  const [workflowStatus, setWorkflowStatus] = useState<ReviewStatus>(contentStatus || 'draft');
  const [photoGroup, setPhotoGroup] = useState<PhotoGroup | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('巡演返图');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const resolvedAdminView = isAdminView || mode === 'review';

  // 标签数据
  const [selectedTags, setSelectedTags] = useState<TagData[]>([]);

  // 现有图片
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);

  // 新上传的图片
  const [newImages, setNewImages] = useState<UploadedImage[]>([]);

  // 状态
  const [loading, setLoading] = useState(mode !== 'create');
  const [processingAction, setProcessingAction] = useState<StepAction | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // 生成标签上下文文本
  const tagContext = useMemo(
    () => [title, description, category].filter(Boolean).join(' '),
    [title, description, category]
  );

  // 获取页面标题
  const pageTitle = {
    create: '上传图组',
    edit: '编辑图组',
    review: '审核图组'
  }[mode];

  // 加载图组数据
  useEffect(() => {
    if (mode !== 'create' && groupId) {
      loadPhotoGroup();
    }
  }, [groupId, mode]);

  const loadPhotoGroup = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:1994/api/gallery/groups/${groupId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('加载图组失败');

      const groupData = await response.json();
      setPhotoGroup(groupData);
      setCurrentGroupId(groupData.id);
      setTitle(groupData.title);
      setCategory(groupData.category);
      setDate(new Date(groupData.date).toISOString().split('T')[0]);
      setDescription(groupData.description || '');
      setExistingPhotos(groupData.photos || []);
      setWorkflowStatus((groupData.review_status || 'draft') as ReviewStatus);
    } catch (error) {
      console.error('加载图组失败:', error);
      setToast({ message: '加载图组失败，请稍后重试', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 处理步骤导航
  const handleNextStep = () => {
    if (!title.trim()) {
      setToast({ message: '请输入图组标题', type: 'error' });
      return;
    }
    if (mode === 'create' && newImages.length === 0) {
      setToast({ message: '请至少上传一张图片', type: 'error' });
      return;
    }
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  // 文件处理
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const images: UploadedImage[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const
      }));
    setNewImages(prev => [...prev, ...images]);
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => {
      const newArr = [...prev];
      URL.revokeObjectURL(newArr[index].preview);
      newArr.splice(index, 1);
      return newArr;
    });
  };

  const deleteExistingPhoto = (photoId: string) => {
    setDeletedPhotoIds(prev => [...prev, photoId]);
    setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // 上传单张图片
  const uploadSingleImage = async (image: UploadedImage, index: number): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('file', image.file);
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:1994/api/gallery/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('上传失败');
      const result = await response.json();

      setNewImages(prev => {
        const arr = [...prev];
        arr[index] = {
          ...arr[index],
          status: 'success',
          uploadedUrls: {
            original: result.file_url,
            medium: result.medium_url,
            thumb: result.thumb_url
          }
        };
        return arr;
      });
      return true;
    } catch (error) {
      setNewImages(prev => {
        const arr = [...prev];
        arr[index] = {
          ...arr[index],
          status: 'error',
          error: error instanceof Error ? error.message : '上传失败'
        };
        return arr;
      });
      return false;
    }
  };

  const getToken = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('缺少认证信息，请重新登录');
    }
    return token;
  }, []);

  const getTagValues = useCallback(() => {
    return selectedTags
      .map(tag => tag.display_name || tag.name || tag.value)
      .filter((value): value is string => Boolean(value && value.trim()))
      .map(value => value.trim());
  }, [selectedTags]);

  const uploadPendingImages = useCallback(async () => {
    for (let i = 0; i < newImages.length; i++) {
      if (newImages[i].status === 'success') continue;
      setNewImages(prev => {
        const arr = [...prev];
        arr[i] = { ...arr[i], status: 'uploading' };
        return arr;
      });
      await uploadSingleImage(newImages[i], i);
    }
  }, [newImages]);

  const buildGroupPayload = useCallback(
    (status: ReviewStatus, publish: boolean) => {
      const targetDate = new Date(date);
      const displayDate = targetDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const coverFromNewImage = newImages.find(img => img.uploadedUrls)?.uploadedUrls;

      return {
        title: title.trim(),
        category,
        date: targetDate.toISOString(),
        display_date: displayDate,
        year: targetDate.getFullYear().toString(),
        description: description?.trim() || null,
        cover_image_url: existingPhotos[0]?.image_url || coverFromNewImage?.original || '',
        cover_image_thumb_url: existingPhotos[0]?.image_thumb_url || coverFromNewImage?.thumb || '',
        storage_type: 'oss',
        is_published: publish,
        review_status: status,
        tags: getTagValues().join(',')
      };
    },
    [category, date, description, existingPhotos, getTagValues, newImages, title]
  );

  const persistGroup = useCallback(
    async (status: ReviewStatus, publish: boolean) => {
      if (!title.trim()) {
        throw new Error('请输入标题');
      }

      await uploadPendingImages();

      const token = getToken();
      const payload = buildGroupPayload(status, publish);

      let targetId = currentGroupId;
      let responseBody: any = null;

      if (!targetId) {
        const response = await fetch('http://localhost:1994/api/gallery/admin/groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || '创建图组失败');
        }

        responseBody = await response.json();
        targetId = responseBody.id;
      } else {
        const response = await fetch(`http://localhost:1994/api/gallery/admin/groups/${targetId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || '更新图组失败');
        }

        responseBody = await response.json().catch(() => null);
      }

      // 删除标记的图片
      if (deletedPhotoIds.length > 0) {
        await Promise.all(
          deletedPhotoIds.map(photoId =>
            fetch(`http://localhost:1994/api/gallery/admin/photos/${photoId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            })
          )
        );
        setDeletedPhotoIds([]);
      }

      // 添加新图片
      const successfulImages = newImages.filter(img => img.status === 'success' && img.uploadedUrls);
      if (successfulImages.length > 0 && targetId) {
        const currentMaxOrder = existingPhotos.length > 0
          ? Math.max(...existingPhotos.map(p => p.sort_order))
          : -1;

        for (let i = 0; i < successfulImages.length; i++) {
          const image = successfulImages[i];
          const photoData = {
            photo_group_id: targetId,
            original_filename: image.file.name,
            image_url: image.uploadedUrls!.original,
            image_medium_url: image.uploadedUrls!.medium,
            image_thumb_url: image.uploadedUrls!.thumb,
            file_size: image.file.size,
            mime_type: image.file.type,
            storage_type: 'oss',
            storage_path: image.uploadedUrls!.original,
            sort_order: currentMaxOrder + i + 1
          };

          await fetch('http://localhost:1994/api/gallery/admin/photos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(photoData)
          });
        }

      }

      setNewImages([]);
      if (targetId) {
        setCurrentGroupId(targetId);
      }
      setWorkflowStatus(status);
      setPhotoGroup(prev => ({
        ...(prev || {}),
        ...(responseBody || {}),
        id: targetId,
        title,
        category,
        description,
        review_status: status,
        is_published: publish,
      } as PhotoGroup));

      if (targetId && onSuccess) {
        onSuccess(targetId);
      }

      return { groupId: targetId, status };
    },
    [buildGroupPayload, currentGroupId, description, existingPhotos, getToken, newImages, onSuccess, selectedTags, title, uploadPendingImages]
  );

  const approveGroup = useCallback(async () => {
    if (!currentGroupId) {
      throw new Error('图组不存在');
    }

    const token = getToken();

    await persistGroup('pending', false);

    const approveUrl = `http://localhost:1994/api/admin/reviews/gallery/${currentGroupId}/approve`;
    const response = await fetch(approveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '批准发布失败');
    }

    setWorkflowStatus('approved');
    setPhotoGroup(prev => prev ? { ...prev, review_status: 'approved', is_published: true } : prev);

    return { groupId: currentGroupId, status: 'approved' as ReviewStatus };
  }, [currentGroupId, getToken, persistGroup]);

  const rejectGroup = useCallback(
    async (reason: string) => {
      if (!currentGroupId) {
        throw new Error('图组不存在');
      }

      if (!reason.trim()) {
        throw new Error('请输入拒绝原因');
      }

      const token = getToken();

      await persistGroup('pending', false);

      const rejectUrl = `http://localhost:1994/api/admin/reviews/gallery/${currentGroupId}/reject`;
      const response = await fetch(rejectUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reviewNotes: reason.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || '拒绝失败');
      }

      setWorkflowStatus('rejected');
      setPhotoGroup(prev => prev ? { ...prev, review_status: 'rejected', is_published: false } : prev);

      return { groupId: currentGroupId, status: 'rejected' as ReviewStatus };
    },
    [currentGroupId, getToken, persistGroup]
  );

  const deleteGroup = useCallback(async () => {
    if (!currentGroupId) {
      throw new Error('图组不存在');
    }

    const token = getToken();
    const response = await fetch(`http://localhost:1994/api/gallery/admin/groups/${currentGroupId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '删除失败');
    }

    setCurrentGroupId(undefined);
    return { groupId: undefined };
  }, [currentGroupId, getToken]);

  const isActionBusy = useCallback(
    (action: StepAction) => processingAction === action,
    [processingAction]
  );

  const triggerAction = useCallback(
    async (action: StepAction, options?: { rejectReason?: string }) => {
      if (processingAction) {
        return false;
      }

      if (action === 'delete') {
        if (!currentGroupId) {
          setToast({ message: '图组尚未创建，无法删除', type: 'error' });
          return false;
        }
        if (typeof window !== 'undefined') {
          const confirmed = window.confirm('确定要删除这个图组吗？此操作不可恢复。');
          if (!confirmed) {
            return false;
          }
        }
      }

      if (['saveDraft', 'submit', 'resubmit', 'withdrawToDraft', 'update'].includes(action)) {
        if (!title.trim()) {
          setToast({ message: '请输入图组标题', type: 'error' });
          return false;
        }
        if (mode === 'create' && newImages.length === 0 && existingPhotos.length === 0) {
          setToast({ message: '请至少上传一张图片', type: 'error' });
          return false;
        }
      }

      const rejectionReason = options?.rejectReason?.trim();

      if (action === 'reject' && !rejectionReason) {
        setToast({ message: '请输入拒绝原因', type: 'error' });
        return false;
      }

      const statusMap: Partial<Record<StepAction, ReviewStatus>> = {
        saveDraft: 'draft',
        withdrawToDraft: 'draft',
        submit: 'pending',
        resubmit: 'pending',
        update: 'approved',
        approve: 'approved',
        reject: 'rejected'
      };

      setProcessingAction(action);
      setToast(null);

      try {
        if (onAction) {
          await onAction(action, {
            groupId: currentGroupId,
            status: statusMap[action],
            rejectReason: rejectionReason
          });
        } else {
          switch (action) {
            case 'saveDraft':
            case 'withdrawToDraft':
              await persistGroup('draft', false);
              break;
            case 'submit':
            case 'resubmit':
              await persistGroup('pending', false);
              break;
            case 'update':
              await persistGroup('approved', true);
              break;
            case 'approve':
              await approveGroup();
              break;
            case 'reject':
              await rejectGroup(rejectionReason || '');
              break;
            case 'delete':
              await deleteGroup();
              break;
            default:
              break;
          }
        }

        if (action === 'reject') {
          setShowRejectModal(false);
          setRejectReason('');
        }

        const successMessages: Partial<Record<StepAction, string>> = {
          saveDraft: '✅ 图组已保存为草稿！',
          submit: '图组已提交审核，等待管理员审核。',
          resubmit: '已重新提交审核。',
          withdrawToDraft: '已撤回并保存为草稿。',
          update: '图组已更新！',
          approve: '图组已批准并发布。',
          reject: '图组已驳回。',
          delete: '图组已删除。'
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
        setToast({
          message: error instanceof Error ? error.message : '操作失败，请重试',
          type: 'error'
        });
        return false;
      } finally {
        setProcessingAction(null);
      }
    },
    [backPath, currentGroupId, deleteGroup, existingPhotos.length, mode, navigate, newImages.length, onAction, persistGroup, processingAction, rejectGroup, title, approveGroup]
  );

  const stepButtons = useMemo<StepButtonConfig[]>(() => {
    if (mode === 'review' && workflowStatus === 'pending') {
      return [
        { label: '拒绝', action: 'reject', style: 'warning' },
        { label: '批准发布', action: 'approve', style: 'success' }
      ];
    }

    if (resolvedAdminView && workflowStatus === 'approved') {
      return [
        { label: '删除图组', action: 'delete', style: 'danger' },
        { label: '更新图组', action: 'update', style: 'primaryPurple' }
      ];
    }

    if (mode === 'create') {
      return [
        { label: '暂存草稿', action: 'saveDraft', style: 'gray' },
        { label: '提交审核', action: 'submit', style: 'primaryBlue' }
      ];
    }

    if (workflowStatus === 'draft' || workflowStatus === 'rejected') {
      return [
        { label: '删除图组', action: 'delete', style: 'danger' },
        { label: '暂存草稿', action: 'saveDraft', style: 'gray' },
        { label: '提交审核', action: 'submit', style: 'primaryBlue' }
      ];
    }

    if (!resolvedAdminView && workflowStatus === 'pending') {
      return [
        { label: '删除图组', action: 'delete', style: 'danger' },
        { label: '撤回并保存草稿', action: 'withdrawToDraft', style: 'gray' }
      ];
    }

    if (!resolvedAdminView && workflowStatus === 'approved') {
      return [
        { label: '删除图组', action: 'delete', style: 'danger' },
        { label: '重新提交审核', action: 'resubmit', style: 'primaryBlue' }
      ];
    }

    return [];
  }, [mode, resolvedAdminView, workflowStatus]);

  const effectiveButtons = useMemo(() => {
    return stepButtons.filter(button => !(button.action === 'delete' && !currentGroupId));
  }, [currentGroupId, stepButtons]);

  const getButtonClasses = useCallback(
    (style: ButtonStyle) => {
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
    },
    [isLight]
  );

  if (loading) {
    return (
      <div className={cn("h-full flex items-center justify-center", isLight ? "bg-gray-50" : "bg-transparent")}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple"></div>
          <p className={cn("text-sm", isLight ? "text-gray-600" : "text-gray-400")}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", isLight ? "bg-gray-50" : "bg-transparent")}>
      {/* 顶部标题栏 */}
      <div className={cn("flex-shrink-0 border-b px-6 py-4", isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20")}>
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
              {mode === 'review' ? '返回审核中心' : '返回图片列表'}
            </button>
            <div className="h-5 w-px bg-gray-300 dark:bg-gray-700" />
            <h1 className={cn("text-xl font-bold flex items-center gap-2", isLight ? "text-gray-900" : "text-white")}>
              <Upload className="h-5 w-5 text-wangfeng-purple" />
              {pageTitle}
              <span className={cn("text-sm font-normal ml-2", isLight ? "text-gray-500" : "text-gray-400")}>
                步骤 {currentStep}/2
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 1 && (
              <button
                onClick={handleNextStep}
                className="px-5 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors flex items-center gap-2"
              >
                下一步 <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {currentStep === 2 && (
              <>
                <button
                  onClick={handlePrevStep}
                  disabled={processingAction !== null}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", isLight ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-white/10 text-gray-300 hover:bg-white/20")}
                >
                  上一步
                </button>
                {effectiveButtons.map((button) => {
                  const disabled = processingAction !== null;
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
                      {busy && <Loader className="h-4 w-4 animate-spin" />}
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
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 步骤1: 基础信息和图片管理 */}
          {currentStep === 1 && (
            <>
              {/* 图组信息表单 */}
              <div className={cn("rounded-lg border p-6", isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20")}>
                <h2 className={cn("text-lg font-semibold mb-4 flex items-center gap-2", isLight ? "text-gray-900" : "text-white")}>
                  <FileText className="h-5 w-5 text-wangfeng-purple" />
                  图组信息
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className={cn("block text-sm font-medium mb-2", isLight ? "text-gray-700" : "text-gray-300")}>
                      标题 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="例如：UNFOLLOW上海站"
                      className={cn("w-full px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2", isLight ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20" : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={cn("block text-sm font-medium mb-2 flex items-center gap-1", isLight ? "text-gray-700" : "text-gray-300")}>
                        <Calendar className="h-4 w-4" />
                        日期
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={cn("w-full px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2", isLight ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20" : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={cn("block text-sm font-medium mb-2", isLight ? "text-gray-700" : "text-gray-300")}>
                      描述（可选）
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="添加图组描述..."
                      rows={3}
                      className={cn("w-full px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 resize-none", isLight ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20" : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20")}
                    />
                  </div>
                </div>
              </div>

              {/* 现有图片 */}
              {existingPhotos.length > 0 && (
                <div className={cn("rounded-lg border p-6", isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20")}>
                  <h2 className={cn("text-lg font-semibold mb-4 flex items-center gap-2", isLight ? "text-gray-900" : "text-white")}>
                    <ImageIcon className="h-5 w-5 text-wangfeng-purple" />
                    现有图片 ({existingPhotos.length} 张)
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {existingPhotos.map((photo) => (
                      <div key={photo.id} className={cn("relative group rounded-lg overflow-hidden border", isLight ? "border-gray-200" : "border-wangfeng-purple/20")}>
                        <img src={photo.image_thumb_url || photo.image_url} alt={photo.title || photo.original_filename || '图片'} className="w-full h-32 object-cover" />
                        <button
                          onClick={() => deleteExistingPhoto(photo.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="删除图片"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 图片上传区域 */}
              <div className={cn("rounded-lg border p-6", isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20")}>
                <h2 className={cn("text-lg font-semibold mb-4 flex items-center gap-2", isLight ? "text-gray-900" : "text-white")}>
                  <ImageIcon className="h-5 w-5 text-wangfeng-purple" />
                  {mode === 'create' ? '上传图片' : '添加新图片'}
                </h2>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn("border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer", isDragging ? "border-wangfeng-purple bg-wangfeng-purple/10" : isLight ? "border-gray-300 hover:border-wangfeng-purple" : "border-wangfeng-purple/30 hover:border-wangfeng-purple")}
                  onClick={() => document.getElementById(`file-input-${mode}`)?.click()}
                >
                  <Upload className={cn("h-12 w-12 mx-auto mb-4", isLight ? "text-gray-400" : "text-gray-500")} />
                  <p className={cn("text-sm mb-2", isLight ? "text-gray-600" : "text-gray-400")}>
                    拖拽图片到这里，或点击选择文件
                  </p>
                  <p className={cn("text-xs", isLight ? "text-gray-500" : "text-gray-500")}>
                    支持 JPG、PNG、WebP 格式，单个文件最大 20MB
                  </p>
                  <input
                    id={`file-input-${mode}`}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                </div>

                {/* 图片预览 */}
                {newImages.length > 0 && (
                  <div className="mt-6">
                    <p className={cn("text-sm font-medium mb-3", isLight ? "text-gray-700" : "text-gray-300")}>
                      {mode === 'create' ? '已选择' : '新添加'} {newImages.length} 张图片
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {newImages.map((image, index) => (
                        <div key={index} className={cn("relative group rounded-lg overflow-hidden border", isLight ? "border-gray-200" : "border-wangfeng-purple/20")}>
                          <img src={image.preview} alt={`预览 ${index + 1}`} className="w-full h-32 object-cover" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            {image.status === 'pending' && <span className="text-white text-xs">待上传</span>}
                            {image.status === 'uploading' && <Loader className="h-6 w-6 text-white animate-spin" />}
                            {image.status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
                            {image.status === 'error' && <AlertCircle className="h-6 w-6 text-red-500" />}
                          </div>
                          {image.status === 'pending' && (
                            <button
                              onClick={() => removeNewImage(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 步骤2: 分类与标签 */}
          {currentStep === 2 && (
            <>
              <div className={cn("rounded-lg border p-6 mb-6", isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20")}>
                <h2 className={cn("text-lg font-semibold mb-4 pb-2 border-b", isLight ? "text-gray-900 border-gray-200" : "text-white border-wangfeng-purple/20")}>
                  图组分类
                </h2>

                <div>
                  <label className={cn("block text-sm font-medium mb-2 flex items-center gap-1", isLight ? "text-gray-700" : "text-gray-300")}>
                    <Tag className="h-4 w-4" />
                    分类 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={cn("w-full px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2", isLight ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20" : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20")}
                  >
                    {categoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <TagSelectionPanel
                contextText={tagContext}
                selectedTags={selectedTags}
                onChange={setSelectedTags}
                isLight={isLight}
                infoMessage="我们会根据图组标题、描述、分类等信息推荐相关标签，也可以搜索或直接创建新标签。"
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
            <div className={cn("relative w-full max-w-md rounded-2xl border shadow-2xl", isLight ? "bg-white border-gray-200" : "bg-black/90 border-wangfeng-purple/40")}>
              <div className={cn("flex items-center justify-between px-6 py-4 border-b", isLight ? "border-gray-200" : "border-wangfeng-purple/30")}>
                <h2 className={cn("text-lg font-semibold flex items-center gap-2", isLight ? "text-gray-900" : "text-white")}>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  拒绝图片组
                </h2>
                <button type="button" onClick={() => setShowRejectModal(false)} className={cn("rounded-full p-2 transition-colors", isLight ? "text-gray-500 hover:bg-gray-100" : "text-gray-300 hover:bg-white/10")}>
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 py-5">
                <label className={cn("block text-sm font-semibold mb-2", isLight ? "text-gray-700" : "text-gray-300")}>
                  拒绝理由 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请详细说明拒绝原因..."
                  rows={5}
                  className={cn("w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2", isLight ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20" : "bg-black/60 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20")}
                />
              </div>

              <div className={cn("flex justify-end gap-3 px-6 py-4 border-t", isLight ? "border-gray-200" : "border-wangfeng-purple/30")}>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", isLight ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-white/10 text-gray-300 hover:bg-white/20")}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!rejectReason.trim()) return;
                    await triggerAction('reject', { rejectReason });
                  }}
                  disabled={!rejectReason.trim() || isActionBusy('reject')}
                  className={cn("px-6 py-2 rounded-lg text-sm font-medium transition-colors", "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed")}
                >
                  {isActionBusy('reject') ? '拒绝中...' : '确认拒绝'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && (
        <SimpleToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default GalleryEditor;
