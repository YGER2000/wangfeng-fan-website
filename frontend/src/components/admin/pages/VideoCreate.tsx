import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  User,
  Tag,
  AlertCircle,
  Upload,
  ArrowLeft,
  Video,
  Sparkles,
  Loader2,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { videoAPI, VideoData, TagData } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import TagSelectionPanel from '@/components/admin/shared/TagSelectionPanel';
import InfoTooltip from '@/components/ui/InfoTooltip';
import SimpleToast, { ToastType } from '@/components/ui/SimpleToast';

// 视频分类枚举
const VIDEO_CATEGORIES = [
  { value: '演出现场', label: '演出现场' },
  { value: '单曲现场', label: '单曲现场' },
  { value: '综艺节目', label: '综艺节目' },
  { value: '歌曲mv', label: '歌曲mv' },
  { value: '访谈节目', label: '访谈节目' },
  { value: '纪录片', label: '纪录片' },
  { value: '其他', label: '其他' },
];

const VideoCreate = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'white';

  // 步骤管理
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

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

  // 标签数据
  const [selectedTags, setSelectedTags] = useState<TagData[]>([]);

  // 表单验证错误
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 状态管理
  const [submitting, setSubmitting] = useState(false);

  // Toast 提示
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // 自动解析相关状态
  const [bilibiliUrl, setBilibiliUrl] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState(false);

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

  // 当selectedDate改变时，更新表单中的publish_date字段
  useEffect(() => {
    const formattedDate = `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
    setFormData(prev => ({ ...prev, publish_date: formattedDate }));
  }, [selectedDate]);

  // 初始化时设置日期
  useEffect(() => {
    if (formData.publish_date) {
      const [year, month, day] = formData.publish_date.split('-').map(Number);
      setSelectedDate({ year, month, day });
    }
  }, []);

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

  // 生成标签上下文文本
  const tagContext = useMemo(
    () => [
      formData.title,
      formData.description,
      formData.author,
      formData.category
    ].filter(Boolean).join(' '),
    [formData.title, formData.description, formData.author, formData.category]
  );

  // 处理下一步
  const handleNextStep = () => {
    if (!validateForm()) return;
    setCurrentStep(2);
  };

  // 处理上一步
  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  // 表单输入处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 表单验证
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = '请输入视频标题';
    }

    if (!formData.bvid.trim()) {
      errors.bvid = '请输入B站视频ID';
    } else if (!/^BV[A-Za-z0-9]+$/.test(formData.bvid)) {
      errors.bvid = '请输入有效的B站视频ID（格式如：BV123456789）';
    }

    if (!formData.publish_date) {
      errors.publish_date = '请选择发布日期';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 提交表单
  // 提交视频（发送审核）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep !== 2) {
      setToast({ message: '请先完成基础信息填写', type: 'error' });
      return;
    }

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      // 准备视频数据，包含标签和审核状态
      const videoData = {
        ...formData,
        tags: selectedTags.map(tag => tag.display_name || tag.name || tag.value).filter(Boolean),
        review_status: 'pending',
        is_published: false
      };

      await videoAPI.create(videoData, token);
      setToast({ message: '✅ 视频已提交审核，等待管理员批准！', type: 'success' });

      // 3秒后跳转到视频列表
      setTimeout(() => {
        navigate('/admin/my-videos');
      }, 3000);
    } catch (err: any) {
      console.error('提交视频失败:', err);

      // 更好的错误处理
      let errorMessage = '提交视频失败';

      if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.detail) {
        // FastAPI validation errors
        if (Array.isArray(err.detail)) {
          errorMessage = err.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ');
        } else {
          errorMessage = err.detail;
        }
      }

      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // 暂存为草稿
  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep !== 2) {
      setToast({ message: '请先完成基础信息填写', type: 'error' });
      return;
    }

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      // 准备视频数据，包含标签和草稿状态
      const videoData = {
        ...formData,
        tags: selectedTags.map(tag => tag.display_name || tag.name || tag.value).filter(Boolean),
        review_status: 'draft',
        is_published: false
      };

      await videoAPI.create(videoData, token);
      setToast({ message: '✅ 视频已保存为草稿！', type: 'success' });

      // 1.5秒后跳转到视频列表
      setTimeout(() => {
        navigate('/admin/my-videos');
      }, 1500);
    } catch (err: any) {
      console.error('保存草稿失败:', err);

      // 更好的错误处理
      let errorMessage = '保存草稿失败';

      if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.detail) {
        // FastAPI validation errors
        if (Array.isArray(err.detail)) {
          errorMessage = err.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ');
        } else {
          errorMessage = err.detail;
        }
      }

      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // 从B站URL提取BV号
  const extractBVID = (url: string): string | null => {
    // 支持多种格式的B站链接
    const patterns = [
      /BV([A-Za-z0-9]+)/,  // 匹配 BV1xxx 格式
      /\/video\/(BV[A-Za-z0-9]+)/,  // 从完整URL中提取
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[0].startsWith('BV') ? match[0] : 'BV' + match[1];
      }
    }

    return null;
  };

  // 自动解析B站视频信息
  const handleParse = async () => {
    if (!bilibiliUrl.trim()) {
      setParseError('请输入B站视频链接');
      return;
    }

    setParsing(true);
    setParseError(null);
    setParseSuccess(false);

    try {
      // 提取BV号
      const bvid = extractBVID(bilibiliUrl);
      if (!bvid) {
        throw new Error('无法识别的B站链接格式，请检查链接是否正确');
      }

      console.log('提取的BV号:', bvid);

      // 调用后端API获取视频信息
      const response = await fetch(`http://localhost:1994/api/videos/parse-bilibili?bvid=${bvid}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || '解析失败');
      }

      const videoInfo = await response.json();
      console.log('解析结果:', videoInfo);

      // 填充表单数据
      setFormData(prev => ({
        ...prev,
        bvid: bvid,
        title: videoInfo.title || prev.title,
        description: videoInfo.description || prev.description,
        author: videoInfo.author || prev.author,
        cover_url: videoInfo.cover_url || prev.cover_url
      }));

      // 如果有发布日期，更新日期选择器
      if (videoInfo.publish_date) {
        try {
          const date = new Date(videoInfo.publish_date);
          if (!isNaN(date.getTime())) {
            setSelectedDate({
              year: date.getFullYear(),
              month: date.getMonth() + 1,
              day: date.getDate()
            });
          }
        } catch (e) {
          console.error('日期解析失败:', e);
        }
      }

      setParseSuccess(true);
      setTimeout(() => setParseSuccess(false), 3000);
    } catch (err: any) {
      console.error('解析失败:', err);
      setParseError(err.message || '解析失败，请检查链接是否正确');
    } finally {
      setParsing(false);
    }
  };

  // 获取B站视频链接
  const getBilibiliUrl = (bvid: string) => {
    return `https://www.bilibili.com/video/${bvid}`;
  };

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
              onClick={() => navigate('/admin/videos/list')}
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
              <Video className="h-5 w-5 text-wangfeng-purple" />
              发布视频
              <span className={cn(
                "text-sm font-normal ml-2",
                isLight ? "text-gray-500" : "text-gray-400"
              )}>
                步骤 {currentStep}/2
              </span>
            </h1>
          </div>

          {/* 操作按钮 */}
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
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isLight
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  )}
                >
                  上一步
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={submitting}
                  className={cn(
                    "px-4 py-2 rounded-lg border transition-colors text-sm font-medium flex items-center gap-2",
                    "border-gray-400 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800",
                    submitting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  暂存草稿
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-5 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  提交审核
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 - 使用flex-1和overflow-y-auto */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 步骤1: 基础信息 */}
            {currentStep === 1 && (
              <>
                {/* 自动解析区域 */}
                <div className={cn(
              "rounded-lg border p-6",
              isLight ? "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200" : "bg-gradient-to-br from-wangfeng-purple/10 to-blue-500/10 border-wangfeng-purple/30"
            )}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-wangfeng-purple" />
                <h2 className={cn(
                  "text-lg font-semibold",
                  isLight ? "text-gray-900" : "text-white"
                )}>
                  智能解析
                </h2>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  isLight ? "bg-purple-100 text-purple-700" : "bg-wangfeng-purple/20 text-wangfeng-purple"
                )}>
                  Beta
                </span>
                <InfoTooltip
                  content="粘贴B站视频链接，自动提取视频信息（标题、简介、作者、发布时间）。支持完整链接或短链接，解析后可以手动修改任何表单内容。如解析失败，请检查链接是否有效。"
                  isLight={isLight}
                  position="top"
                />
              </div>

              {parseError && (
                <div className={cn(
                  "rounded-lg border p-3 flex items-start gap-2 mb-4",
                  isLight
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                )}>
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{parseError}</span>
                </div>
              )}

              {parseSuccess && (
                <div className={cn(
                  "rounded-lg border p-3 flex items-start gap-2 mb-4",
                  isLight
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-green-500/10 border-green-500/30 text-green-300"
                )}>
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">解析成功！信息已自动填充到下方表单</span>
                </div>
              )}

              <div className="flex gap-3">
                <input
                  type="text"
                  value={bilibiliUrl}
                  onChange={(e) => setBilibiliUrl(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleParse();
                    }
                  }}
                  placeholder="粘贴B站视频链接，例如：https://www.bilibili.com/video/BV1wAc8e7ExV/"
                  className={cn(
                    "flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                    isLight
                      ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                      : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                  )}
                  disabled={parsing}
                />
                <button
                  type="button"
                  onClick={handleParse}
                  disabled={parsing || !bilibiliUrl.trim()}
                  className={cn(
                    "px-6 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2",
                    parsing || !bilibiliUrl.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90"
                  )}
                >
                  {parsing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      解析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      一键解析
                    </>
                  )}
                </button>
              </div>
            </div>

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
                      formErrors.title
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : isLight
                        ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                        : "bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                    )}
                    placeholder="请输入视频标题"
                  />
                  {formErrors.title && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.title}
                    </p>
                  )}
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
                      formErrors.bvid
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : isLight
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
                  {formErrors.bvid && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.bvid}
                    </p>
                  )}
                </div>

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
                  <div className="grid grid-cols-3 gap-3">
                    {/* 年份选择 */}
                    <select
                      value={selectedDate.year}
                      onChange={(e) => updateSelectedDate('year', parseInt(e.target.value))}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                        formErrors.publish_date
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : isLight
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
                        "rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                        formErrors.publish_date
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : isLight
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
                        "rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
                        formErrors.publish_date
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : isLight
                          ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                      )}
                    >
                      {days.map(day => (
                        <option key={day} value={day}>{day}日</option>
                      ))}
                    </select>
                  </div>
                  {formErrors.publish_date && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.publish_date}
                    </p>
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
              </div>
            </div>
              </>
            )}

            {/* 步骤2: 分类与标签 */}
            {currentStep === 2 && (
              <>
                {/* 分类区域 */}
                <div className={cn(
                  "rounded-lg border p-6",
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
                      <Tag className="inline h-4 w-4 mr-1.5 -mt-0.5" />
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
          </form>
        </div>
      </div>

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

export default VideoCreate;
