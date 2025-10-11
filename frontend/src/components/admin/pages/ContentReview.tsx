import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import {
  FileText,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Article {
  id: string;
  title: string;
  author: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  submitTime: string;
  reviewer?: string;
  reviewTime?: string;
  content: string;
}

const ContentReview: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const articles: Article[] = [
    {
      id: '1',
      title: '汪峰新专辑《生来流浪》全面解析',
      author: '张晓明',
      category: '音乐评论',
      status: 'pending',
      submitTime: '2024-01-15 10:30:25',
      content: '这张专辑展现了汪峰对生命的深刻思考...',
    },
    {
      id: '2',
      title: '2024巡演北京站精彩回顾',
      author: '李华',
      category: '演出报道',
      status: 'approved',
      submitTime: '2024-01-14 15:20:10',
      reviewer: '管理员A',
      reviewTime: '2024-01-14 16:30:00',
      content: '北京站演唱会现场气氛热烈，汪峰演唱了...',
    },
    {
      id: '3',
      title: '从《春天里》看汪峰的音乐创作',
      author: '王芳',
      category: '音乐评论',
      status: 'rejected',
      submitTime: '2024-01-13 09:15:33',
      reviewer: '管理员B',
      reviewTime: '2024-01-13 14:20:00',
      content: '《春天里》作为汪峰的代表作之一...',
    },
    {
      id: '4',
      title: '汪峰音乐节目表现点评',
      author: '赵敏',
      category: '综合资讯',
      status: 'pending',
      submitTime: '2024-01-12 14:45:15',
      content: '在最新一期音乐节目中，汪峰作为导师...',
    },
    {
      id: '5',
      title: '汪峰二十年音乐历程回顾',
      author: '陈刚',
      category: '人物专访',
      status: 'approved',
      submitTime: '2024-01-10 11:30:42',
      reviewer: '管理员A',
      reviewTime: '2024-01-10 13:15:00',
      content: '从鲍家街43号到个人发展，汪峰的音乐之路...',
    },
  ];

  const statusOptions = [
    { value: 'all', label: '全部状态', color: 'gray' },
    { value: 'pending', label: '待审核', color: 'yellow' },
    { value: 'approved', label: '已通过', color: 'green' },
    { value: 'rejected', label: '已拒绝', color: 'red' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            待审核
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            已通过
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-500 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            已拒绝
          </span>
        );
      default:
        return null;
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesStatus = selectedStatus === 'all' || article.status === selectedStatus;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.author.toLowerCase().includes(searchQuery.toLowerCase());
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
                  placeholder="搜索标题或作者..."
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

      {/* Articles List */}
      <Card
        className={cn(
          'border-wangfeng-purple/40',
          isLight ? 'bg-white/90' : 'bg-black/60'
        )}
      >
        <CardHeader>
          <CardTitle className="text-wangfeng-purple flex items-center gap-2">
            <FileText className="w-5 h-5" />
            内容审核列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  isLight
                    ? 'border-wangfeng-purple/20 bg-white/50 hover:bg-white/80'
                    : 'border-wangfeng-purple/30 bg-black/30 hover:bg-black/50'
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className={cn('font-medium mb-2', isLight ? 'text-gray-800' : 'text-gray-200')}>
                      {article.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>作者: {article.author}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded bg-wangfeng-purple/10 text-wangfeng-purple">
                        {article.category}
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{article.submitTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(article.status)}
                  </div>
                </div>
                
                <p className={cn('text-sm mb-3 line-clamp-2', isLight ? 'text-gray-600' : 'text-gray-400')}>
                  {article.content}
                </p>

                {article.reviewer && (
                  <div className="text-xs text-gray-500 mb-3">
                    审核人: {article.reviewer} | 审核时间: {article.reviewTime}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-wangfeng-purple/40 text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    查看详情
                  </Button>
                  {article.status === 'pending' && (
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentReview;
