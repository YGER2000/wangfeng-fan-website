import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleAPI, ScheduleCategory } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';

const categoryOptions: ScheduleCategory[] = ['演唱会', '音乐节', '商演', '综艺活动', '其他'];

type FormState = {
  category: ScheduleCategory;
  date: string;
  city: string;
  venue: string;
  theme: string;
  description: string;
};

const defaultState: FormState = {
  category: '演唱会',
  date: '',
  city: '',
  venue: '',
  theme: '',
  description: '',
};

const PublishSchedule = () => {
  const navigate = useNavigate();
  const { user, currentRole, token } = useAuth();
  const [formState, setFormState] = useState<FormState>(defaultState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canPublish = useMemo(() => user && currentRole !== 'guest', [user, currentRole]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (!canPublish) {
    return (
      <div className="min-h-screen bg-transparent text-white py-20">
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

      if (imageFile) {
        payload.append('image', imageFile);
      }

      const created = await scheduleAPI.create(payload, token);
      setSuccess('行程发布成功！');
      setFormState(defaultState);
      setImageFile(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }

      // 稍后跳转到行程信息页
      setTimeout(() => {
        navigate('/tour-dates', { replace: false, state: { highlightId: created.id } });
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : '行程发布失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h1 className="text-5xl font-bebas tracking-wider text-wangfeng-purple mb-4">
            发布新的行程
          </h1>
          <p className="text-wangfeng-purple/70 max-w-2xl mx-auto">
            记录巡演、音乐节、综艺等重要时刻，行程将在审核后同步到行程信息页。
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-black/70 border border-wangfeng-purple/40 rounded-3xl p-8 space-y-8 shadow-glow"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-wangfeng-purple/80">行程分类</span>
              <select
                value={formState.category}
                onChange={(event) => handleChange('category', event.target.value)}
                className="rounded-lg border border-wangfeng-purple/40 bg-black/60 px-4 py-3 focus:border-wangfeng-purple focus:outline-none"
                required
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-wangfeng-purple/80">行程日期</span>
              <input
                type="date"
                value={formState.date}
                onChange={(event) => handleChange('date', event.target.value)}
                className="rounded-lg border border-wangfeng-purple/40 bg-black/60 px-4 py-3 focus:border-wangfeng-purple focus:outline-none"
                required
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-wangfeng-purple/80">所在城市</span>
              <input
                type="text"
                value={formState.city}
                onChange={(event) => handleChange('city', event.target.value)}
                className="rounded-lg border border-wangfeng-purple/40 bg-black/60 px-4 py-3 focus:border-wangfeng-purple focus:outline-none"
                placeholder="例如：北京"
                required
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-wangfeng-purple/80">具体场馆 / 地点</span>
              <input
                type="text"
                value={formState.venue}
                onChange={(event) => handleChange('venue', event.target.value)}
                className="rounded-lg border border-wangfeng-purple/40 bg-black/60 px-4 py-3 focus:border-wangfeng-purple focus:outline-none"
                placeholder="例如：北京工人体育馆"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-wangfeng-purple/80">行程主题 / 详情</span>
            <input
              type="text"
              value={formState.theme}
              onChange={(event) => handleChange('theme', event.target.value)}
              className="rounded-lg border border-wangfeng-purple/40 bg-black/60 px-4 py-3 focus:border-wangfeng-purple focus:outline-none"
              placeholder="例如：汪峰“相信未来”巡回演唱会"
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-wangfeng-purple/80">补充说明（选填）</span>
            <textarea
              value={formState.description}
              onChange={(event) => handleChange('description', event.target.value)}
              className="rounded-lg border border-wangfeng-purple/40 bg-black/60 px-4 py-3 focus:border-wangfeng-purple focus:outline-none min-h-[120px]"
              placeholder="填写更多行程细节、嘉宾信息等"
            />
          </label>

          <div>
            <span className="text-sm text-wangfeng-purple/80">上传行程海报（支持 JPG/PNG，选填）</span>
            <label className="mt-2 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-wangfeng-purple/40 bg-black/50 p-8 text-wangfeng-purple/70 cursor-pointer hover:border-wangfeng-purple transition-colors">
              <Upload className="h-8 w-8" />
              <div className="text-center text-sm">
                {imageFile ? (
                  <>
                    <p className="font-semibold text-white">{imageFile.name}</p>
                    <p className="text-xs text-wangfeng-purple/60">点击重新选择图片</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">上传行程海报</p>
                    <p className="text-xs text-wangfeng-purple/60">建议比例 2:3，大小不超过 5MB</p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFileChange(event.target.files)}
              />
            </label>
            {imagePreview && (
              <div className="mt-4 flex justify-center">
                <img
                  src={imagePreview}
                  alt="行程图片预览"
                  className="max-h-64 rounded-xl border border-wangfeng-purple/30 object-contain"
                />
              </div>
            )}
          </div>

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
              onClick={() => navigate('/tour-dates')}
              className="rounded-lg border border-wangfeng-purple px-6 py-3 text-wangfeng-purple hover:bg-wangfeng-purple/10 transition-colors"
              disabled={submitting}
            >
              返回行程信息
            </button>
            <button
              type="submit"
              className="rounded-lg bg-wangfeng-purple px-6 py-3 text-white hover:bg-wangfeng-purple/80 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? '发布中...' : '确认发布'}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default PublishSchedule;
