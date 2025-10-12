import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Play, 
  Calendar, 
  User, 
  Tag,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

// 设置axios默认配置
axios.defaults.baseURL = 'http://localhost:1994';

// 设置axios默认配置
axios.defaults.baseURL = 'http://localhost:1994';

// 视频数据接口
interface Video {
  id: string;
  title: string;
  description: string | null;
  author: string;
  category: string;
  bvid: string;
  publish_date: string;
  created_at: string;
  updated_at: string;
}

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

const VideoManagement = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '汪峰',
    category: '演出现场',
    bvid: '',
    publish_date: new Date().toISOString().split('T')[0],
  });
  
  // 表单验证错误
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 获取视频列表
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/videos/', {
        params: {
          category: selectedCategory === '全部' ? undefined : selectedCategory
        }
      });
      setVideos(response.data);
      setError(null);
    } catch (err) {
      console.error('获取视频列表失败:', err);
      setError('获取视频列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除视频
  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm('确定要删除这个视频吗？')) return;
    
    try {
      await axios.delete(`/api/videos/${id}/`);
      fetchVideos(); // 重新获取列表
    } catch (err) {
      console.error('删除视频失败:', err);
      alert('删除视频失败');
    }
  };

  // 表单输入处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除对应字段的错误
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
      errors.bvid = '请输入有效的B站视频ID';
    }
    
    if (!formData.publish_date) {
      errors.publish_date = '请选择发布日期';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await axios.post('/api/videos/', formData);
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        author: '汪峰',
        category: '演出现场',
        bvid: '',
        publish_date: new Date().toISOString().split('T')[0],
      });
      fetchVideos(); // 重新获取列表
    } catch (err: any) {
      console.error('创建视频失败:', err);
      if (err.response?.data?.detail) {
        alert(`创建视频失败: ${err.response.data.detail}`);
      } else {
        alert('创建视频失败');
      }
    }
  };

  // 获取B站视频链接
  const getBilibiliUrl = (bvid: string) => {
    return `https://www.bilibili.com/video/${bvid}`;
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  useEffect(() => {
    fetchVideos();
  }, [selectedCategory]);

  return (
    <div className="space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-wangfeng-purple">视频管理</h2>
          <p className="mt-1 text-sm text-gray-400">管理网站视频内容</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-wangfeng-purple px-4 py-2 text-sm font-medium text-white hover:bg-wangfeng-purple/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新增视频
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索视频标题..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-wangfeng-purple/30 bg-black/30 py-2 pl-10 pr-4 text-sm text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:outline-none focus:ring-1 focus:ring-wangfeng-purple"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-wangfeng-purple/30 bg-black/30 px-4 py-2 text-sm text-gray-200 focus:border-wangfeng-purple focus:outline-none focus:ring-1 focus:ring-wangfeng-purple"
        >
          <option value="全部">全部分类</option>
          {VIDEO_CATEGORIES.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* 创建视频表单模态框 */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-wangfeng-purple/40 bg-black/80 p-6 shadow-glow">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-wangfeng-purple">新增视频</h3>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">视频标题 *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={cn(
                    "w-full rounded-xl border bg-black/30 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1",
                    formErrors.title 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                      : "border-wangfeng-purple/30 focus:border-wangfeng-purple focus:ring-wangfeng-purple"
                  )}
                  placeholder="请输入视频标题"
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.title}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">B站视频ID *</label>
                <input
                  type="text"
                  name="bvid"
                  value={formData.bvid}
                  onChange={handleInputChange}
                  className={cn(
                    "w-full rounded-xl border bg-black/30 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1",
                    formErrors.bvid 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                      : "border-wangfeng-purple/30 focus:border-wangfeng-purple focus:ring-wangfeng-purple"
                  )}
                  placeholder="例如：BV123456789"
                />
                {formErrors.bvid && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.bvid}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">作者</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-wangfeng-purple/30 bg-black/30 py-2 pl-10 pr-3 text-sm text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:outline-none focus:ring-1 focus:ring-wangfeng-purple"
                      placeholder="作者"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">发布日期 *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      name="publish_date"
                      value={formData.publish_date}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full rounded-xl border bg-black/30 py-2 pl-10 pr-3 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1",
                        formErrors.publish_date 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                          : "border-wangfeng-purple/30 focus:border-wangfeng-purple focus:ring-wangfeng-purple"
                      )}
                    />
                  </div>
                  {formErrors.publish_date && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.publish_date}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">分类</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-wangfeng-purple/30 bg-black/30 py-2 pl-10 pr-3 text-sm text-gray-200 focus:border-wangfeng-purple focus:outline-none focus:ring-1 focus:ring-wangfeng-purple"
                  >
                    {VIDEO_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">描述</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-xl border border-wangfeng-purple/30 bg-black/30 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:outline-none focus:ring-1 focus:ring-wangfeng-purple"
                  placeholder="视频描述（可选）"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-xl border border-wangfeng-purple/30 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-wangfeng-purple/10 hover:text-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-wangfeng-purple px-4 py-2 text-sm font-medium text-white hover:bg-wangfeng-purple/90 transition-colors"
                >
                  创建视频
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 视频列表 */}
      <div className="rounded-2xl border border-wangfeng-purple/30 bg-black/30 backdrop-blur-md">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-wangfeng-purple border-t-transparent"></div>
            <p className="mt-2 text-gray-400">加载中...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
            <p className="mt-2 text-red-500">{error}</p>
            <button
              onClick={fetchVideos}
              className="mt-4 rounded-xl bg-wangfeng-purple px-4 py-2 text-sm font-medium text-white hover:bg-wangfeng-purple/90 transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : videos.length === 0 ? (
          <div className="p-8 text-center">
            <Play className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-300">暂无视频</h3>
            <p className="mt-1 text-sm text-gray-500">点击"新增视频"按钮添加第一个视频</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-wangfeng-purple/30 bg-black/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">视频信息</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">分类</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">发布日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wangfeng-purple/20">
                {videos
                  .filter(video => 
                    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((video) => (
                    <tr key={video.id} className="hover:bg-black/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-wangfeng-purple/20 flex items-center justify-center">
                            <Play className="h-5 w-5 text-wangfeng-purple" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-200">{video.title}</div>
                            <div className="text-sm text-gray-500">
                              {video.author} • {video.bvid}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-wangfeng-purple/20 px-2.5 py-0.5 text-xs font-medium text-wangfeng-purple">
                          {video.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {formatDate(video.publish_date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <a
                            href={getBilibiliUrl(video.bvid)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-wangfeng-purple hover:text-wangfeng-purple/80 transition-colors"
                          >
                            <Play className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="text-red-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoManagement;