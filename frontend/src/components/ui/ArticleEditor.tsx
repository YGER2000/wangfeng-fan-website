import { useState, useCallback, useEffect, useMemo, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RichTextEditor from './RichTextEditor';
import ImageCropModal from './ImageCropModal';
import { generateExcerpt } from '@/utils/text';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  User,
  Tag as TagIcon,
  Folder,
  FileText,
  X,
  Plus,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Search,
  Loader2
} from 'lucide-react';
import { Article } from '@/utils/contentManager';
import { getSecondaryCategories } from '@/config/categories';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAvailableCategories } from '@/utils/permissions';
import { cn } from '@/lib/utils';
import { tagAPI, TagData, TagCategoryData } from '@/utils/api';
import SimpleToast, { ToastType } from '@/components/ui/SimpleToast';
import type { ReviewStatus } from '@/components/ui/StatusBadge';

export type Step3Action =
  | 'saveDraft'
  | 'submit'
  | 'withdrawToDraft'
  | 'resubmit'
  | 'update'
  | 'approve'
  | 'reject'
  | 'delete';

interface ArticleActionPayload {
  article?: Article;
  coverImageFile?: File | null;
  articleId?: string;
  rejectReason?: string;
}

type StepButtonStyle = 'danger' | 'gray' | 'primaryBlue' | 'primaryPurple' | 'success' | 'warning';

interface StepButtonConfig {
  label: string;
  action: Step3Action;
  style: StepButtonStyle;
}

interface ArticleEditorProps {
  mode: 'create' | 'edit' | 'review';
  contentId?: string;
  contentStatus?: ReviewStatus;
  isAdminView?: boolean;
  initialArticle?: Partial<Article>;
  onAction?: (action: Step3Action, payload: ArticleActionPayload) => Promise<Article | void>;
  onPreview?: (article: Article) => void;
  onBackPathOverride?: string;
}

interface NewTagFormState {
  categoryId: string;
  value: string;
  description: string;
}

const ArticleEditor = ({
  mode,
  contentId,
  contentStatus,
  isAdminView = false,
  initialArticle,
  onAction,
  onPreview,
  onBackPathOverride,
}: ArticleEditorProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as { fromReview?: boolean; backPath?: string } | null;
  const { currentRole, user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'white';

  // 检查来源信息并确定返回路径
  const fromReview = Boolean(navigationState?.fromReview);
  const defaultBackPath =
    currentRole === 'admin' || currentRole === 'super_admin'
      ? '/admin/articles/all'
      : '/admin/my-articles';
  const backPath =
    onBackPathOverride ||
    navigationState?.backPath ||
    (fromReview ? '/admin/reviews' : defaultBackPath);
  const backButtonLabel = fromReview
    ? '返回审核中心'
    : backPath === '/admin/my-articles'
    ? '返回我的文章'
    : '返回文章列表';

  const initialContentId = contentId || (initialArticle?.id as string | undefined);
  const [currentContentId, setCurrentContentId] = useState<string | undefined>(initialContentId);
  const initialStatus = (contentStatus ||
    (initialArticle as any)?.review_status ||
    (mode === 'create' ? 'draft' : 'draft')) as ReviewStatus;

  // 步骤管理：1=编辑内容, 2=设置元数据, 3=标签与发布
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // 根据用户角色获取可用的一级分类
  const availablePrimaryCategories = getAvailableCategories(currentRole);

  const [article, setArticle] = useState<Partial<Article>>({
    title: '',
    content: '',
    author: user?.username || '汪峰',
    category: '个人感悟',
    tags: [],
    excerpt: '',
    date: new Date().toISOString().split('T')[0],
    ...initialArticle,
  });

  // 二级分类状态
  const defaultPrimary = initialArticle?.category_primary || availablePrimaryCategories[0] || '峰言峰语';
  const [categoryPrimary, setCategoryPrimary] = useState(defaultPrimary);
  const [categorySecondary, setCategorySecondary] = useState(
    initialArticle?.category_secondary || '汪峰博客'
  );
  const [availableSecondaries, setAvailableSecondaries] = useState<string[]>([]);

  // 日期选择状态
  const [selectedDate, setSelectedDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  });

  // 生成年份选项（1971年到2071年）
  const years = Array.from({ length: 101 }, (_, i) => 1971 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 根据年份和月份生成日期选项
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const days = Array.from({ length: getDaysInMonth(selectedDate.year, selectedDate.month) }, (_, i) => i + 1);

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // 审核相关状态
  const [workflowStatus, setWorkflowStatus] = useState<ReviewStatus>(initialStatus);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // 标签资源与推荐
  const [allTags, setAllTags] = useState<TagData[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategoryData[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagFetchError, setTagFetchError] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<TagData[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [tagSearchResults, setTagSearchResults] = useState<TagData[]>([]);
  const [isSearchingTags, setIsSearchingTags] = useState(false);
  const [newTagForm, setNewTagForm] = useState<NewTagFormState>({
    categoryId: '',
    value: '',
    description: '',
  });
  const [newTagError, setNewTagError] = useState<string | null>(null);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);

  const handleResetNewTagForm = useCallback(() => {
    setNewTagError(null);
    setNewTagForm({
      categoryId: tagCategories[0] ? String(tagCategories[0].id) : '',
      value: '',
      description: '',
    });
  }, [tagCategories]);

  const openCreateTagModal = useCallback(() => {
    handleResetNewTagForm();
    setShowCreateTagModal(true);
  }, [handleResetNewTagForm]);

  const closeCreateTagModal = useCallback(() => {
    handleResetNewTagForm();
    setShowCreateTagModal(false);
  }, [handleResetNewTagForm]);

  // 封面相关状态
  const [coverImage, setCoverImage] = useState<string | null>(null); // 封面URL或base64
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null); // 封面文件
  const [contentImages, setContentImages] = useState<string[]>([]); // 从正文提取的图片
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  // 当selectedDate改变时，更新表单中的date字段
  useEffect(() => {
    const formattedDate = `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
    setArticle(prev => ({ ...prev, date: formattedDate }));
  }, [selectedDate]);

  // 初始化时设置日期
  useEffect(() => {
    if (article.date) {
      const [year, month, day] = article.date.split('-').map(Number);
      setSelectedDate({ year, month, day });
    }
  }, []);

  // 初始化时加载现有封面
  useEffect(() => {
    if (initialArticle?.coverUrl) {
      setCoverImage(initialArticle.coverUrl);
    }
  }, [initialArticle?.coverUrl]);

  // 当一级分类变化时，更新二级分类选项
  useEffect(() => {
    const secondaries = getSecondaryCategories(categoryPrimary);
    setAvailableSecondaries(secondaries);
    if (!secondaries.includes(categorySecondary)) {
      setCategorySecondary(secondaries[0] || '');
    }
  }, [categoryPrimary]);

  // 从内容中提取图片
  useEffect(() => {
    if (article.content) {
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      const matches = Array.from(article.content.matchAll(imgRegex));
      const images = matches.map(match => match[1]);
      setContentImages(images);

      // 如果有图片且没有设置封面，默认使用第一张
      if (images.length > 0 && !coverImage) {
        setCoverImage(images[0]);
      }
    }
  }, [article.content]);

  const handleContentChange = useCallback((val?: string) => {
    setArticle(prev => ({ ...prev, content: val || '' }));
  }, []);

  const handleInputChange = (field: keyof Article, value: string) => {
    setArticle(prev => ({ ...prev, [field]: value }));
  };

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

  const handleAddTag = (tagName: string) => {
    const normalized = tagName.trim();
    if (!normalized) return;
    setArticle(prev => {
      const existing = prev.tags || [];
      if (existing.includes(normalized)) {
        return prev;
      }
      return {
        ...prev,
        tags: [...existing, normalized]
      };
    });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setArticle(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  // 处理封面图片上传
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // 选择正文中的图片作为封面
  const selectContentImage = (imageUrl: string) => {
    setImageToCrop(imageUrl);
    setShowCropModal(true);
  };

  // 裁剪完成
  const handleCropComplete = (croppedImage: File) => {
    setCoverImageFile(croppedImage);
    const reader = new FileReader();
    reader.onload = () => {
      setCoverImage(reader.result as string);
    };
    reader.readAsDataURL(croppedImage);
    setShowCropModal(false);
  };

  const loadTagResources = useCallback(async () => {
    setTagsLoading(true);
    setTagFetchError(null);
    try {
      const [tagsData, categoriesData] = await Promise.all([
        tagAPI.list(0, 500),
        tagAPI.listCategories()
      ]);
      setAllTags(tagsData);
      setTagCategories(categoriesData);
    } catch (error) {
      console.error('加载标签资源失败:', error);
      setTagFetchError('加载标签资源失败，请稍后重试');
    } finally {
      setTagsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentStep === 3 && !tagsLoading && allTags.length === 0 && !tagFetchError) {
      loadTagResources();
    }
  }, [currentStep, tagsLoading, allTags.length, tagFetchError, loadTagResources]);

  useEffect(() => {
    if (tagCategories.length > 0) {
      setNewTagForm(prev => {
        if (prev.categoryId) {
          return prev;
        }
        return {
          ...prev,
          categoryId: String(tagCategories[0].id),
        };
      });
    }
  }, [tagCategories]);

  const getTagDisplayName = useCallback(
    (tag: TagData) => (tag.display_name || tag.name || tag.value || '').trim(),
    []
  );

  const recomputeSuggestions = useCallback(() => {
    if (allTags.length === 0) {
      setSuggestedTags([]);
      setIsGeneratingSuggestions(false);
      return;
    }

    const plainContent = (article.content || '').replace(/<[^>]+>/g, ' ');
    if (!plainContent.trim()) {
      setSuggestedTags([]);
      setIsGeneratingSuggestions(false);
      return;
    }

    setIsGeneratingSuggestions(true);
    const normalizedContent = plainContent.toLowerCase();
    const condensedContent = normalizedContent.replace(/\s+/g, '');
    const selectedSet = new Set((article.tags || []).map(tag => tag.toLowerCase()));
    const matches: TagData[] = [];

    allTags.forEach(tag => {
      const displayName = getTagDisplayName(tag);
      if (!displayName || selectedSet.has(displayName.toLowerCase())) {
        return;
      }

      const candidates = [tag.value, tag.display_name, tag.name].filter(Boolean) as string[];
      const matched = candidates.some(candidate => {
        const normalizedCandidate = candidate.toLowerCase();
        const condensedCandidate = normalizedCandidate.replace(/\s+/g, '');
        return (
          normalizedCandidate.length > 0 &&
          (normalizedContent.includes(normalizedCandidate) ||
            condensedContent.includes(condensedCandidate))
        );
      });

      if (matched && !matches.some(item => item.id === tag.id)) {
        matches.push(tag);
      }
    });

    setSuggestedTags(matches.slice(0, 10));
    setIsGeneratingSuggestions(false);
  }, [allTags, article.content, article.tags, getTagDisplayName]);

  useEffect(() => {
    if (currentStep === 3) {
      recomputeSuggestions();
    }
  }, [currentStep, recomputeSuggestions]);

  useEffect(() => {
    if (currentStep !== 3) {
      return;
    }

    if (!tagSearchQuery.trim()) {
      setTagSearchResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearchingTags(true);
      try {
        const results = await tagAPI.search(tagSearchQuery.trim());
        const selectedSet = new Set((article.tags || []).map(tag => tag.toLowerCase()));
        setTagSearchResults(
          results.filter(tag => {
            const displayName = getTagDisplayName(tag).toLowerCase();
            return displayName && !selectedSet.has(displayName);
          })
        );
      } catch (error) {
        console.error('搜索标签失败:', error);
        setTagSearchResults([]);
      } finally {
        setIsSearchingTags(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [tagSearchQuery, currentStep, article.tags, getTagDisplayName]);

  const handleAddTagFromData = (tag: TagData) => {
    const displayName = getTagDisplayName(tag);
    if (!displayName) return;
    handleAddTag(displayName);
    setTagSearchResults(prev => prev.filter(item => item.id !== tag.id));
    setSuggestedTags(prev => prev.filter(item => item.id !== tag.id));
  };

  const handleCreateNewTag = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newTagForm.value.trim()) {
      setNewTagError('请输入标签名称');
      return;
    }

    const categoryId = Number(newTagForm.categoryId);
    if (!newTagForm.categoryId || Number.isNaN(categoryId) || categoryId <= 0) {
      setNewTagError('请选择标签种类');
      return;
    }

    setNewTagError(null);
    setIsCreatingTag(true);

    try {
      const created = await tagAPI.create({
        categoryId,
        value: newTagForm.value.trim(),
        description: newTagForm.description.trim() ? newTagForm.description.trim() : undefined,
      });
      setAllTags(prev => [...prev, created]);
      const displayName = getTagDisplayName(created);
      if (displayName) {
        handleAddTag(displayName);
      }
      closeCreateTagModal();
    } catch (error) {
      console.error('创建标签失败:', error);
      setNewTagError(error instanceof Error ? error.message : '创建标签失败，请稍后重试');
    } finally {
      setIsCreatingTag(false);
    }
  };

  // 步骤导航
  const handleNextFromStepOne = () => {
    if (!article.title || !article.content) {
      setToast({ message: '请填写标题和内容', type: 'error' });
      return;
    }
    setToast(null);
    setCurrentStep(2);
  };

  const handleNextFromStepTwo = () => {
    setToast(null);
    setCurrentStep(3);
  };

  const handlePrevStep = () => {
    setToast(null);
    setCurrentStep(prev => {
      if (prev === 3) return 2;
      return 1;
    });
  };

  const buildArticlePayload = useCallback(
    (statusOverride?: ReviewStatus) => {
      const targetStatus = statusOverride || workflowStatus;
      const slugSource = article.title?.trim() || '';
      return {
        id: currentContentId || Date.now().toString(),
        slug: slugSource ? slugSource.toLowerCase().replace(/\s+/g, '-') : '',
        title: article.title || '',
        content: article.content || '',
        author: article.author || '汪峰',
        date: article.date || new Date().toISOString().split('T')[0],
        category: article.category || '个人感悟',
        category_primary: categoryPrimary,
        category_secondary: categorySecondary,
        tags: article.tags || [],
        excerpt: article.excerpt || generateExcerpt(article.content || '', 150) || '',
        coverUrl: coverImage || (article as any).coverUrl,
        review_status: targetStatus,
        is_published: targetStatus === 'approved',
      };
    },
    [article, categoryPrimary, categorySecondary, workflowStatus, currentContentId, coverImage]
  );

  const triggerAction = async (
    action: Step3Action,
    options?: { rejectReason?: string }
  ): Promise<boolean> => {
    if (!onAction) {
      console.warn('ArticleEditor onAction handler is not defined');
      return;
    }

    const needsValidation = ['saveDraft', 'submit', 'resubmit', 'update', 'withdrawToDraft'].includes(action);
    if (needsValidation && (!article.title?.trim() || !article.content?.trim())) {
      setToast({ message: '请填写标题和内容', type: 'error' });
      return;
    }

    if (action === 'delete') {
      if (!currentContentId) {
        setToast({ message: '内容尚未保存，无法删除', type: 'error' });
        return;
      }
      if (typeof window !== 'undefined') {
        const confirmed = window.confirm('确定删除该文章吗？');
        if (!confirmed) {
          return;
        }
      }
    }

    const setLoading = (value: boolean) => {
      if (action === 'approve') {
        setIsApproving(value);
      } else if (action === 'reject') {
        setIsRejecting(value);
      } else {
        setIsSaving(value);
      }
    };

    let success = false;

    try {
      setToast(null);
      setLoading(true);

      const statusMap: Partial<Record<Step3Action, ReviewStatus>> = {
        saveDraft: 'draft',
        withdrawToDraft: 'draft',
        submit: 'pending',
        resubmit: 'pending',
        update: 'approved',
        approve: 'approved',
        reject: 'rejected',
      };

      const shouldAttachArticle = ['saveDraft', 'submit', 'withdrawToDraft', 'resubmit', 'update'].includes(action);
      let articlePayload: (Article & { review_status: ReviewStatus; is_published: boolean }) | undefined;

      if (shouldAttachArticle) {
        const target = statusMap[action] || workflowStatus;
        articlePayload = buildArticlePayload(target);

        if (action === 'update') {
          articlePayload.review_status = 'approved';
          articlePayload.is_published = true;
        }

        if (action === 'saveDraft' || action === 'withdrawToDraft') {
          articlePayload.review_status = 'draft';
          articlePayload.is_published = false;
        }

        if (action === 'submit' || action === 'resubmit') {
          articlePayload.review_status = 'pending';
          articlePayload.is_published = false;
        }
      }

      const payload: ArticleActionPayload = {
        article: articlePayload,
        coverImageFile: articlePayload ? (coverImageFile || null) : undefined,
        articleId: currentContentId,
        rejectReason: options?.rejectReason,
      };

      const result = await onAction(action, payload);
      const nextStatus = (result as any)?.review_status ?? statusMap[action] ?? workflowStatus;

      if (result && (result as any).id) {
        setCurrentContentId((result as any).id);
      }

      if (nextStatus && ['saveDraft', 'submit', 'withdrawToDraft', 'resubmit', 'update', 'approve', 'reject'].includes(action)) {
        setWorkflowStatus(nextStatus as ReviewStatus);
      }

      const successMessages: Partial<Record<Step3Action, string>> = {
        saveDraft: '✅ 文章已保存为草稿！',
        submit: '文章已提交审核，等待审核通过后发布！',
        resubmit: '已重新提交审核，等待管理员审核。',
        withdrawToDraft: '已撤回并保存为草稿，可继续编辑。',
        update: '文章已更新！',
        approve: '文章已批准并发布。',
        reject: '文章已驳回。',
        delete: '文章已删除。',
      };

      const successMessage = successMessages[action];
      if (successMessage) {
        setToast({ message: successMessage, type: 'success' });
      }

      const actionsNeedNavigation: Step3Action[] = [
        'saveDraft',
        'submit',
        'withdrawToDraft',
        'resubmit',
        'update',
        'approve',
        'reject',
        'delete',
      ];

      if (actionsNeedNavigation.includes(action)) {
        const delay =
          action === 'saveDraft' ||
          action === 'withdrawToDraft' ||
          action === 'approve' ||
          action === 'reject' ||
          action === 'delete'
            ? 1500
            : 3000;

        setTimeout(() => {
          navigate(backPath);
        }, delay);
      }

      success = true;
    } catch (error) {
      console.error('操作失败:', error);
      const errorMessages: Partial<Record<Step3Action, string>> = {
        saveDraft: '保存草稿失败，请重试',
        submit: '提交审核失败，请重试',
        resubmit: '重新提交失败，请重试',
        withdrawToDraft: '撤回失败，请稍后再试',
        update: '更新失败，请重试',
        approve: '批准失败，请稍后再试',
        reject: '驳回失败，请稍后再试',
        delete: '删除失败，请稍后再试',
      };
      setToast({ message: errorMessages[action] || '操作失败，请重试', type: 'error' });
    } finally {
      setLoading(false);
    }

    return success;
  };

  const step3Buttons = useMemo<StepButtonConfig[]>(() => {
    if (mode === 'review' && workflowStatus === 'pending') {
      return [
        { label: '拒绝', action: 'reject', style: 'warning' },
        { label: '批准发布', action: 'approve', style: 'success' },
      ];
    }

    if (isAdminView && workflowStatus === 'approved' && mode === 'edit') {
      return [
        { label: '删除文章', action: 'delete', style: 'danger' },
        { label: '更新文章', action: 'update', style: 'primaryPurple' },
      ];
    }

    if (mode === 'create') {
      return [
        { label: '暂存草稿', action: 'saveDraft', style: 'gray' },
        { label: '提交审核', action: 'submit', style: 'primaryBlue' },
      ];
    }

    if (workflowStatus === 'draft' || workflowStatus === 'rejected') {
      return [
        { label: '删除文章', action: 'delete', style: 'danger' },
        { label: '暂存草稿', action: 'saveDraft', style: 'gray' },
        { label: '提交审核', action: 'submit', style: 'primaryBlue' },
      ];
    }

    if (!isAdminView && workflowStatus === 'pending') {
      return [
        { label: '删除文章', action: 'delete', style: 'danger' },
        { label: '撤回并保存为草稿', action: 'withdrawToDraft', style: 'gray' },
      ];
    }

    if (!isAdminView && workflowStatus === 'approved') {
      return [
        { label: '删除文章', action: 'delete', style: 'danger' },
        { label: '重新提交审核', action: 'resubmit', style: 'primaryBlue' },
      ];
    }

    return [];
  }, [mode, workflowStatus, isAdminView]);

  const getButtonClasses = (style: StepButtonStyle) => {
    const base =
      "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

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
        return cn(
          base,
          'bg-blue-600 text-white hover:bg-blue-700'
        );
      case 'primaryPurple':
        return cn(
          base,
          'bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90'
        );
      case 'success':
        return cn(
          base,
          'bg-green-600 text-white hover:bg-green-700'
        );
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
  };

  const isActionBusy = (action: Step3Action) => {
    if (action === 'approve') return isApproving;
    if (action === 'reject') return isRejecting;
    return isSaving;
  };

  // 权限检查
  if (availablePrimaryCategories.length === 0) {
    return (
      <div className={cn(
        "h-full flex items-center justify-center",
        isLight ? "bg-gray-50" : "bg-transparent"
      )}>
        <div className={cn(
          "max-w-md p-8 rounded-lg border text-center",
          isLight ? "bg-white border-gray-200" : "bg-black/40 border-red-500/30"
        )}>
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className={cn("text-xl font-bold mb-2", isLight ? "text-gray-900" : "text-white")}>
            权限不足
          </h2>
          <p className={cn("text-sm", isLight ? "text-gray-600" : "text-gray-400")}>
            您没有权限发布文章。请联系管理员。
          </p>
        </div>
      </div>
    );
  }

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
              <FileText className="h-5 w-5 text-wangfeng-purple" />
              {currentContentId ? '编辑文章' : '发布文章'}
              <span className={cn("text-sm font-normal ml-2", isLight ? "text-gray-500" : "text-gray-400")}>
                步骤 {currentStep}/3
              </span>
            </h1>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            {currentStep === 1 && (
              <button
                onClick={handleNextFromStepOne}
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
                <button
                  onClick={handleNextFromStepTwo}
                  className="px-5 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors flex items-center gap-2"
                >
                  下一步
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* 步骤3的按钮 */}
            {currentStep === 3 && (
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
                {step3Buttons.map((button) => {
                  const disableAll = isSaving || isApproving || isRejecting;
                  const isBusy = isActionBusy(button.action);
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
                      disabled={disableAll}
                      className={getButtonClasses(button.style)}
                    >
                      {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                      {button.label}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 - 允许滚动 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* 步骤1: 编辑标题和内容 */}
          {currentStep === 1 && (
            <>
              {/* 标题输入 */}
              <div className={cn(
                "rounded-lg border p-6 mb-6",
                isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
              )}>
                <label className={cn(
                  "block text-sm font-medium mb-2",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>
                  文章标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={article.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-lg transition-colors focus:outline-none focus:ring-2",
                    isLight
                      ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                      : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                  )}
                  placeholder="请输入文章标题"
                  required
                />
              </div>

              {/* 文章内容编辑器 */}
              <div className={cn(
                "rounded-lg border p-6",
                isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
              )}>
                <h2 className={cn(
                  "text-lg font-semibold mb-4 pb-2 border-b",
                  isLight ? "text-gray-900 border-gray-200" : "text-white border-wangfeng-purple/20"
                )}>
                  文章内容 <span className="text-red-500">*</span>
                </h2>

                <div className="rich-text-editor-container min-h-[40vh]">
                  <RichTextEditor
                    value={article.content || ''}
                    onChange={handleContentChange}
                    articleId={initialArticle?.id || 'new-article-' + Date.now()}
                    categoryPrimary={categoryPrimary}
                  />
                </div>
              </div>
            </>
          )}

          {/* 步骤2: 设置元数据和封面 */}
          {currentStep === 2 && (
            <>
              {/* 权限提示 */}
              {currentRole === 'user' && (
                <div className={cn(
                  "rounded-lg border p-4 flex items-start gap-3 mb-6",
                  isLight
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                )}>
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">
                    <span className="font-semibold">提示：</span> 普通用户发布的文章需要管理员审核后才会显示
                  </span>
                </div>
              )}

              {/* 封面设置 */}
              <div className={cn(
                "rounded-lg border p-6 mb-6",
                isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
              )}>
                <h2 className={cn(
                  "text-lg font-semibold mb-4 pb-2 border-b",
                  isLight ? "text-gray-900 border-gray-200" : "text-white border-wangfeng-purple/20"
                )}>
                  <ImageIcon className="inline h-5 w-5 mr-2 -mt-0.5 text-wangfeng-purple" />
                  文章封面
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 当前封面预览 */}
                  <div className="lg:col-span-1">
                    <p className={cn("text-sm font-medium mb-3", isLight ? "text-gray-700" : "text-gray-300")}>
                      当前封面预览（16:9）
                    </p>
                    <div className={cn(
                      "relative w-full rounded-lg overflow-hidden border-2",
                      isLight ? "border-gray-200 bg-gray-50" : "border-wangfeng-purple/30 bg-black/50"
                    )}
                      style={{ paddingTop: '56.25%' }} // 16:9 比例
                    >
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt="封面预览"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className={cn("h-12 w-12", isLight ? "text-gray-300" : "text-gray-600")} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 封面选择选项 */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* 从正文选择 */}
                    {contentImages.length > 0 && (
                      <div>
                        <p className={cn("text-sm font-medium mb-2", isLight ? "text-gray-700" : "text-gray-300")}>
                          从正文选择图片
                        </p>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                          {contentImages.map((img, index) => (
                            <button
                              key={index}
                              onClick={() => selectContentImage(img)}
                              className={cn(
                                "relative rounded-lg overflow-hidden border-2 transition-all hover:border-wangfeng-purple",
                                coverImage === img
                                  ? "border-wangfeng-purple ring-2 ring-wangfeng-purple/50"
                                  : isLight ? "border-gray-200" : "border-wangfeng-purple/30"
                              )}
                              style={{ paddingTop: '56.25%' }}
                            >
                              <img
                                src={img}
                                alt={`正文图片 ${index + 1}`}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 上传新图片 */}
                    <div>
                      <p className={cn("text-sm font-medium mb-2", isLight ? "text-gray-700" : "text-gray-300")}>
                        上传自定义封面
                      </p>
                      <label className={cn(
                        "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
                        isLight
                          ? "border-gray-300 hover:border-wangfeng-purple hover:bg-wangfeng-purple/5"
                          : "border-wangfeng-purple/30 hover:border-wangfeng-purple hover:bg-wangfeng-purple/10"
                      )}>
                        <Upload className="h-5 w-5 text-wangfeng-purple" />
                        <span className={cn("text-sm font-medium", isLight ? "text-gray-700" : "text-gray-300")}>
                          点击上传图片
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="hidden"
                        />
                      </label>
                      <p className={cn("text-xs mt-2", isLight ? "text-gray-500" : "text-gray-400")}>
                        建议尺寸：1200x675 像素（16:9），支持 JPG、PNG 格式
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 基础信息区域 */}
              <div className={cn(
                "rounded-lg border p-6 mb-6",
                isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
              )}>
                <h2 className={cn(
                  "text-lg font-semibold mb-4 pb-2 border-b",
                  isLight ? "text-gray-900 border-gray-200" : "text-white border-wangfeng-purple/20"
                )}>
                  文章信息
                </h2>

                <div className="space-y-5">
                  {/* 作者和日期 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={cn(
                        "block text-sm font-medium mb-2",
                        isLight ? "text-gray-700" : "text-gray-300"
                      )}>
                        <User className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                        作者 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={article.author || ''}
                        onChange={(e) => handleInputChange('author', e.target.value)}
                        className={cn(
                          "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                          isLight
                            ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                            : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                        )}
                        placeholder="作者姓名"
                      />
                    </div>

                    <div>
                      <label className={cn(
                        "block text-sm font-medium mb-2",
                        isLight ? "text-gray-700" : "text-gray-300"
                      )}>
                        <Calendar className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                        发布日期 <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <select
                          value={selectedDate.year}
                          onChange={(e) => updateSelectedDate('year', parseInt(e.target.value))}
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                            isLight
                              ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                              : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          )}
                        >
                          {years.map(year => (
                            <option key={year} value={year}>{year}年</option>
                          ))}
                        </select>
                        <select
                          value={selectedDate.month}
                          onChange={(e) => updateSelectedDate('month', parseInt(e.target.value))}
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                            isLight
                              ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                              : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          )}
                        >
                          {months.map(month => (
                            <option key={month} value={month}>{month}月</option>
                          ))}
                        </select>
                        <select
                          value={selectedDate.day}
                          onChange={(e) => updateSelectedDate('day', parseInt(e.target.value))}
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
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

                  {/* 文章摘要 */}
                  <div>
                    <label className={cn(
                      "block text-sm font-medium mb-2",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      文章摘要（可选）
                    </label>
                    <textarea
                      value={article.excerpt || ''}
                      onChange={(e) => handleInputChange('excerpt', e.target.value)}
                      rows={3}
                      className={cn(
                        "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 resize-none",
                        isLight
                          ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                      )}
                      placeholder="简要描述文章内容，用于卡片展示和SEO（留空则自动从正文提取）"
                    />
                  </div>

                </div>
              </div>
            </>
          )}
 
          {/* 步骤3: 分类与标签 */}
          {currentStep === 3 && (
            <>
              {/* 分类选择 */}
              <div className={cn(
                "rounded-lg border p-6 mb-6",
                isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
              )}>
                <h2 className={cn(
                  "text-lg font-semibold mb-4 pb-2 border-b",
                  isLight ? "text-gray-900 border-gray-200" : "text-white border-wangfeng-purple/20"
                )}>
                  <Folder className="inline h-5 w-5 mr-2 text-wangfeng-purple" />
                  文章分类
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={cn(
                      "block text-sm font-medium mb-2",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      <Folder className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                      一级分类 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={categoryPrimary}
                      onChange={(e) => setCategoryPrimary(e.target.value)}
                      className={cn(
                        "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                        isLight
                          ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                      )}
                      required
                    >
                      {availablePrimaryCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={cn(
                      "block text-sm font-medium mb-2",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      <Folder className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                      二级分类 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={categorySecondary}
                      onChange={(e) => setCategorySecondary(e.target.value)}
                      className={cn(
                        "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                        isLight
                          ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                      )}
                      required
                    >
                      {availableSecondaries.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <p className={cn("text-xs mt-1.5", isLight ? "text-gray-500" : "text-gray-400")}>
                      当前选择: <span className="text-wangfeng-purple font-semibold">{categoryPrimary} / {categorySecondary}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 标签管理 */}
              <div className={cn(
                "rounded-lg border p-6 mb-6",
                isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
              )}>
                <h2 className={cn(
                  "text-lg font-semibold mb-3 pb-2 border-b flex items-center justify-between",
                  isLight ? "text-gray-900 border-gray-200" : "text-white border-wangfeng-purple/20"
                )}>
                  <span className="flex items-center gap-2">
                    <TagIcon className="h-5 w-5 text-wangfeng-purple" />
                    标签管理
                    {/* 信息提示图标 */}
                    <div className="relative group">
                      <button
                        type="button"
                        className={cn(
                          "p-1.5 rounded-full transition-colors",
                          isLight
                            ? "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            : "text-gray-500 hover:bg-white/10 hover:text-gray-300"
                        )}
                        title="标签管理帮助"
                      >
                        <span className="text-xs">ⓘ</span>
                      </button>

                      {/* Tooltip 提示框 */}
                      <div className={cn(
                        "invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 px-4 py-2 rounded-lg text-xs whitespace-nowrap",
                        isLight
                          ? "bg-gray-900 text-white"
                          : "bg-gray-800 text-gray-100"
                      )}>
                        我们会基于内容推荐标签，也可搜索或创建新标签
                        {/* Tooltip 箭头 */}
                        <div className={cn(
                          "absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45",
                          isLight ? "bg-gray-900" : "bg-gray-800"
                        )} />
                      </div>
                    </div>
                  </span>
                  <button
                    type="button"
                    onClick={recomputeSuggestions}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                      isLight
                        ? "bg-wangfeng-purple/10 text-wangfeng-purple hover:bg-wangfeng-purple/20"
                        : "bg-wangfeng-purple/30 text-wangfeng-purple hover:bg-wangfeng-purple/40"
                    )}
                  >
                    <Sparkles className="h-4 w-4" />
                    重新匹配
                  </button>
                </h2>

                {/* 推荐标签 */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={cn(
                      "text-sm font-semibold flex items-center gap-2",
                      isLight ? "text-gray-900" : "text-gray-200"
                    )}>
                      <Sparkles className="h-4 w-4 text-wangfeng-purple" />
                      推荐标签
                    </h3>
                    {tagsLoading && (
                      <span className={cn(
                        "text-xs flex items-center gap-1",
                        isLight ? "text-gray-500" : "text-gray-400"
                      )}>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        加载标签资源...
                      </span>
                    )}
                  </div>

                  {tagFetchError && (
                    <div className={cn(
                      "rounded-lg border px-3 py-2 text-xs flex items-start gap-2 mb-3",
                      isLight
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    )}>
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p>{tagFetchError}</p>
                        <button
                          type="button"
                          onClick={loadTagResources}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-wangfeng-purple hover:underline"
                        >
                          重新加载
                        </button>
                      </div>
                    </div>
                  )}

                  {isGeneratingSuggestions ? (
                    <div className={cn(
                      "rounded-lg border px-4 py-6 text-center",
                      isLight ? "border-gray-200 bg-gray-50" : "border-wangfeng-purple/20 bg-black/40"
                    )}>
                      <Loader2 className="h-5 w-5 mx-auto mb-2 animate-spin text-wangfeng-purple" />
                      <p className={cn(
                        "text-xs",
                        isLight ? "text-gray-500" : "text-gray-400"
                      )}>
                        正在分析正文内容，寻找合适的标签...
                      </p>
                    </div>
                  ) : suggestedTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleAddTagFromData(tag)}
                          className={cn(
                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                            isLight
                              ? "bg-wangfeng-purple/10 text-wangfeng-purple hover:bg-wangfeng-purple/20"
                              : "bg-wangfeng-purple/20 text-wangfeng-purple hover:bg-wangfeng-purple/30"
                          )}
                        >
                          {getTagDisplayName(tag)}
                          <Plus className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className={cn(
                      "text-xs px-3 py-2 rounded-lg border",
                      isLight ? "border-gray-200 text-gray-500 bg-gray-50" : "border-wangfeng-purple/20 text-gray-400 bg-black/40"
                    )}>
                      暂未找到匹配的推荐标签。您可以使用下方的搜索或创建功能。
                    </p>
                  )}
                </div>

                {/* 标签搜索 */}
                <div className="mb-6">
                  <label className={cn(
                    "text-sm font-semibold flex items-center gap-2 mb-2",
                    isLight ? "text-gray-900" : "text-gray-200"
                  )}>
                    <Search className="h-4 w-4 text-wangfeng-purple" />
                    搜索标签
                  </label>
                  <div className="relative mb-3">
                    <Search className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                      isLight ? "text-gray-500" : "text-gray-400"
                    )} />
                    <input
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      placeholder="输入关键词搜索标签..."
                      className={cn(
                        "w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2",
                        isLight
                          ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                      )}
                    />
                    {isSearchingTags && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-wangfeng-purple" />
                    )}
                  </div>
                  <div className={cn(
                    "rounded-lg border px-3 py-3 min-h-[60px]",
                    isLight ? "border-gray-200 bg-gray-50" : "border-wangfeng-purple/20 bg-black/40"
                  )}>
                    {tagSearchQuery.trim() === '' ? (
                      <p className={cn(
                        "text-xs",
                        isLight ? "text-gray-500" : "text-gray-400"
                      )}>
                        输入关键词后，我们会显示匹配的标签结果。
                      </p>
                    ) : tagSearchResults.length === 0 ? (
                      <p className={cn(
                        "text-xs",
                        isLight ? "text-gray-500" : "text-gray-400"
                      )}>
                        没有找到相关标签。可以尝试使用其他关键词，或直接在下方创建新标签。
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tagSearchResults.map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleAddTagFromData(tag)}
                            className={cn(
                              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                              isLight
                                ? "bg-white text-wangfeng-purple border border-wangfeng-purple/40 hover:bg-wangfeng-purple/10"
                                : "bg-black/60 text-wangfeng-purple border border-wangfeng-purple/40 hover:bg-wangfeng-purple/20"
                            )}
                          >
                            {getTagDisplayName(tag)}
                            <Plus className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 已选标签 */}
                <div className="mb-6">
                  <h3 className={cn(
                    "text-sm font-semibold mb-2 flex items-center gap-2",
                    isLight ? "text-gray-900" : "text-gray-200"
                  )}>
                    <TagIcon className="h-4 w-4 text-wangfeng-purple" />
                    已选择的标签
                  </h3>
                  {article.tags && article.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                            isLight
                              ? "bg-wangfeng-purple/10 text-wangfeng-purple"
                              : "bg-wangfeng-purple/20 text-wangfeng-purple"
                          )}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={cn(
                      "text-xs px-3 py-2 rounded-lg border",
                      isLight ? "border-gray-200 text-gray-500 bg-gray-50" : "border-wangfeng-purple/20 text-gray-400 bg-black/40"
                    )}>
                      还没有选择标签。建议至少添加 1-2 个标签，便于内容分类与检索。
                    </p>
                  )}
                </div>

                {/* 创建新标签入口 */}
                <div className={cn(
                  "rounded-lg border px-4 py-4",
                  isLight ? "border-gray-200 bg-gray-50" : "border-wangfeng-purple/20 bg-black/30"
                )}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className={cn(
                        "text-sm font-semibold flex items-center gap-2",
                        isLight ? "text-gray-900" : "text-gray-200"
                      )}>
                        <Plus className="h-4 w-4 text-wangfeng-purple" />
                        创建新标签
                      </h3>
                      <p className={cn(
                        "text-xs mt-1",
                        isLight ? "text-gray-500" : "text-gray-400"
                      )}>
                        若搜索结果中没有合适的标签，可以点击按钮新建。创建后会同步到标签管理页。
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openCreateTagModal}
                      disabled={tagCategories.length === 0}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
                        isLight
                          ? "bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90 disabled:bg-gray-200 disabled:text-gray-500"
                          : "bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90 disabled:bg-white/10 disabled:text-gray-500"
                      )}
                    >
                      <Plus className="h-4 w-4" />
                      新建标签
                    </button>
                  </div>
                  {tagCategories.length === 0 && (
                    <p className={cn(
                      "text-xs mt-3 rounded-lg border px-3 py-2",
                      isLight ? "border-gray-200 text-gray-500 bg-white" : "border-wangfeng-purple/20 text-gray-400 bg-black/40"
                    )}>
                      正在加载标签种类...
                    </p>
                  )}
                </div>
              </div>

              {/* 审核区域移除，改为固定底部栏 */}
            </>
          )}
      </div>
    </div>

      {/* 创建标签弹窗 */}
      {showCreateTagModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={closeCreateTagModal} />
          <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto">
            <div className={cn(
              "relative w-full max-w-2xl rounded-2xl border shadow-2xl",
              isLight ? "bg-white border-gray-200" : "bg-black/80 border-wangfeng-purple/40"
            )}>
              <div className={cn(
                "flex items-center justify-between px-6 py-4 border-b",
                isLight ? "border-gray-200" : "border-wangfeng-purple/30"
              )}>
                <div>
                  <h2 className={cn(
                    "text-lg font-semibold",
                    isLight ? "text-gray-900" : "text-white"
                  )}>
                    创建新标签
                  </h2>
                  <p className={cn(
                    "text-xs mt-1",
                    isLight ? "text-gray-500" : "text-gray-400"
                  )}>
                    创建后将自动添加到当前文章，并在标签管理页面中可见与管理。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCreateTagModal}
                  className={cn(
                    "rounded-full p-2 transition-colors",
                    isLight ? "text-gray-500 hover:bg-gray-100" : "text-gray-300 hover:bg-white/10"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewTag} className="px-6 py-5 space-y-4">
                {newTagError && (
                  <div className={cn(
                    "rounded-lg border px-3 py-2 text-sm flex items-start gap-2",
                    isLight
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "bg-red-500/10 border-red-500/30 text-red-300"
                  )}>
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{newTagError}</span>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={cn(
                      "block text-xs font-semibold mb-2",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      选择标签种类
                    </label>
                    <select
                      value={newTagForm.categoryId}
                      onChange={(e) => setNewTagForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2",
                        isLight
                          ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          : "bg-black/60 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/30"
                      )}
                    >
                      <option value="">请选择标签种类</option>
                      {tagCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={cn(
                      "block text-xs font-semibold mb-2",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      标签名称
                    </label>
                    <input
                      value={newTagForm.value}
                      onChange={(e) => setNewTagForm(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="例如：2024巡演、汪峰经典"
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2",
                        isLight
                          ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          : "bg-black/60 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/30"
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={cn(
                      "block text-xs font-semibold mb-2",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      标签描述（可选）
                    </label>
                    <textarea
                      value={newTagForm.description}
                      onChange={(e) => setNewTagForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2",
                        isLight
                          ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          : "bg-black/60 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/30"
                      )}
                      placeholder="补充标签使用场景或说明，便于其他管理员理解（可选）"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleResetNewTagForm}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isLight
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    )}
                  >
                    重置
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTag}
                    className="px-5 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingTag ? '创建中...' : '创建并添加'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 驳回弹窗 */}
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
                    驳回文章
                  </h2>
                  <p className={cn(
                    "text-xs mt-1",
                    isLight ? "text-gray-500" : "text-gray-400"
                  )}>
                    请填写驳回理由，帮助作者改进内容
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
                  驳回理由 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="请详细说明驳回原因，例如：内容不符合规范、标题需要修改等..."
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
                    setReviewNotes('');
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
                    if (!reviewNotes.trim()) {
                      return;
                    }
                    const ok = await triggerAction('reject', { rejectReason: reviewNotes.trim() });
                    if (ok) {
                      setShowRejectModal(false);
                      setReviewNotes('');
                    }
                  }}
                  disabled={!reviewNotes.trim() || isRejecting}
                  className={cn(
                    "px-6 py-2 rounded-lg text-sm font-medium transition-colors",
                    "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isRejecting ? '驳回中...' : '确认驳回'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图片裁剪弹窗 */}
      {showCropModal && imageToCrop && (
        <ImageCropModal
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onClose={() => setShowCropModal(false)}
          aspect={16 / 9}
        />
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

export default ArticleEditor;
