import { FormEvent, useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { adminScheduleAPI, ScheduleCategory, ScheduleItemResponse, tagAPI, TagData } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  Calendar,
  MapPin,
  Tag as TagIcon,
  FileText,
  Loader2,
  ArrowRight,
  ThumbsUp,
  XCircle,
  Check,
  Loader,
  Trash2
} from 'lucide-react';
import TagSelectionPanel from '@/components/admin/shared/TagSelectionPanel';
import SimpleToast, { ToastType } from '@/components/ui/SimpleToast';

const categoryOptions: ScheduleCategory[] = [
  '演唱会',
  'livehouse',
  '音乐节',
  '商演拼盘',
  '综艺晚会',
  '直播',
  '商业活动',
  '其他'
];

type FormState = {
  category: ScheduleCategory;
  date: string;
  city: string;
  venue: string;
  theme: string;
  description: string;
  tags: TagData[];
};

const defaultState: FormState = {
  category: '演唱会',
  date: '',
  city: '',
  venue: '',
  theme: '',
  description: '',
  tags: [],
};

const ScheduleEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { token } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'white';

  // 检查是否从审核中心来的
  const fromReview = location.state?.fromReview;
  const backPath = fromReview ? '/admin/reviews' : '/admin/schedules/list';

  // 步骤管理
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<ScheduleItemResponse | null>(null);
  const [formState, setFormState] = useState<FormState>(defaultState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
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

  // 生成标签上下文文本
  const tagContext = useMemo(
    () => [
      formState.theme,
      formState.description,
      formState.city,
      formState.venue,
      formState.category
    ].filter(Boolean).join(' '),
    [formState.theme, formState.description, formState.city, formState.venue, formState.category]
  );

  // 加载行程数据
  useEffect(() => {
    if (!id) {
      setToast({ message: '缺少行程ID', type: 'error' });
      setLoading(false);
      return;
    }

    const loadSchedule = async () => {
      try {
        const scheduleData = await adminScheduleAPI.getById(parseInt(id));
        setSchedule(scheduleData);

        // 设置表单状态
        setFormState({
          category: scheduleData.category as ScheduleCategory,
          date: scheduleData.date,
          city: scheduleData.city,
          venue: scheduleData.venue || '',
          theme: scheduleData.theme,
          description: scheduleData.description || '',
          tags: scheduleData.tags || [],
        });

        // 设置日期选择器
        const dateObj = new Date(scheduleData.date);
        setSelectedDate({
          year: dateObj.getFullYear(),
          month: dateObj.getMonth() + 1,
          day: dateObj.getDate()
        });

        // 设置现有图片
        if (scheduleData.image_url) {
          setExistingImageUrl(scheduleData.image_url);
        }
      } catch (err) {
        console.error('加载行程失败:', err);
        setToast({ message: '加载行程数据失败，请稍后重试', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [id]);

  // 当selectedDate改变时，更新表单中的date字段
  useEffect(() => {
    const formattedDate = `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
    setFormState(prev => ({ ...prev, date: formattedDate }));
  }, [selectedDate]);

  // 清理预览图片
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (fileList: FileList | null) => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }

    if (!fileList || fileList.length === 0) {
      setImageFile(null);
      return;
    }

    const file = fileList[0];
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
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

  // 处理下一步
  const handleNextStep = () => {
    if (!formState.theme.trim()) {
      setToast({ message: '请输入行程主题', type: 'error' });
      return;
    }
    if (!formState.city.trim()) {
      setToast({ message: '请输入所在城市', type: 'error' });
      return;
    }
    setToast(null);
    setCurrentStep(2);
  };

  // 处理上一步
  const handlePrevStep = () => {
    setToast(null);
    setCurrentStep(1);
  };

  // 标签处理函数（通过 TagSelectionPanel）
  const handleTagsChange = (tags: TagData[]) => {
    setFormState(prev => ({
      ...prev,
      tags
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;

    if (currentStep !== 2) {
      setToast({ message: '请先完成标签选择', type: 'error' });
      return;
    }

    setToast(null);
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('category', formState.category);
      payload.append('date', formState.date);
      payload.append('city', formState.city);
      payload.append('venue', formState.venue);
      payload.append('theme', formState.theme);
      payload.append('description', formState.description);

      if (formState.tags.length > 0) {
        payload.append('tags', formState.tags.map(t => t.name).join(','));
      }

      if (imageFile) {
        payload.append('image', imageFile);
      }

      await adminScheduleAPI.update(parseInt(id), payload, token);
      setToast({ message: '行程更新成功！', type: 'success' });

      setTimeout(() => {
        navigate(backPath, {
          replace: false,
          state: { highlightId: parseInt(id) },
        });
      }, 1200);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : '行程更新失败，请稍后重试',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 审核通过
  const handleApprove = async () => {
    if (!id || !schedule) return;

    if (currentStep !== 2) {
      setToast({ message: '请先完成标签选择', type: 'error' });
      return;
    }

    setIsApproving(true);
    setToast(null);

    try {
      // 先保存修改
      const payload = new FormData();
      payload.append('category', formState.category);
      payload.append('date', formState.date);
      payload.append('city', formState.city);
      payload.append('venue', formState.venue);
      payload.append('theme', formState.theme);
      payload.append('description', formState.description);

      if (formState.tags.length > 0) {
        payload.append('tags', formState.tags.map(t => t.name).join(','));
      }

      if (imageFile) {
        payload.append('image', imageFile);
      }

      await adminScheduleAPI.update(parseInt(id), payload, token);

      // 再审核通过
      await adminScheduleAPI.approve(parseInt(id));

      setToast({ message: '审核通过成功！', type: 'success' });
      setTimeout(() => {
        navigate('/admin/reviews');
      }, 1500);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : '审核通过失败，请稍后重试',
        type: 'error'
      });
    } finally {
      setIsApproving(false);
    }
  };

  // 审核驳回
  const handleReject = async () => {
    if (!id || !schedule) return;

    if (!window.confirm('确定要驳回这个行程吗？')) {
      return;
    }

    setIsRejecting(true);
    setToast(null);

    try {
      await adminScheduleAPI.reject(parseInt(id));
      setToast({ message: '已驳回该行程', type: 'success' });
      setTimeout(() => {
        navigate('/admin/reviews');
      }, 1500);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : '驳回失败，请稍后重试',
        type: 'error'
      });
    } finally {
      setIsRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "h-full flex items-center justify-center",
        isLight ? "bg-gray-50" : "bg-transparent"
      )}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-wangfeng-purple" />
          <p className={cn(
            "text-sm",
            isLight ? "text-gray-600" : "text-gray-400"
          )}>
            加载行程数据...
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
              {fromReview ? '返回审核中心' : '返回列表'}
            </button>
            <div className="h-5 w-px bg-gray-300 dark:bg-gray-700" />
            <h1 className={cn(
              "text-xl font-bold flex items-center gap-2",
              isLight ? "text-gray-900" : "text-white"
            )}>
              <Calendar className="h-5 w-5 text-wangfeng-purple" />
              编辑行程
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
            {fromReview && schedule?.review_status === 'pending' && currentStep === 2 && (
              <>
                <button
                  onClick={handleReject}
                  disabled={isRejecting || isApproving || submitting}
                  className={cn(
                    "px-4 py-2 rounded-lg border transition-colors text-sm font-medium flex items-center gap-2",
                    "border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white",
                    (isRejecting || isApproving || submitting) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <XCircle className="h-4 w-4" />
                  {isRejecting ? '驳回中...' : '驳回'}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isApproving || isRejecting || submitting}
                  className={cn(
                    "px-6 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2",
                    "bg-green-600 text-white hover:bg-green-700",
                    (isApproving || isRejecting || submitting) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {(isApproving || submitting) && <Loader className="h-4 w-4 animate-spin" />}
                  <Check className="h-4 w-4" />
                  {isApproving ? '审核中...' : '审核通过'}
                </button>
              </>
            )}
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
                {!fromReview && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const form = document.querySelector('form') as HTMLFormElement;
                      if (form) form.requestSubmit();
                    }}
                    disabled={submitting || isApproving || isRejecting}
                    className="px-5 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '保存中...' : '保存更改'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <form onSubmit={handleSubmit}>
            {/* 步骤1: 基础信息 */}
            {currentStep === 1 && (
              <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧：图片上传区域 (占1/3) */}
              <div className={cn(
                "rounded-lg border p-6",
                isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
              )}>
                <h2 className={cn(
                  "text-lg font-semibold mb-4 pb-2 border-b",
                  isLight ? "text-gray-900 border-gray-200" : "text-white border-wangfeng-purple/20"
                )}>
                  行程海报
                </h2>

                <div className="flex flex-col h-[500px]">
                  <span className={cn(
                    "text-sm mb-3",
                    isLight ? "text-gray-600" : "text-gray-400"
                  )}>
                    上传行程海报（可选）
                  </span>

                  {imagePreview || existingImageUrl ? (
                    <div className="relative flex-1">
                      <div className={cn(
                        "absolute inset-0 overflow-hidden rounded-lg border",
                        isLight
                          ? "border-gray-300 bg-gray-100"
                          : "border-wangfeng-purple/30 bg-black/50"
                      )}>
                        <img
                          src={imagePreview || existingImageUrl || ''}
                          alt="行程图片预览"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleFileChange(null);
                          if (imagePreview) {
                            setExistingImageUrl(null);
                          }
                        }}
                        className={cn(
                          "absolute top-2 right-2 z-10 rounded-full border p-1.5 transition-colors",
                          isLight
                            ? "bg-white/90 border-gray-300 text-gray-700 hover:bg-gray-100"
                            : "bg-black/70 border-wangfeng-purple/60 text-wangfeng-purple hover:bg-wangfeng-purple/20"
                        )}
                        aria-label="移除行程海报"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className={cn(
                      "flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
                      isLight
                        ? "border-gray-300 bg-gray-50 hover:border-wangfeng-purple hover:bg-gray-100"
                        : "border-wangfeng-purple/30 bg-black/30 hover:border-wangfeng-purple hover:bg-black/50"
                    )}>
                      <Upload className={cn(
                        "h-12 w-12",
                        isLight ? "text-gray-400" : "text-wangfeng-purple/60"
                      )} />
                      <div className="text-center">
                        <p className={cn(
                          "text-sm font-medium",
                          isLight ? "text-gray-700" : "text-gray-300"
                        )}>
                          点击上传行程海报
                        </p>
                        <p className={cn(
                          "text-xs mt-1",
                          isLight ? "text-gray-500" : "text-gray-500"
                        )}>
                          支持 JPG、PNG 格式，建议比例 2:3
                        </p>
                        <p className={cn(
                          "text-xs",
                          isLight ? "text-gray-500" : "text-gray-500"
                        )}>
                          大小不超过 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handleFileChange(event.target.files)}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* 右侧：表单区域 (占2/3) */}
              <div className="lg:col-span-2 space-y-6">
                {/* 基础信息 */}
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
                    {/* 行程主题 */}
                    <div>
                      <label className={cn(
                        "block text-sm font-medium mb-2",
                        isLight ? "text-gray-700" : "text-gray-300"
                      )}>
                        <FileText className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                        行程主题 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formState.theme}
                        onChange={(event) => handleChange('theme', event.target.value)}
                        className={cn(
                          "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                          isLight
                            ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                            : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                        )}
                        placeholder='例如：汪峰"相信未来"巡回演唱会'
                        required
                      />
                    </div>

                    {/* 分类和城市 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={cn(
                          "block text-sm font-medium mb-2",
                          isLight ? "text-gray-700" : "text-gray-300"
                        )}>
                          <TagIcon className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                          行程分类 <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formState.category}
                          onChange={(event) => handleChange('category', event.target.value)}
                          className={cn(
                            "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                            isLight
                              ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                              : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          )}
                          required
                        >
                          {categoryOptions.map((option) => (
                            <option key={option} value={option}>
                              {option === 'livehouse' ? 'Livehouse' : option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={cn(
                          "block text-sm font-medium mb-2",
                          isLight ? "text-gray-700" : "text-gray-300"
                        )}>
                          <MapPin className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                          所在城市 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formState.city}
                          onChange={(event) => handleChange('city', event.target.value)}
                          className={cn(
                            "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                            isLight
                              ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                              : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          )}
                          placeholder="例如：北京"
                          required
                        />
                      </div>
                    </div>

                    {/* 场馆 */}
                    <div>
                      <label className={cn(
                        "block text-sm font-medium mb-2",
                        isLight ? "text-gray-700" : "text-gray-300"
                      )}>
                        具体场馆 / 地点
                      </label>
                      <input
                        type="text"
                        value={formState.venue}
                        onChange={(event) => handleChange('venue', event.target.value)}
                        className={cn(
                          "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                          isLight
                            ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                            : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                        )}
                        placeholder="例如：北京工人体育馆"
                      />
                    </div>
                  </div>
                </div>

                {/* 日期和详情 */}
                <div className={cn(
                  "rounded-lg border p-6",
                  isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
                )}>
                  <h2 className={cn(
                    "text-lg font-semibold mb-4 pb-2 border-b",
                    isLight ? "text-gray-900 border-gray-200" : "text-white border-wangfeng-purple/20"
                  )}>
                    日期与详情
                  </h2>

                  <div className="space-y-5">
                    {/* 行程日期 */}
                    <div>
                      <label className={cn(
                        "block text-sm font-medium mb-2",
                        isLight ? "text-gray-700" : "text-gray-300"
                      )}>
                        <Calendar className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                        行程日期 <span className="text-red-500">*</span>
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

                    {/* 补充说明 */}
                    <div>
                      <label className={cn(
                        "block text-sm font-medium mb-2",
                        isLight ? "text-gray-700" : "text-gray-300"
                      )}>
                        补充说明（可选）
                      </label>
                      <textarea
                        value={formState.description}
                        onChange={(event) => handleChange('description', event.target.value)}
                        rows={4}
                        className={cn(
                          "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 resize-none",
                          isLight
                            ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                            : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                        )}
                        placeholder="填写更多行程细节、嘉宾信息等"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
              </>
          )}

          {/* 步骤2: 标签管理 */}
          {currentStep === 2 && (
            <TagSelectionPanel
              contextText={tagContext}
              selectedTags={formState.tags}
              onChange={handleTagsChange}
              isLight={isLight}
              infoMessage="我们会根据行程主题、描述、分类等信息推荐相关标签，也可以搜索或直接创建新标签。"
            />
          )}
        </form>
        </div>
      </div>

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

export default ScheduleEdit;
