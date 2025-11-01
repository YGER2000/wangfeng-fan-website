/**
 * 文章审核编辑页面 - 完全独立的审核界面
 * 仅用于审核员审核和编辑待发布的文章
 * 与 ArticleEdit.tsx 完全分离，有自己的表单和按钮逻辑
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RichTextEditor from '@/components/ui/RichTextEditor';
import {
  ArrowLeft,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { Article } from '@/utils/contentManager';
import { articleAPI, uploadAPI } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getSecondaryCategories, getPrimaryCategories } from '@/config/categories';
import { cn } from '@/lib/utils';
import SimpleToast, { ToastType } from '@/components/ui/SimpleToast';

const ArticleReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, currentRole } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'white';

  // 状态管理
  const [article, setArticle] = useState<Partial<Article> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // 分类状态
  const primaryCategories = getPrimaryCategories();
  const [categoryPrimary, setCategoryPrimary] = useState('峰言峰语');
  const [categorySecondary, setCategorySecondary] = useState('汪峰博客');
  const [availableSecondaries, setAvailableSecondaries] = useState<string[]>([]);

  // 权限检查
  useEffect(() => {
    if (currentRole !== 'admin' && currentRole !== 'super_admin') {
      navigate('/admin/dashboard');
    }
  }, [currentRole, navigate]);

  // 更新二级分类
  useEffect(() => {
    const secondaries = getSecondaryCategories(categoryPrimary);
    setAvailableSecondaries(secondaries);
    if (!secondaries.includes(categorySecondary)) {
      setCategorySecondary(secondaries[0] || '');
    }
  }, [categoryPrimary]);

  // 加载待审核的文章
  useEffect(() => {
    const loadArticle = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await articleAPI.getById(id);

        // 验证文章状态
        if (data.review_status !== 'pending') {
          setError('该文章不处于待审核状态，无法审核');
          setTimeout(() => navigate('/admin/review/articles'), 2000);
          return;
        }

        setArticle({
          id: data.id,
          title: data.title,
          content: data.content,
          author: data.author,
          date: data.published_at?.slice(0, 10),
          category: data.category,
          category_primary: data.category_primary,
          category_secondary: data.category_secondary,
          tags: data.tags || [],
          excerpt: data.excerpt,
          coverUrl: data.cover_url,
        });

        setCategoryPrimary(data.category_primary || '峰言峰语');
        setCategorySecondary(data.category_secondary || '汪峰博客');
      } catch (err) {
        console.error('加载文章失败:', err);
        setError('加载文章失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [id, navigate]);

  // 处理文章更新
  const handleUpdateArticle = async () => {
    if (!article || !id) return;

    try {
      setIsSaving(true);
      const updateData = {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        author: article.author,
        category: article.category,
        category_primary: categoryPrimary,
        category_secondary: categorySecondary,
        tags: article.tags || [],
        cover_url: article.coverUrl,
        published_at: article.date ? new Date(article.date).toISOString() : undefined,
        review_status: 'pending', // 保持待审核状态
        is_published: false,
      };

      await articleAPI.update(id, updateData, token);
      setToast({ message: '文章已保存', type: 'success' });
    } catch (err) {
      console.error('保存文章失败:', err);
      setToast({
        message: '保存失败: ' + (err instanceof Error ? err.message : '请重试'),
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 处理批准发布
  const handleApprove = async () => {
    if (!id) return;

    try {
      setIsApproving(true);

      // 先保存编辑的内容
      const updateData = {
        title: article?.title,
        content: article?.content,
        excerpt: article?.excerpt,
        author: article?.author,
        category: article?.category,
        category_primary: categoryPrimary,
        category_secondary: categorySecondary,
        tags: article?.tags || [],
        cover_url: article?.coverUrl,
        published_at: article?.date ? new Date(article.date).toISOString() : undefined,
      };

      await articleAPI.update(id, updateData, token);

      // 然后调用批准API
      const response = await fetch(`http://localhost:1994/api/v3/content/articles/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || '批准发布失败');
      }

      setToast({ message: '✅ 已批准发布！', type: 'success' });
      setTimeout(() => navigate('/admin/review/articles'), 1500);
    } catch (err) {
      console.error('批准失败:', err);
      setToast({
        message: '批准失败: ' + (err instanceof Error ? err.message : '请重试'),
        type: 'error',
      });
    } finally {
      setIsApproving(false);
    }
  };

  // 处理拒绝
  const handleReject = async () => {
    if (!id || !rejectReason.trim()) {
      setToast({ message: '请输入拒绝原因', type: 'error' });
      return;
    }

    try {
      setIsRejecting(true);

      const response = await fetch(`http://localhost:1994/api/v3/content/articles/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: rejectReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || '拒绝失败');
      }

      setToast({ message: '✅ 已拒绝！', type: 'success' });
      setTimeout(() => navigate('/admin/review/articles'), 1500);
    } catch (err) {
      console.error('拒绝失败:', err);
      setToast({
        message: '拒绝失败: ' + (err instanceof Error ? err.message : '请重试'),
        type: 'error',
      });
    } finally {
      setIsRejecting(false);
      setShowRejectModal(false);
    }
  };

  if (loading) {
    return (
      <div className={cn('h-full flex items-center justify-center', isLight ? 'bg-white' : 'bg-black/40')}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-wangfeng-purple border-t-transparent animate-spin mx-auto mb-4" />
          <p>加载文章中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('h-full flex items-center justify-center', isLight ? 'bg-white' : 'bg-black/40')}>
        <div className={cn('max-w-md p-8 rounded-lg border text-center', isLight ? 'bg-white border-red-200' : 'bg-black/40 border-red-500/30')}>
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className={cn('text-xl font-bold mb-2', isLight ? 'text-gray-900' : 'text-white')}>
            加载失败
          </h2>
          <p className={cn('text-sm mb-4', isLight ? 'text-gray-600' : 'text-gray-400')}>
            {error}
          </p>
          <button
            onClick={() => navigate('/admin/review/articles')}
            className="px-4 py-2 bg-wangfeng-purple text-white rounded-lg"
          >
            返回审核列表
          </button>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className={cn('h-full flex flex-col', isLight ? 'bg-gray-50' : 'bg-transparent')}>
      {/* 标题栏 */}
      <div className={cn('flex-shrink-0 border-b px-6 py-4', isLight ? 'bg-white border-gray-200' : 'bg-black/40 border-wangfeng-purple/20')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/review/articles')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                isLight ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:bg-wangfeng-purple/10 hover:text-wangfeng-purple'
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              返回审核中心
            </button>
          </div>
          <h1 className={cn('text-xl font-bold', isLight ? 'text-gray-900' : 'text-white')}>
            文章审核 - {article.title}
          </h1>
          <div className="w-40" /> {/* 占位符保持对称 */}
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* 文章标题 */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-900' : 'text-white')}>
              文章标题
            </label>
            <input
              type="text"
              value={article.title || ''}
              onChange={(e) => setArticle({ ...article, title: e.target.value })}
              className={cn(
                'w-full px-4 py-2 rounded-lg border',
                isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-black/30 border-wangfeng-purple/30 text-white'
              )}
            />
          </div>

          {/* 文章内容 */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-900' : 'text-white')}>
              文章内容
            </label>
            <RichTextEditor
              value={article.content || ''}
              onChange={(content) => setArticle({ ...article, content })}
            />
          </div>

          {/* 作者和日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-900' : 'text-white')}>
                作者
              </label>
              <input
                type="text"
                value={article.author || ''}
                onChange={(e) => setArticle({ ...article, author: e.target.value })}
                className={cn(
                  'w-full px-4 py-2 rounded-lg border',
                  isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-black/30 border-wangfeng-purple/30 text-white'
                )}
              />
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-900' : 'text-white')}>
                发布日期
              </label>
              <input
                type="date"
                value={article.date || ''}
                onChange={(e) => setArticle({ ...article, date: e.target.value })}
                className={cn(
                  'w-full px-4 py-2 rounded-lg border',
                  isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-black/30 border-wangfeng-purple/30 text-white'
                )}
              />
            </div>
          </div>

          {/* 分类 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-900' : 'text-white')}>
                一级分类
              </label>
              <select
                value={categoryPrimary}
                onChange={(e) => setCategoryPrimary(e.target.value)}
                className={cn(
                  'w-full px-4 py-2 rounded-lg border',
                  isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-black/30 border-wangfeng-purple/30 text-white'
                )}
              >
                {primaryCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-900' : 'text-white')}>
                二级分类
              </label>
              <select
                value={categorySecondary}
                onChange={(e) => setCategorySecondary(e.target.value)}
                className={cn(
                  'w-full px-4 py-2 rounded-lg border',
                  isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-black/30 border-wangfeng-purple/30 text-white'
                )}
              >
                {availableSecondaries.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 摘要 */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', isLight ? 'text-gray-900' : 'text-white')}>
              文章摘要
            </label>
            <textarea
              value={article.excerpt || ''}
              onChange={(e) => setArticle({ ...article, excerpt: e.target.value })}
              rows={3}
              className={cn(
                'w-full px-4 py-2 rounded-lg border',
                isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-black/30 border-wangfeng-purple/30 text-white'
              )}
            />
          </div>
        </div>
      </div>

      {/* 操作按钮栏 */}
      <div className={cn('flex-shrink-0 border-t px-6 py-4 flex items-center justify-end gap-3', isLight ? 'bg-white border-gray-200' : 'bg-black/40 border-wangfeng-purple/20')}>
        <button
          onClick={() => navigate('/admin/review/articles')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-white/10 text-gray-300 hover:bg-white/20'
          )}
        >
          取消
        </button>

        <button
          onClick={handleUpdateArticle}
          disabled={isSaving || isApproving || isRejecting}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
            isLight
              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
            (isSaving || isApproving || isRejecting) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          保存编辑
        </button>

        <button
          onClick={() => setShowRejectModal(true)}
          disabled={isApproving || isRejecting || isSaving}
          className={cn(
            'px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2',
            'border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white',
            (isApproving || isRejecting || isSaving) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <X className="h-4 w-4" />
          拒绝
        </button>

        <button
          onClick={handleApprove}
          disabled={isApproving || isRejecting || isSaving}
          className={cn(
            'px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
            'bg-green-600 text-white hover:bg-green-700',
            (isApproving || isRejecting || isSaving) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isApproving && <Loader2 className="h-4 w-4 animate-spin" />}
          <CheckCircle2 className="h-4 w-4" />
          {isApproving ? '审核中...' : '批准发布'}
        </button>
      </div>

      {/* 拒绝对话框 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={cn('rounded-lg p-6 w-96 shadow-lg', isLight ? 'bg-white' : 'bg-black/80')}>
            <h3 className={cn('text-lg font-bold mb-4', isLight ? 'text-gray-900' : 'text-white')}>
              拒绝理由
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入拒绝的原因..."
              rows={4}
              className={cn(
                'w-full px-4 py-2 rounded-lg border mb-4',
                isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-black/30 border-wangfeng-purple/30 text-white'
              )}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={isRejecting}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium',
                  isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                )}
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting || !rejectReason.trim()}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 flex items-center gap-2',
                  (isRejecting || !rejectReason.trim()) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isRejecting && <Loader2 className="h-4 w-4 animate-spin" />}
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && <SimpleToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ArticleReview;
