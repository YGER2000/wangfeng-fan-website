import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleAPI, ScheduleCategory, ScheduleItemResponse, tagAPI, TagData } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Upload, CheckCircle2, AlertCircle, X } from 'lucide-react';
import TagInputWithSearch from '@/components/ui/TagInputWithSearch';

const categoryOptions: ScheduleCategory[] = ['演唱会', 'livehouse', '音乐节', '商演拼盘', '综艺晚会', '直播', '商业活动', '其他'];

type PublishScheduleProps = {
  onReturn?: () => void;
  returnLabel?: string;
  onSuccess?: (created: ScheduleItemResponse) => void;
  successDelayMs?: number;
  submitLabel?: string;
  layoutVariant?: 'default' | 'admin';
};

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

const PublishSchedule = ({
  onReturn,
  returnLabel = '返回行程信息',
  onSuccess,
  successDelayMs = 1200,
  submitLabel = '确认发布',
  layoutVariant = 'default',
}: PublishScheduleProps) => {
  const navigate = useNavigate();
  const { user, currentRole, token } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [formState, setFormState] = useState<FormState>(defaultState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1, // 月份从1开始
    day: new Date().getDate()
  });

  const canPublish = useMemo(() => user && currentRole !== 'guest', [user, currentRole]);
  const handleReturn = () => {
    if (onReturn) {
      onReturn();
    } else {
      navigate('/tour-dates');
    }
  };

  // 生成年份选项（1971年到2071年）
  const years = Array.from({ length: 101 }, (_, i) => 1971 + i);
  
  // 生成月份选项
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // 根据年份和月份生成日期选项
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // 当年份或月份改变时，更新日期选项
  const days = Array.from({ length: getDaysInMonth(selectedDate.year, selectedDate.month) }, (_, i) => i + 1);

  // 当selectedDate改变时，更新表单中的date字段
  useEffect(() => {
    const formattedDate = `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
    setFormState(prev => ({ ...prev, date: formattedDate }));
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (!canPublish) {
    return (
      <div className={layoutVariant === 'admin' ? "" : "min-h-screen bg-transparent text-white py-20"}>
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-black/60 border border-wangfeng-purple/40 rounded-2xl p-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-wangfeng-purple/20 text-wangfeng-purple">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold mb-4">登录后才能发布行程</h1>
            <p className="text-wangfeng-purple/70 mb-8">
              请先登录账号，然后再试一次。
            </p>
            <button
              onClick={() => navigate('/tour-dates')}
              className="rounded-lg border border-wangfeng-purple px-6 py-2 text-wangfeng-purple hover:bg-wangfeng-purple/10 transition-colors"
            >
              返回行程信息页
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      // 如果选择的日期超出了该月的最大日期，则调整为该月最后一天
      const daysInMonth = getDaysInMonth(newDate.year, newDate.month);
      if (field !== 'day' && newDate.day > daysInMonth) {
        newDate.day = daysInMonth;
      }

      return newDate;
    });
  };

  // 标签处理函数
  const handleAddTag = (tag: TagData) => {
    // 检查是否已存在
    if (!formState.tags.some(t => t.id === tag.id)) {
      setFormState(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleRemoveTag = (tagId: number) => {
    setFormState(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.id !== tagId)
    }));
  };

  const handleSearchTags = async (query: string): Promise<TagData[]> => {
    try {
      return await tagAPI.search(query);
    } catch (error) {
      console.error('搜索标签失败:', error);
      return [];
    }
  };

  const handleCreateTag = async (name: string): Promise<TagData> => {
    try {
      return await tagAPI.create(name);
    } catch (error) {
      console.error('创建标签失败:', error);
      throw error;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
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

      const created = await scheduleAPI.create(payload, token);
      setSuccess('行程发布成功！');
      setFormState(defaultState);
      setSelectedDate({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate()
      });
      setImageFile(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }

      if (onSuccess) {
        onSuccess(created);
      } else {
        // 稍后跳转到行程信息页
        setTimeout(() => {
          navigate('/tour-dates', { replace: false, state: { highlightId: created.id } });
        }, successDelayMs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '行程发布失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryField = (
    <label className="flex flex-col gap-2">
      <span className={cn(
        "text-sm",
        isLight ? "text-gray-700" : "text-wangfeng-purple/80"
      )}>行程分类</span>
      <select
        value={formState.category}
        onChange={(event) => handleChange('category', event.target.value)}
        className={cn(
          "rounded-lg border px-4 py-3 focus:outline-none focus:ring-1",
          isLight
            ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple"
            : "bg-black/60 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple"
        )}
        required
      >
        {categoryOptions.map((option) => (
          <option key={option} value={option}>
            {option === 'livehouse' ? 'Livehouse' : option}
          </option>
        ))}
      </select>
    </label>
  );

  const dateField = (
    <div className="flex flex-col gap-2">
      <span className={cn(
        "text-sm",
        isLight ? "text-gray-700" : "text-wangfeng-purple/80"
      )}>行程日期</span>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={selectedDate.year}
          onChange={(e) => updateSelectedDate('year', parseInt(e.target.value))}
          className={cn(
            "rounded-lg border px-2 py-3 focus:outline-none focus:ring-1",
            isLight
              ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple"
              : "bg-black/60 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple"
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
            "rounded-lg border px-2 py-3 focus:outline-none focus:ring-1",
            isLight
              ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple"
              : "bg-black/60 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple"
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
            "rounded-lg border px-2 py-3 focus:outline-none focus:ring-1",
            isLight
              ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple"
              : "bg-black/60 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple"
          )}
        >
          {days.map(day => (
            <option key={day} value={day}>{day}日</option>
          ))}
        </select>
      </div>
    </div>
  );

  const cityField = (
    <label className="flex flex-col gap-2">
      <span className={cn(
        "text-sm",
        isLight ? "text-gray-700" : "text-wangfeng-purple/80"
      )}>所在城市</span>
      <input
        type="text"
        value={formState.city}
        onChange={(event) => handleChange('city', event.target.value)}
        className={cn(
          "rounded-lg border px-4 py-3 focus:outline-none focus:ring-1",
          isLight
            ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple"
            : "bg-black/60 border-wangfeng-purple/40 text-white placeholder:text-gray-500 focus:border-wangfeng-purple"
        )}
        placeholder="例如：北京"
        required
      />
    </label>
  );

  const venueField = (
    <label className="flex flex-col gap-2">
      <span className={cn(
        "text-sm",
        isLight ? "text-gray-700" : "text-wangfeng-purple/80"
      )}>具体场馆 / 地点</span>
      <input
        type="text"
        value={formState.venue}
        onChange={(event) => handleChange('venue', event.target.value)}
        className={cn(
          "rounded-lg border px-4 py-3 focus:outline-none focus:ring-1",
          isLight
            ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple"
            : "bg-black/60 border-wangfeng-purple/40 text-white placeholder:text-gray-500 focus:border-wangfeng-purple"
        )}
        placeholder="例如：北京工人体育馆"
      />
    </label>
  );

  const themeField = (
    <label className="flex flex-col gap-2">
      <span className={cn(
        "text-sm",
        isLight ? "text-gray-700" : "text-wangfeng-purple/80"
      )}>行程主题 / 详情</span>
      <input
        type="text"
        value={formState.theme}
        onChange={(event) => handleChange('theme', event.target.value)}
        className={cn(
          "rounded-lg border px-4 py-3 focus:outline-none focus:ring-1",
          isLight
            ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple"
            : "bg-black/60 border-wangfeng-purple/40 text-white placeholder:text-gray-500 focus:border-wangfeng-purple"
        )}
        placeholder="例如：汪峰“相信未来”巡回演唱会"
        required
      />
    </label>
  );

  const descriptionField = (
    <label className="flex flex-col gap-2">
      <span className={cn(
        "text-sm",
        isLight ? "text-gray-700" : "text-wangfeng-purple/80"
      )}>补充说明（选填）</span>
      <textarea
        value={formState.description}
        onChange={(event) => handleChange('description', event.target.value)}
        className={cn(
          "rounded-lg border px-4 py-3 focus:outline-none focus:ring-1 min-h-[120px]",
          isLight
            ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple"
            : "bg-black/60 border-wangfeng-purple/40 text-white placeholder:text-gray-500 focus:border-wangfeng-purple"
        )}
        placeholder="填写更多行程细节、嘉宾信息等"
      />
    </label>
  );

  const tagsField = (
    <TagInputWithSearch
      selectedTags={formState.tags}
      onAddTag={handleAddTag}
      onRemoveTag={handleRemoveTag}
      onSearchTags={handleSearchTags}
      onCreateTag={handleCreateTag}
      placeholder="搜索或创建标签..."
    />
  );

  const imageField = (
    <div className="flex flex-col h-full">
      <span className={cn(
        "text-sm mb-2",
        isLight ? "text-gray-700" : "text-wangfeng-purple/80"
      )}>上传行程海报（支持 JPG/PNG，选填）</span>
      {imagePreview ? (
        <div className="relative flex-1">
          <div className={cn(
            "absolute inset-0 overflow-hidden rounded-2xl border",
            isLight
              ? "border-gray-300 bg-gray-100"
              : "border-wangfeng-purple/60 bg-black/50"
          )}>
            <img
              src={imagePreview}
              alt="行程图片预览"
              className="h-full w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => handleFileChange(null)}
            className={cn(
              "absolute top-3 right-3 z-10 rounded-full border p-1 transition-colors",
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
          "flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 cursor-pointer transition-colors",
          isLight
            ? "border-gray-300 bg-gray-100 text-gray-600 hover:border-wangfeng-purple"
            : "border-wangfeng-purple/40 bg-black/50 text-wangfeng-purple/70 hover:border-wangfeng-purple"
        )}>
          <Upload className="h-8 w-8" />
          <div className="text-center text-sm">
            <p className="font-semibold">上传行程海报</p>
            <p className={cn(
              "text-xs",
              isLight ? "text-gray-500" : "text-wangfeng-purple/60"
            )}>建议比例 2:3，大小不超过 5MB</p>
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
  );

  return (
    <div className={cn(
      layoutVariant === 'admin' ? "bg-transparent" : "min-h-screen bg-transparent py-20",
      isLight ? "text-gray-900" : "text-white"
    )}>
      <div className={layoutVariant === 'admin' ? "container mx-auto px-4" : "container mx-auto px-4 max-w-5xl"}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-2 mb-6 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-wangfeng-purple via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            发布新的行程
          </h1>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={cn(
            "rounded-3xl space-y-8 border",
            layoutVariant === 'admin' ? "p-8" : "p-10",
            isLight
              ? "bg-gray-50 border-gray-200"
              : "bg-black/70 border-wangfeng-purple/40 shadow-glow"
          )}
        >
          {layoutVariant === 'admin' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:items-start">
              <div className="flex flex-col h-full min-h-[600px]">
                {imageField}
              </div>
              <div className="space-y-6">
                {themeField}
                {categoryField}
                {dateField}
                {cityField}
                {venueField}
                {descriptionField}
                {tagsField}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryField}
                {dateField}
                {cityField}
                {venueField}
              </div>
              {themeField}
              {descriptionField}
              {imageField}
            </>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/60 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-green-500/60 bg-green-500/10 p-4 text-sm text-green-300">
              <CheckCircle2 className="h-5 w-5" />
              {success}
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <button
              type="button"
              onClick={handleReturn}
              className={cn(
                "rounded-lg border px-6 py-3 transition-colors",
                isLight
                  ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  : "border-wangfeng-purple text-wangfeng-purple hover:bg-wangfeng-purple/10"
              )}
              disabled={submitting}
            >
              {returnLabel}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-wangfeng-purple px-6 py-3 text-white hover:bg-wangfeng-purple/80 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? '发布中...' : submitLabel}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default PublishSchedule;