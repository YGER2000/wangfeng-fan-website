import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import {
  MessageSquare,
  Filter,
  CheckCircle,
  XCircle,
  Flag,
  Search,
  Calendar,
  ThumbsUp,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Comment {
  id: string;
  content: string;
  author: string;
  articleTitle: string;
  submitTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  likes: number;
  reports: number;
  ipAddress: string;
}

const CommentManagement: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const comments: Comment[] = [
    {
      id: '1',
      content: '这首歌太感人了！汪峰老师的歌声直击心灵，每次听都会热泪盈眶。支持汪峰！',
      author: '忠实粉丝01',
      articleTitle: '汪峰新专辑《生来流浪》全面解析',
      submitTime: '2024-01-15 14:30:25',
      status: 'approved',
      likes: 128,
      reports: 0,
      ipAddress: '192.168.1.100',
    },
    {
      id: '2',
      content: '垃圾音乐，根本不值得听！',
      author: '匿名用户',
      articleTitle: '2024巡演北京站精彩回顾',
      submitTime: '2024-01-15 13:20:10',
      status: 'flagged',
      likes: 2,
      reports: 15,
      ipAddress: '192.168.1.101',
    },
    {
      id: '3',
      content: '期待上海站的演出，已经买好票了！希望能听到《春天里》和《怒放的生命》。',
      author: '小王',
      articleTitle: '2024巡演北京站精彩回顾',
      submitTime: '2024-01-15 12:15:33',
      status: 'pending',
      likes: 45,
      reports: 0,
      ipAddress: '192.168.1.102',
    },
    {
      id: '4',
      content: '汪峰老师的音乐陪伴了我整个青春，从《鲍家街43号》到现在，一路支持！',
      author: '老粉丝',
      articleTitle: '汪峰二十年音乐历程回顾',
      submitTime: '2024-01-14 16:45:15',
      status: 'approved',
      likes: 256,
      reports: 0,
      ipAddress: '192.168.1.103',
    },
    {
      id: '5',
      content: '这篇文章写得不够深入，很多细节都没有提到。',
      author: '音乐评论家',
      articleTitle: '从《春天里》看汪峰的音乐创作',
      submitTime: '2024-01-14 15:30:42',
      status: 'rejected',
      likes: 5,
      reports: 2,
      ipAddress: '192.168.1.104',
    },
    {
      id: '6',
      content: '北京站的演出太震撼了！现场氛围无与伦比，感谢汪峰老师带来这么精彩的演出！',
      author: '现场观众',
      articleTitle: '2024巡演北京站精彩回顾',
      submitTime: '2024-01-14 14:20:18',
      status: 'approved',
      likes: 189,
      reports: 0,
      ipAddress: '192.168.1.105',
    },
  ];

  const statusOptions = [
    { value: 'all', label: '全部评论', color: 'gray' },
    { value: 'pending', label: '待审核', color: 'yellow' },
    { value: 'approved', label: '已通过', color: 'green' },
    { value: 'rejected', label: '已拒绝', color: 'red' },
    { value: 'flagged', label: '已举报', color: 'orange' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500">
            待审核
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">
            已通过
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-500">
            已拒绝
          </span>
        );
      case 'flagged':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-500 flex items-center gap-1">
            <Flag className="w-3 h-3" />
            已举报
          </span>
        );
      default:
        return null;
    }
  };

  const filteredComments = comments.filter((comment) => {
    const matchesStatus = selectedStatus === 'all' || comment.status === selectedStatus;
    const matchesSearch = comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         comment.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
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
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索评论内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-4 py-2 text-sm rounded-lg border transition-colors',
                    isLight
                      ? 'bg-white border-wangfeng-purple/20 focus:border-wangfeng-purple'
                      : 'bg-black/40 border-wangfeng-purple/40 text-white focus:border-wangfeng-purple'
                  )}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <Card
        className={cn(
          'border-wangfeng-purple/40',
          isLight ? 'bg-white/90' : 'bg-black/60'
        )}
      >
        <CardHeader>
          <CardTitle className="text-wangfeng-purple flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            评论管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredComments.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  isLight
                    ? 'border-wangfeng-purple/20 bg-white/50 hover:bg-white/80'
                    : 'border-wangfeng-purple/30 bg-black/30 hover:bg-black/50',
                  comment.status === 'flagged' && 'border-orange-500/50'
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn('font-medium text-sm', isLight ? 'text-gray-800' : 'text-gray-200')}>
                        {comment.author}
                      </span>
                      {getStatusBadge(comment.status)}
                      {comment.reports > 0 && (
                        <span className="text-xs text-orange-500 flex items-center gap-1">
                          <Flag className="w-3 h-3" />
                          {comment.reports} 次举报
                        </span>
                      )}
                    </div>
                    <p className={cn('text-sm mb-2', isLight ? 'text-gray-700' : 'text-gray-300')}>
                      {comment.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="px-2 py-0.5 rounded bg-wangfeng-purple/10 text-wangfeng-purple">
                        {comment.articleTitle}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{comment.submitTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{comment.likes} 点赞</span>
                      </div>
                      <span>IP: {comment.ipAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-wangfeng-purple/40 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    查看详情
                  </Button>
                  {comment.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        通过
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        拒绝
                      </Button>
                    </>
                  )}
                  {comment.status === 'flagged' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        忽略举报
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        删除评论
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommentManagement;
