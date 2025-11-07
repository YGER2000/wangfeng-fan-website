import { useState, useEffect, useMemo, FormEvent, MouseEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
  Tag as TagIcon,
  Upload,
  X,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { scheduleAPI, adminScheduleAPI, ScheduleCategory, ScheduleItemResponse, TagData } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import TagSelectionPanel from '@/components/admin/shared/TagSelectionPanel';
import SimpleToast, { ToastType } from '@/components/ui/SimpleToast';

interface ScheduleEditorProps {
  initialSchedule?: Partial<ScheduleItemResponse>;
  onSave?: (schedule: ScheduleItemResponse) => void;
  onDelete?: (scheduleId: string) => void;
}

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

interface FormState {
  category: ScheduleCategory;
  date: string;
  city: string;
  venue: string;
  theme: string;
  description: string;
  tags: TagData[];
}

const ScheduleEditor = ({ initialSchedule, onSave, onDelete }: ScheduleEditorProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as { backPath?: string } | null;
  const { token } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const backPath = navigationState?.backPath || '/admin/manage/schedules/list';
  const isEditMode = Boolean(initialSchedule?.id);

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  // 初始化表单数据
  const [formState, setFormState] = useState<FormState>({
    category: initialSchedule?.category || '演唱会',
    date: initialSchedule?.date || '',
    city: initialSchedule?.city || '',
    venue: initialSchedule?.venue || '',
    theme: initialSchedule?.theme || '',
    description: initialSchedule?.description || '',
    tags: Array.isArray(initialSchedule?.tags)
      ? (initialSchedule?.tags as (TagData | string)[]).map((tag, index) =>
          typeof tag === 'string'
            ? {
                id: index * -1,
                name: tag,
                display_name: tag,
                value: tag,
                category_id: 0,
              }
            : tag
        )
      : []
  });

  // 日期选择状态
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialSchedule?.date) {
      const [year, month, day] = initialSchedule.date.split('-').map(Number);
      return { year, month, day };
    }
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate()
    };
  });

  // 生成年份、月份、日期选项
  const years = Array.from({ length: 101 }, (_, i) => 1971 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const days = Array.from({ length: getDaysInMonth(selectedDate.year, selectedDate.month) }, (_, i) => i + 1);

  // 海报相关状态 - 支持多张海报
  const [posterFiles, setPosterFiles] = useState<File[]>([]);
  const [posterPreviews, setPosterPreviews] = useState<string[]>(
    initialSchedule?.images ? initialSchedule.images : []
  );
  const [coverIndex, setCoverIndex] = useState<number>(0);

  // UI状态
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // 清理预览图片
  useEffect(() => {
    return () => {
      posterPreviews.forEach(preview => {
        if (preview && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [posterPreviews]);

  // 同步selectedDate到formState.date
  useEffect(() => {
    const formattedDate = `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
    setFormState(prev => ({ ...prev, date: formattedDate }));
  }, [selectedDate]);

  // 在初始标签为空时同步来自 props 的标签（用于异步加载场景）
  useEffect(() => {
    if (Array.isArray(initialSchedule?.tags) && initialSchedule.tags.length) {
      setFormState(prev => {
        if (prev.tags.length > 0) {
          return prev;
        }

        const normalized = (initialSchedule.tags as (TagData | string)[]).map((tag, index) =>
          typeof tag === 'string'
            ? {
                id: index * -1,
                name: tag,
                display_name: tag,
                value: tag,
                category_id: 0,
              }
            : tag
        );

        return { ...prev, tags: normalized };
      });
    }
  }, [initialSchedule?.tags]);

  // 处理表单字段变化
  const handleChange = (field: keyof Omit<FormState, 'tags'>, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  // 更新日期
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

  // 处理海报上传 - 支持多张
  const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const newFiles = Array.from(files);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));

    setPosterFiles(prev => [...prev, ...newFiles]);
    setPosterPreviews(prev => [...prev, ...newPreviews]);
  };

  // 移除指定索引的海报
  const handleRemovePoster = (index: number) => {
    const preview = posterPreviews[index];
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }

    setPosterFiles(prev => prev.filter((_, i) => i !== index));
    setPosterPreviews(prev => prev.filter((_, i) => i !== index));

    // 如果删除的是封面，重置封面索引
    if (index === coverIndex) {
      setCoverIndex(0);
    } else if (index < coverIndex) {
      setCoverIndex(prev => prev - 1);
    }
  };

  // 设置封面海报
  const handleSetCover = (index: number) => {
    setCoverIndex(index);
  };

  // 处理标签变化
  const handleTagsChange = (tags: TagData[]) => {
    setFormState(prev => ({ ...prev, tags }));
  };

  // 表单验证
  const validateForm = (): string | null => {
    if (!formState.category) return '请选择分类';
    if (!formState.date) return '请选择日期';
    if (!formState.city.trim()) return '请输入城市';
    if (!formState.venue.trim()) return '请输入场馆';
    if (!formState.theme.trim()) return '请输入主题';
    return null;
  };

  const handleNextStep = () => {
    const validationError = validateForm();
    if (validationError) {
      setToast({ message: validationError, type: 'error' });
      return;
    }
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const tagContext = useMemo(
    () =>
      [
        formState.theme,
        formState.description,
        formState.city,
        formState.venue,
        formState.category
      ]
        .filter(Boolean)
        .join(' '),
    [formState.theme, formState.description, formState.city, formState.venue, formState.category]
  );

  // 处理提交
  const handleSubmit = async (e?: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();

    if (currentStep !== 2) {
      setToast({ message: '请先完成基本信息并点击下一步', type: 'error' });
      return;
    }
    const validationError = validateForm();
    if (validationError) {
      setToast({ message: validationError, type: 'error' });
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('category', formState.category);
      formData.append('date', formState.date);
      formData.append('city', formState.city.trim());
      formData.append('venue', formState.venue.trim());
      formData.append('theme', formState.theme.trim());
      if (formState.description.trim()) {
        formData.append('description', formState.description.trim());
      }
      if (formState.tags.length > 0) {
        const tagValues = formState.tags
          .map(tag => tag.name || tag.display_name || tag.value || (tag.id ? String(tag.id) : ''))
          .filter(Boolean);
        if (tagValues.length > 0) {
          formData.append('tags', tagValues.join(','));
        }
      }

      // 添加多张海报
      if (posterFiles.length > 0) {
        posterFiles.forEach((file) => {
          formData.append('images', file);
        });
      }

      // 添加封面索引
      if (posterPreviews.length > 0) {
        formData.append('cover_index', String(coverIndex));
      }

      if (isEditMode && initialSchedule?.id) {
        const updated = await adminScheduleAPI.update(initialSchedule.id, formData, token);
        setToast({ message: '行程已更新', type: 'success' });
        onSave?.(updated);
      } else {
        const created = await scheduleAPI.create(formData, token);
        setToast({ message: '行程已创建', type: 'success' });
        onSave?.(created);
      }

      setTimeout(() => {
        navigate(backPath);
      }, 1500);
    } catch (error: any) {
      console.error('保存失败:', error);
      setToast({
        message: error?.message || '保存失败，请稍后重试',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 处理删除
  const handleDelete = async () => {
    if (!initialSchedule?.id) return;

    if (!confirm('确定要删除这场行程吗？此操作不可撤销。')) {
      return;
    }

    try {
      await adminScheduleAPI.delete(initialSchedule.id);
      setToast({ message: '行程已删除', type: 'success' });
      setTimeout(() => {
        navigate(backPath);
      }, 1000);
    } catch (error: any) {
      console.error('删除失败:', error);
      setToast({ message: error?.message || '删除失败', type: 'error' });
    }
  };

  return (
    <div className={cn(
      'h-full flex flex-col',
      isLight ? 'bg-gray-50' : 'bg-transparent'
    )}>
      {/* 顶部栏 */}
      <div className={cn(
        'flex-shrink-0 border-b px-6 py-4',
        isLight ? 'bg-white border-gray-200' : 'bg-black/40 border-wangfeng-purple/20'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(backPath)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                isLight
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'text-gray-400 hover:bg-wangfeng-purple/10 hover:text-wangfeng-purple'
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </button>
            <div className="h-5 w-px bg-gray-300 dark:bg-gray-700" />
            <h1 className={cn(
              'text-xl font-bold flex items-center gap-2',
              isLight ? 'text-gray-900' : 'text-white'
            )}>
              <Calendar className="h-5 w-5 text-wangfeng-purple" />
              {isEditMode ? '编辑行程' : '创建行程'}
              <span className={cn(
                'text-sm font-normal ml-2',
                isLight ? 'text-gray-500' : 'text-gray-400'
              )}>
                步骤 {currentStep}/2
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
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
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isLight
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  )}
                >
                  上一步
                </button>
                {isEditMode && (
                  <button
                    onClick={handleDelete}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-2',
                      'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10'
                    )}
                  >
                    <X className="h-4 w-4" />
                    删除行程
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className={cn(
                    'px-5 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                  )}
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isEditMode ? '保存修改' : '提交行程'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 表单区域 */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
          {currentStep === 1 && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'p-6 rounded-lg border',
                  isLight ? 'bg-white border-gray-200' : 'bg-black/40 border-wangfeng-purple/20'
                )}
              >
                <h2 className={cn(
                  'text-lg font-semibold mb-6 flex items-center gap-2',
                  isLight ? 'text-gray-900' : 'text-white'
                )}>
                  <FileText className="w-5 h-5 text-wangfeng-purple" />
                  基本信息
                </h2>

                {/* 日期选择 */}
                <div className="mb-6">
                  <label className={cn(
                    'block text-sm font-medium mb-2 flex items-center gap-2',
                    isLight ? 'text-gray-700' : 'text-gray-300'
                  )}>
                    <Calendar className="w-4 h-4" />
                    日期 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedDate.year}
                      onChange={(e) => updateSelectedDate('year', Number(e.target.value))}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2',
                        isLight
                          ? 'bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                          : 'bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                      )}
                    >
                      {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <select
                      value={selectedDate.month}
                      onChange={(e) => updateSelectedDate('month', Number(e.target.value))}
                      className={cn(
                        'w-24 px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2',
                        isLight
                          ? 'bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                          : 'bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                      )}
                    >
                      {months.map(m => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>
                    <select
                      value={selectedDate.day}
                      onChange={(e) => updateSelectedDate('day', Number(e.target.value))}
                      className={cn(
                        'w-24 px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2',
                        isLight
                          ? 'bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                          : 'bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                      )}
                    >
                      {days.map(d => (
                        <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 城市和场馆 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2 flex items-center gap-2',
                      isLight ? 'text-gray-700' : 'text-gray-300'
                    )}>
                      <MapPin className="w-4 h-4" />
                      城市 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formState.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="例如: 北京"
                      className={cn(
                        'w-full px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2',
                        isLight
                          ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                          : 'bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                      )}
                    />
                  </div>
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2 flex items-center gap-2',
                      isLight ? 'text-gray-700' : 'text-gray-300'
                    )}>
                      <MapPin className="w-4 h-4" />
                      场馆 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formState.venue}
                      onChange={(e) => handleChange('venue', e.target.value)}
                      placeholder="例如: 工人体育馆"
                      className={cn(
                        'w-full px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2',
                        isLight
                          ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                          : 'bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                      )}
                    />
                  </div>
                </div>

                {/* 主题 */}
                <div className="mb-6">
                  <label className={cn(
                    'block text-sm font-medium mb-2 flex items-center gap-2',
                    isLight ? 'text-gray-700' : 'text-gray-300'
                  )}>
                    <FileText className="w-4 h-4" />
                    行程主题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formState.theme}
                    onChange={(e) => handleChange('theme', e.target.value)}
                    placeholder="例如: 汪峰相信未来巡回演唱会·北京站"
                    className={cn(
                      'w-full px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2',
                      isLight
                        ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                        : 'bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                    )}
                  />
                </div>

                {/* 描述 */}
                <div className="mb-6">
                  <label className={cn(
                    'block text-sm font-medium mb-2',
                    isLight ? 'text-gray-700' : 'text-gray-300'
                  )}>
                    行程描述
                  </label>
                  <textarea
                    value={formState.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="补充更多演出细节、嘉宾信息等（可选）"
                    rows={4}
                    className={cn(
                      'w-full px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 resize-none',
                      isLight
                        ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                        : 'bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                    )}
                  />
                </div>
              </motion.div>

              {/* 海报部分 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className={cn(
                  'p-6 rounded-lg border',
                  isLight ? 'bg-white border-gray-200' : 'bg-black/40 border-wangfeng-purple/20'
                )}
              >
                <h2 className={cn(
                  'text-lg font-semibold mb-6 flex items-center gap-2',
                  isLight ? 'text-gray-900' : 'text-white'
                )}>
                  <Upload className="w-5 h-5 text-wangfeng-purple" />
                  上传海报
                  <span className="text-xs font-normal text-gray-400">
                    （支持多张，点击图片设置封面）
                  </span>
                </h2>

                {/* 已上传的海报网格 */}
                {posterPreviews.length > 0 && (
                  <div className="mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {posterPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div
                            className={cn(
                              'relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all aspect-[3/4]',
                              coverIndex === index
                                ? 'border-wangfeng-purple shadow-lg'
                                : 'border-transparent hover:border-wangfeng-purple/50'
                            )}
                            onClick={() => handleSetCover(index)}
                          >
                            <img
                              src={preview}
                              alt={`海报 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />

                            {/* 封面标记 */}
                            {coverIndex === index && (
                              <div className="absolute top-2 left-2 px-2 py-1 bg-wangfeng-purple text-white text-xs rounded-full">
                                封面
                              </div>
                            )}
                          </div>

                          {/* 删除按钮 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePoster(index);
                            }}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 上传按钮 */}
                <label className={cn(
                  'block w-full p-8 rounded-lg border-2 border-dashed cursor-pointer transition-colors text-center',
                  isLight
                    ? 'border-gray-300 hover:border-wangfeng-purple/50 bg-gray-50 hover:bg-gray-100'
                    : 'border-wangfeng-purple/30 hover:border-wangfeng-purple bg-black/20 hover:bg-black/30'
                )}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePosterUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center">
                    <Upload className={cn(
                      'w-8 h-8 mb-2',
                      isLight ? 'text-gray-400' : 'text-gray-500'
                    )} />
                    <p className={cn(
                      'text-sm',
                      isLight ? 'text-gray-600' : 'text-gray-400'
                    )}>
                      点击上传海报 / 拖放到此处
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      支持多张，JPG/PNG/WebP，单张最大 10MB
                    </p>
                  </div>
                </label>

                <p className={cn(
                  'text-xs mt-4 flex items-start gap-2',
                  isLight ? 'text-gray-500' : 'text-gray-400'
                )}>
                  <AlertCircle className="w-4 h-4 mt-0.5 text-wangfeng-purple" />
                  支持上传多张海报，点击图片选择作为封面。未上传时将使用默认海报。
                </p>
              </motion.div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'p-6 rounded-lg border',
                  isLight ? 'bg-white border-gray-200' : 'bg-black/40 border-wangfeng-purple/20'
                )}
              >
                <h2 className={cn(
                  'text-lg font-semibold mb-4 pb-2 border-b',
                  isLight ? 'text-gray-900 border-gray-200' : 'text-white border-wangfeng-purple/20'
                )}>
                  行程分类
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-1">
                    <label className={cn(
                      'block text-sm font-medium mb-2 flex items-center gap-2',
                      isLight ? 'text-gray-700' : 'text-gray-300'
                    )}>
                      <TagIcon className="w-4 h-4" />
                      分类 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formState.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className={cn(
                        'w-full px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2',
                        isLight
                          ? 'bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                          : 'bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                      )}
                    >
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>
                          {cat === 'livehouse' ? 'Livehouse' : cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={cn(
                    'rounded-lg border p-4 md:col-span-1',
                    isLight ? 'bg-gray-50 border-gray-200' : 'bg-black/30 border-wangfeng-purple/20'
                  )}>
                    <p className={cn(
                      'text-sm font-medium mb-2',
                      isLight ? 'text-gray-700' : 'text-gray-200'
                    )}>
                      填写提示
                    </p>
                    <p className="text-xs text-gray-500 leading-5">
                      请确认时间、地点与海报信息准确无误，并尽量补充完整的标签与描述，方便粉丝检索。
                    </p>
                  </div>
                </div>
              </motion.div>

              <TagSelectionPanel
                contextText={tagContext}
                selectedTags={formState.tags}
                onChange={handleTagsChange}
                isLight={isLight}
                infoMessage="结合行程主题、城市、场馆等信息选择或创建标签，方便前台筛选。"
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className={cn(
                  'p-6 rounded-lg border',
                  isLight ? 'bg-white border-gray-200' : 'bg-black/40 border-wangfeng-purple/20'
                )}
              >
                <h2 className={cn(
                  'text-lg font-semibold mb-4',
                  isLight ? 'text-gray-900' : 'text-white'
                )}>
                  信息预览
                </h2>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="md:col-span-1">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-black/30 border border-dashed border-gray-300 dark:border-wangfeng-purple/20 flex items-center justify-center">
                      {posterPreviews.length > 0 ? (
                        <>
                          <img src={posterPreviews[coverIndex]} alt="行程海报预览" className="h-full object-cover w-full" />
                          <div className="absolute top-2 left-2 px-2 py-1 bg-wangfeng-purple text-white text-xs rounded-full">
                            {posterPreviews.length}张
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">未上传海报</span>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-3 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">行程主题</p>
                      <p className={cn('mt-1 font-semibold', isLight ? 'text-gray-900' : 'text-white')}>
                        {formState.theme || '—'}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">日期</p>
                        <p className={cn('mt-1', isLight ? 'text-gray-900' : 'text-gray-200')}>
                          {formState.date || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">城市 / 场馆</p>
                        <p className={cn('mt-1', isLight ? 'text-gray-900' : 'text-gray-200')}>
                          {formState.city || '—'} · {formState.venue || '—'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">分类</p>
                      <p className={cn('mt-1', isLight ? 'text-gray-900' : 'text-gray-200')}>
                        {formState.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">标签</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formState.tags.length ? (
                          formState.tags.map(tag => (
                            <span
                              key={tag.id || tag.value || tag.name}
                              className={cn(
                                'px-2 py-0.5 rounded-full text-xs',
                                isLight ? 'bg-wangfeng-purple/10 text-wangfeng-purple' : 'bg-wangfeng-purple/20 text-wangfeng-purple/80'
                              )}
                            >
                              {tag.display_name || tag.name || tag.value}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">未选择标签</span>
                        )}
                      </div>
                    </div>
                    {formState.description && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">描述</p>
                        <p className={cn('mt-1 leading-6 text-sm', isLight ? 'text-gray-800' : 'text-gray-300')}>
                          {formState.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </form>
      </div>

      {/* Toast */}
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

export default ScheduleEditor;
