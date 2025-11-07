import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { adminScheduleAPI, ScheduleItemResponse } from '@/utils/api';
import ScheduleEditor from './ScheduleEditor';
import SimpleToast from '@/components/ui/SimpleToast';

const ScheduleEdit = () => {
  const { id } = useParams<{ id: string }>();
  const [schedule, setSchedule] = useState<Partial<ScheduleItemResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('行程ID不存在');
      setLoading(false);
      return;
    }

    const loadSchedule = async () => {
      try {
        setLoading(true);
        const scheduleId = Number(id);
        if (Number.isNaN(scheduleId)) {
          throw new Error('无效的行程ID');
        }
        const data = await adminScheduleAPI.getById(scheduleId);
        setSchedule(data);
      } catch (err: any) {
        console.error('加载行程失败:', err);
        setError(err.message || '加载行程失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [id]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple"></div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-black">
        <SimpleToast message={error || '行程加载失败'} type="error" onClose={() => {}} />
      </div>
    );
  }

  return <ScheduleEditor initialSchedule={schedule} />;
};

export default ScheduleEdit;
