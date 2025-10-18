import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RichTextEditor from './RichTextEditor';
import ImageCropModal from './ImageCropModal';
import {
  AlertCircle,
  CheckCircle2,
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
  Upload
} from 'lucide-react';
import { Article } from '@/utils/contentManager';
import { getSecondaryCategories } from '@/config/categories';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAvailableCategories } from '@/utils/permissions';
import { cn } from '@/lib/utils';

interface ArticleEditorProps {
  initialArticle?: Partial<Article>;
  onSave?: (article: Article, coverImage?: File) => void;
  onPreview?: (article: Article) => void;
  onDelete?: (articleId: string) => void;
}

const ArticleEditor = ({ initialArticle, onSave, onPreview, onDelete }: ArticleEditorProps) => {
  const navigate = useNavigate();
  const { currentRole, user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'white';

  // 步骤管理：1=编辑内容, 2=设置元数据和封面
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

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

  const handleAddTag = () => {
    if (tagInput.trim() && !article.tags?.includes(tagInput.trim())) {
      setArticle(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
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

  // 进入下一步
  const handleNextStep = () => {
    if (!article.title || !article.content) {
      setSaveError('请填写标题和内容');
      return;
    }
    setSaveError(null);
    setCurrentStep(2);
  };

  // 返回上一步
  const handlePrevStep = () => {
    setCurrentStep(1);
    setSaveError(null);
  };

  // 发布文章
  const handlePublish = async () => {
    if (!article.title || !article.content) {
      setSaveError('请填写标题和内容');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const fullArticle: Article = {
        id: initialArticle?.id || Date.now().toString(),
        slug: article.title?.toLowerCase().replace(/\s+/g, '-') || '',
        title: article.title || '',
        content: article.content || '',
        author: article.author || '汪峰',
        date: article.date || new Date().toISOString().split('T')[0],
        category: article.category || '个人感悟',
        category_primary: categoryPrimary,
        category_secondary: categorySecondary,
        tags: article.tags || [],
        excerpt: article.excerpt || article.content?.substring(0, 150) + '...' || '',
      };

      if (onSave) {
        await onSave(fullArticle, coverImageFile || undefined);
      }

      // 根据用户角色显示不同的成功消息
      const isAdmin = currentRole === 'admin' || currentRole === 'super_admin';
      const successMessage = isAdmin
        ? '发布成功！'
        : '发布成功，待管理员审核。';

      setSaveSuccess(true);
      setSaveError(null);

      // 显示成功消息后跳转
      setTimeout(() => {
        navigate('/admin/articles/list');
      }, 2000);

      // 暂时显示提示
      alert(successMessage);
    } catch (error) {
      console.error('保存失败:', error);
      setSaveError('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 权限检查
  if (availablePrimaryCategories.length === 0) {
    return (
      <div className={cn(
        "h-full flex items-center justify-center",
        isLight ? "bg-gray-50" : "bg-black"
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
      isLight ? "bg-gray-50" : "bg-black"
    )}>
      {/* 顶部标题栏 */}
      <div className={cn(
        "flex-shrink-0 border-b px-6 py-4",
        isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/articles/list')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                isLight
                  ? "text-gray-600 hover:bg-gray-100"
                  : "text-gray-400 hover:bg-wangfeng-purple/10 hover:text-wangfeng-purple"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </button>
            <div className="h-5 w-px bg-gray-300 dark:bg-gray-700" />
            <h1 className={cn(
              "text-xl font-bold flex items-center gap-2",
              isLight ? "text-gray-900" : "text-white"
            )}>
              <FileText className="h-5 w-5 text-wangfeng-purple" />
              {initialArticle?.id ? '编辑文章' : '发布文章'}
              <span className={cn("text-sm font-normal ml-2", isLight ? "text-gray-500" : "text-gray-400")}>
                步骤 {currentStep}/2
              </span>
            </h1>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            {currentStep === 2 && onDelete && initialArticle?.id && (
              <button
                onClick={() => onDelete(initialArticle.id as string)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isLight
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                )}
              >
                删除文章
              </button>
            )}

            {currentStep === 1 ? (
              <button
                onClick={handleNextStep}
                className="px-5 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors flex items-center gap-2"
              >
                下一步
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
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
                  onClick={handlePublish}
                  disabled={isSaving}
                  className="px-5 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? '发布中...' : '发布文章'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 - 允许滚动 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* 保存成功消息 */}
          {saveSuccess && (
            <div className={cn(
              "rounded-lg border p-4 flex items-start gap-3 mb-6",
              isLight
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-green-500/10 border-green-500/30 text-green-300"
            )}>
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">
                {currentRole === 'admin' || currentRole === 'super_admin'
                  ? '发布成功！'
                  : '发布成功，待管理员审核。'}
              </span>
            </div>
          )}

          {/* 保存错误消息 */}
          {saveError && (
            <div className={cn(
              "rounded-lg border p-4 flex items-start gap-3 mb-6",
              isLight
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            )}>
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{saveError}</span>
            </div>
          )}

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

                <div className="rich-text-editor-container">
                  <RichTextEditor
                    value={article.content || ''}
                    onChange={handleContentChange}
                    height={undefined as any}
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

                  {/* 分类 */}
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

                  {/* 标签 */}
                  <div>
                    <label className={cn(
                      "block text-sm font-medium mb-2",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      <TagIcon className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                      标签（可选）
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className={cn(
                          "flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                          isLight
                            ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                            : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                        )}
                        placeholder="添加标签（按 Enter 确认）"
                      />
                      <button
                        onClick={handleAddTag}
                        className="px-4 py-2.5 bg-wangfeng-purple text-white rounded-lg text-sm hover:bg-wangfeng-purple/90 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {article.tags?.map((tag, index) => (
                        <span
                          key={index}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                            isLight
                              ? "bg-wangfeng-purple/10 text-wangfeng-purple"
                              : "bg-wangfeng-purple/20 text-wangfeng-purple"
                          )}
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 图片裁剪弹窗 */}
      {showCropModal && imageToCrop && (
        <ImageCropModal
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onClose={() => setShowCropModal(false)}
          aspect={16 / 9}
        />
      )}
    </div>
  );
};

export default ArticleEditor;
