import { useEffect, useState, ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { CalendarCheck2, Clock, Upload, X } from 'lucide-react';
import { cn, withBasePath } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  adminService,
  ScheduleAdminResponse,
  ScheduleUpdatePayload,
} from '@/services/admin';

const sortSchedules = (list: ScheduleAdminResponse[]) =>
  [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

type FormState = {
  category: string;
  date: string;
  city: string;
  venue: string;
  theme: string;
  description: string;
};

const ScheduleManager = () => {
  const { theme } = useTheme();
  const { currentRole } = useAuth();
  const isLight = theme === 'white';
  const isSuperAdmin = currentRole === 'super_admin';

  const [schedules, setSchedules] = useState<ScheduleAdminResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleAdminResponse | null>(null);
  const [editForm, setEditForm] = useState<FormState>({
    category: '',
    date: '',
    city: '',
    venue: '',
    theme: '',
    description: '',
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<'update' | 'publish' | 'delete' | null>(null);

  const isBusy = activeAction !== null;
  const pendingSchedules = schedules.filter((item) => item.is_published !== 1);
  const publishedSchedules = schedules.filter((item) => item.is_published === 1);

  useEffect(() => {
    loadSchedules(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSchedule) {
      setEditForm({
        category: selectedSchedule.category,
        date: selectedSchedule.date,
        city: selectedSchedule.city,
        venue: selectedSchedule.venue || '',
        theme: selectedSchedule.theme,
        description: selectedSchedule.description || '',
      });
      resetImageSelection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchedule?.id]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (selectedSchedule) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    return undefined;
  }, [selectedSchedule]);

  useEffect(() => {
    return () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const loadSchedules = async (withSpinner = false) => {
    try {
      if (withSpinner) setLoading(true);
      setError(null);
      const data = await adminService.getSchedules({ limit: 100 });
      setSchedules(sortSchedules(data));
    } catch (err: any) {
      const message = err?.message || '加载行程数据失败';
      setError(message);
      console.error('Failed to load schedules:', err);
    } finally {
      if (withSpinner) setLoading(false);
    }
  };

  const resetImageSelection = () => {
    setSelectedImageFile(null);
    setSelectedImagePreview(null);
  };

  const handleEditChange = (field: keyof FormState, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    setSelectedImagePreview(URL.createObjectURL(file));
    event.target.value = '';
  };

  const updateSchedulesState = (updated: ScheduleAdminResponse) => {
    setSchedules((prev) => {
      const exists = prev.some((item) => item.id === updated.id);
      const next = exists
        ? prev.map((item) => (item.id === updated.id ? updated : item))
        : [...prev, updated];
      return sortSchedules(next);
    });
  };

  const removeScheduleFromState = (scheduleId: number) => {
    setSchedules((prev) => prev.filter((item) => item.id !== scheduleId));
  };

  const handleUpdate = async () => {
    if (!selectedSchedule) return;

    try {
      setActiveAction('update');
      const payload: ScheduleUpdatePayload = {
        category: editForm.category,
        date: editForm.date,
        city: editForm.city,
        venue: editForm.venue,
        theme: editForm.theme,
        description: editForm.description,
      };
      if (selectedImageFile) {
        payload.image = selectedImageFile;
      }

      const updated = await adminService.updateSchedule(selectedSchedule.id, payload);
      updateSchedulesState(updated);
      setSelectedSchedule(updated);
      resetImageSelection();
    } catch (err: any) {
      alert(err?.message || '更新行程失败');
    } finally {
      setActiveAction(null);
    }
  };

  const publishFlow = async (schedule: ScheduleAdminResponse) => {
    let current = schedule;
    if (current.review_status === 'pending') {
      current = await adminService.approveSchedule(current.id);
    }
    current = await adminService.publishSchedule(current.id);
    return current;
  };

  const handlePublish = async () => {
    if (!selectedSchedule) return;

    try {
      setActiveAction('publish');
      const updated = await publishFlow(selectedSchedule);
      updateSchedulesState(updated);
      setSelectedSchedule(updated);
    } catch (err: any) {
      alert(err?.message || '发布行程失败');
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedSchedule) return;
    if (selectedSchedule.is_published === 1 && !isSuperAdmin) {
      alert('只有超级管理员可以删除已发布的行程');
      return;
    }

    const confirmMessage =
      selectedSchedule.review_status === 'pending'
        ? '确定要删除该待审核行程吗？此操作不可撤销。'
        : '确定要删除该行程吗？此操作不可撤销。';
    if (!confirm(confirmMessage)) return;

    try {
      setActiveAction('delete');
      if (selectedSchedule.review_status === 'pending') {
        await adminService.rejectSchedule(selectedSchedule.id);
      } else {
        await adminService.deleteSchedule(selectedSchedule.id);
      }
      removeScheduleFromState(selectedSchedule.id);
      closeModal();
    } catch (err: any) {
      alert(err?.message || '删除行程失败');
    } finally {
      setActiveAction(null);
    }
  };

  const closeModal = () => {
    resetImageSelection();
    setSelectedSchedule(null);
    setActiveAction(null);
  };

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-wangfeng-purple/40 p-6 shadow-glow backdrop-blur-md',
          isLight ? 'bg-white/85 text-gray-800' : 'bg-black/55 text-gray-100'
        )}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-wangfeng-purple">加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-wangfeng-purple/40 p-6 shadow-glow backdrop-blur-md',
          isLight ? 'bg-white/85 text-gray-800' : 'bg-black/55 text-gray-100'
        )}
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => loadSchedules(true)}
            className="mt-4 rounded-lg bg-wangfeng-purple px-4 py-2 text-sm text-white hover:bg-wangfeng-purple/85"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  const renderModal = () => {
    if (!selectedSchedule || typeof document === 'undefined') return null;

    const isPublished = selectedSchedule.is_published === 1;
    const posterSrc = selectedImagePreview || (selectedSchedule.image ? withBasePath(selectedSchedule.image) : null);

    return createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
        onClick={closeModal}
      >
        <div
          className={cn(
            'relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-wangfeng-purple/40 p-8 shadow-glow',
            isLight ? 'bg-white text-gray-800' : 'bg-black/95 text-gray-100'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closeModal}
            className={cn(
              'absolute right-4 top-4 rounded-lg p-2 transition-colors',
              isLight ? 'text-gray-600 hover:bg-gray-200' : 'text-gray-400 hover:bg-white/10'
            )}
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bebas tracking-wider text-wangfeng-purple">行程详情</h2>
              <p className="mt-1 text-xs text-gray-500">
                最后更新：{new Date(selectedSchedule.updated_at).toLocaleString()}
              </p>
            </div>
            <span
              className={cn(
                'rounded-full px-4 py-1 text-xs font-semibold',
                isPublished ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              )}
            >
              {isPublished ? '已发布' : '待审核'}
            </span>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-wangfeng-purple/80">行程分类</span>
                <select
                  value={editForm.category}
                  onChange={(e) => handleEditChange('category', e.target.value)}
                  className={cn(
                    'rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wangfeng-purple',
                    isLight ? 'border-gray-300 bg-white' : 'border-wangfeng-purple/40 bg-black/60 text-white'
                  )}
                >
                  <option value="演唱会">演唱会</option>
                  <option value="音乐节">音乐节</option>
                  <option value="商演">商演</option>
                  <option value="综艺活动">综艺活动</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm text-wangfeng-purple/80">行程日期</span>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => handleEditChange('date', e.target.value)}
                  className={cn(
                    'rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wangfeng-purple',
                    isLight ? 'border-gray-300 bg-white' : 'border-wangfeng-purple/40 bg-black/60 text-white'
                  )}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm text-wangfeng-purple/80">所在城市</span>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => handleEditChange('city', e.target.value)}
                  className={cn(
                    'rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wangfeng-purple',
                    isLight ? 'border-gray-300 bg-white' : 'border-wangfeng-purple/40 bg-black/60 text-white'
                  )}
                  placeholder="例如：北京"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm text-wangfeng-purple/80">具体场馆 / 地点</span>
                <input
                  type="text"
                  value={editForm.venue}
                  onChange={(e) => handleEditChange('venue', e.target.value)}
                  className={cn(
                    'rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wangfeng-purple',
                    isLight ? 'border-gray-300 bg-white' : 'border-wangfeng-purple/40 bg-black/60 text-white'
                  )}
                  placeholder="例如：北京工人体育馆"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm text-wangfeng-purple/80">行程主题 / 详情</span>
              <input
                type="text"
                value={editForm.theme}
                onChange={(e) => handleEditChange('theme', e.target.value)}
                className={cn(
                  'rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wangfeng-purple',
                  isLight ? 'border-gray-300 bg-white' : 'border-wangfeng-purple/40 bg-black/60 text-white'
                )}
                placeholder='例如：汪峰"相信未来"巡回演唱会'
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm text-wangfeng-purple/80">补充说明</span>
              <textarea
                value={editForm.description}
                onChange={(e) => handleEditChange('description', e.target.value)}
                className={cn(
                  'min-h-[120px] rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wangfeng-purple',
                  isLight ? 'border-gray-300 bg-white' : 'border-wangfeng-purple/40 bg-black/60 text-white'
                )}
                placeholder="填写更多行程细节或注意事项"
              />
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm text-wangfeng-purple/80">行程海报</span>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm transition-colors',
                    isLight
                      ? 'border-wangfeng-purple/40 bg-white/70 text-wangfeng-purple hover:border-wangfeng-purple hover:bg-wangfeng-purple/10'
                      : 'border-wangfeng-purple/40 bg-black/60 text-wangfeng-light hover:border-wangfeng-purple hover:bg-wangfeng-purple/20'
                  )}
                >
                  <Upload className="h-4 w-4" />
                  重新上传行程海报
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                <div className="relative h-40 w-full overflow-hidden rounded-xl border border-wangfeng-purple/30 md:w-48">
                  {posterSrc ? (
                    <img src={posterSrc} alt="行程海报预览" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                      暂无海报
                    </div>
                  )}
                </div>
              </div>
              {selectedSchedule.image && !selectedImagePreview && (
                <p className="text-xs text-gray-500">当前海报：{selectedSchedule.image}</p>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-wangfeng-purple/20 pt-4 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full flex-col gap-3 md:flex-row">
                <button
                  onClick={handleUpdate}
                  disabled={isBusy}
                  className={cn(
                    'flex-1 rounded-lg bg-wangfeng-purple px-6 py-3 text-white transition-colors',
                    isBusy ? 'opacity-60' : 'hover:bg-wangfeng-purple/80'
                  )}
                >
                  {activeAction === 'update' ? '更新中…' : '更新行程'}
                </button>

                {!isPublished && (
                  <button
                    onClick={handlePublish}
                    disabled={isBusy}
                    className={cn(
                      'flex-1 rounded-lg border px-6 py-3 transition-colors',
                      isLight
                        ? 'border-wangfeng-purple/40 text-wangfeng-purple hover:bg-wangfeng-purple/10'
                        : 'border-wangfeng-purple/40 text-wangfeng-light hover:bg-wangfeng-purple/20',
                      isBusy && 'opacity-60'
                    )}
                  >
                    {activeAction === 'publish' ? '发布中…' : '发布行程'}
                  </button>
                )}

                {(!isPublished || isSuperAdmin) && (
                  <button
                    onClick={handleDelete}
                    disabled={isBusy || (isPublished && !isSuperAdmin)}
                    className={cn(
                      'flex-1 rounded-lg border px-6 py-3 transition-colors',
                      isLight
                        ? 'border-red-500 text-red-600 hover:bg-red-50'
                        : 'border-red-500/50 text-red-400 hover:bg-red-500/10',
                      (isBusy || (isPublished && !isSuperAdmin)) && 'opacity-50 cursor-not-allowed'
                    )}
                    title={isPublished && !isSuperAdmin ? '只有超级管理员可以删除已发布行程' : undefined}
                  >
                    {activeAction === 'delete'
                      ? '删除中…'
                      : isPublished
                      ? '删除行程'
                      : '驳回并删除'}
                  </button>
                )}
              </div>
              <button
                onClick={closeModal}
                className={cn(
                  'text-xs underline-offset-4 transition-colors',
                  isLight ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-gray-200'
                )}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div
        className={cn(
          'rounded-2xl border border-wangfeng-purple/40 p-6 shadow-glow backdrop-blur-md',
          isLight ? 'bg-white/85 text-gray-800' : 'bg-black/55 text-gray-100'
        )}
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-wangfeng-purple">行程管理</h2>
            <p className="text-xs text-gray-500">管理所有行程，支持编辑、发布、上下线以及删除</p>
          </div>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => loadSchedules(true)}
              className={cn(
                'rounded-xl border px-3 py-2 font-medium transition-colors',
                isLight
                  ? 'border-wangfeng-purple/20 text-gray-600 hover:bg-wangfeng-purple/10 hover:text-wangfeng-purple'
                  : 'border-wangfeng-purple/20 text-gray-300 hover:bg-wangfeng-purple/20 hover:text-wangfeng-light'
              )}
            >
              刷新列表
            </button>
          </div>
        </header>

        <div className="mt-6 space-y-10">
          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-wangfeng-purple">待审核行程</h3>
              <span className="text-xs text-gray-500">共 {pendingSchedules.length} 条</span>
            </div>
            {pendingSchedules.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-wangfeng-purple/40 p-8 text-center text-gray-500">
                目前没有新的待审核行程
              </div>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {pendingSchedules.map((schedule) => (
                  <button
                    key={schedule.id}
                    onClick={() => setSelectedSchedule(schedule)}
                    className={cn(
                      'flex flex-col gap-3 rounded-xl border border-wangfeng-purple/30 p-5 text-left transition-all hover:border-wangfeng-purple/60 hover:shadow-strong-glow',
                      isLight ? 'bg-white/75' : 'bg-black/50'
                    )}
                  >
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <CalendarCheck2 className="h-3.5 w-3.5 text-wangfeng-purple" />
                      </div>
                      <span className="rounded-full bg-amber-500/20 px-3 py-1 text-amber-300">待审核</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-wangfeng-purple">{schedule.city}</h3>
                      <p className="mt-1 text-sm text-gray-400 line-clamp-1">{schedule.theme}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{schedule.date}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-wangfeng-purple">已发布行程</h3>
              <span className="text-xs text-gray-500">共 {publishedSchedules.length} 条</span>
            </div>
            {publishedSchedules.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-wangfeng-purple/40 p-8 text-center text-gray-500">
                暂无已发布行程
              </div>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {publishedSchedules.map((schedule) => (
                  <button
                    key={schedule.id}
                    onClick={() => setSelectedSchedule(schedule)}
                    className={cn(
                      'flex flex-col gap-3 rounded-xl border border-wangfeng-purple/30 p-5 text-left transition-all hover:border-wangfeng-purple/60 hover:shadow-strong-glow',
                      isLight ? 'bg-white/75' : 'bg-black/50'
                    )}
                  >
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <CalendarCheck2 className="h-3.5 w-3.5 text-wangfeng-purple" />
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-300">已发布</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-wangfeng-purple">{schedule.city}</h3>
                      <p className="mt-1 text-sm text-gray-400 line-clamp-1">{schedule.theme}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{schedule.date}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {renderModal()}
    </>
  );
};

export default ScheduleManager;
