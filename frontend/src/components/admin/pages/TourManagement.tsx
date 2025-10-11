import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Calendar,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Users,
  Ticket,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Tour {
  id: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  capacity: number;
  ticketsSold: number;
  ticketPrice: string;
  description: string;
}

const TourManagement: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const tours: Tour[] = [
    {
      id: '1',
      title: '2024"生来流浪"巡回演唱会',
      venue: '国家体育场（鸟巢）',
      city: '北京',
      date: '2024-05-20',
      time: '19:30',
      status: 'upcoming',
      capacity: 80000,
      ticketsSold: 45000,
      ticketPrice: '¥380-1280',
      description: '全新专辑《生来流浪》首场巡演',
    },
    {
      id: '2',
      title: '2024"生来流浪"巡回演唱会',
      venue: '梅赛德斯奔驰中心',
      city: '上海',
      date: '2024-06-15',
      time: '19:30',
      status: 'upcoming',
      capacity: 18000,
      ticketsSold: 12000,
      ticketPrice: '¥480-1580',
      description: '上海站特别演出',
    },
    {
      id: '3',
      title: '2024跨年演唱会',
      venue: '深圳湾体育中心',
      city: '深圳',
      date: '2023-12-31',
      time: '20:00',
      status: 'completed',
      capacity: 32000,
      ticketsSold: 32000,
      ticketPrice: '¥580-1880',
      description: '跨年特别场次',
    },
    {
      id: '4',
      title: '2024"生来流浪"巡回演唱会',
      venue: '奥体中心体育场',
      city: '广州',
      date: '2024-07-08',
      time: '19:30',
      status: 'upcoming',
      capacity: 60000,
      ticketsSold: 28000,
      ticketPrice: '¥380-1380',
      description: '华南地区巡演',
    },
    {
      id: '5',
      title: '春季音乐节特别演出',
      venue: '西湖音乐喷泉',
      city: '杭州',
      date: '2024-04-15',
      time: '18:00',
      status: 'cancelled',
      capacity: 5000,
      ticketsSold: 0,
      ticketPrice: '¥280-680',
      description: '因天气原因取消',
    },
  ];

  const statusOptions = [
    { value: 'all', label: '全部', color: 'gray' },
    { value: 'upcoming', label: '即将开始', color: 'blue' },
    { value: 'ongoing', label: '进行中', color: 'green' },
    { value: 'completed', label: '已完成', color: 'gray' },
    { value: 'cancelled', label: '已取消', color: 'red' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-500">
            即将开始
          </span>
        );
      case 'ongoing':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">
            进行中
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-500">
            已完成
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-500">
            已取消
          </span>
        );
      default:
        return null;
    }
  };

  const filteredTours = selectedStatus === 'all' 
    ? tours 
    : tours.filter((tour) => tour.status === selectedStatus);

  const getTicketProgress = (sold: number, capacity: number) => {
    const percentage = (sold / capacity) * 100;
    return percentage;
  };

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card
        className={cn(
          'border-wangfeng-purple/40',
          isLight ? 'bg-white/90' : 'bg-black/60'
        )}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                    selectedStatus === option.value
                      ? 'bg-wangfeng-purple text-white shadow-glow'
                      : isLight
                      ? 'bg-white/70 text-gray-700 border border-wangfeng-purple/20 hover:border-wangfeng-purple'
                      : 'bg-black/40 text-gray-300 border border-wangfeng-purple/40 hover:border-wangfeng-purple'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              className="bg-wangfeng-purple hover:bg-wangfeng-purple/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加演出
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tours List */}
      <Card
        className={cn(
          'border-wangfeng-purple/40',
          isLight ? 'bg-white/90' : 'bg-black/60'
        )}
      >
        <CardHeader>
          <CardTitle className="text-wangfeng-purple flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            演出日程管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTours.map((tour) => (
              <div
                key={tour.id}
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  isLight
                    ? 'border-wangfeng-purple/20 bg-white/50 hover:bg-white/80'
                    : 'border-wangfeng-purple/30 bg-black/30 hover:bg-black/50'
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={cn('font-medium', isLight ? 'text-gray-800' : 'text-gray-200')}>
                        {tour.title}
                      </h3>
                      {getStatusBadge(tour.status)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{tour.city} - {tour.venue}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{tour.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{tour.time}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Ticket className="w-4 h-4" />
                          <span>{tour.ticketPrice}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>已售 {tour.ticketsSold.toLocaleString()} / {tour.capacity.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Progress */}
                {tour.status !== 'cancelled' && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>票务进度</span>
                      <span>{getTicketProgress(tour.ticketsSold, tour.capacity).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-wangfeng-purple transition-all"
                        style={{ width: `${getTicketProgress(tour.ticketsSold, tour.capacity)}%` }}
                      />
                    </div>
                  </div>
                )}

                <p className={cn('text-sm mb-3', isLight ? 'text-gray-600' : 'text-gray-400')}>
                  {tour.description}
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-wangfeng-purple/40 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    查看
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-wangfeng-purple/40 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TourManagement;
