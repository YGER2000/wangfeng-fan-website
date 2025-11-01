// -*- coding: utf-8 -*-
/**
 * 审核面板 - 管理员审核待发布内容
 * 路由: /admin/review-panel
 * 权限: ADMIN+ only
 */

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { contentWorkflowAPI, Article } from '@/services/content-workflow-api';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ReviewItem extends Article {
  isLoading?: boolean;
  error?: string;
}

const ReviewPanel = () => {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // 加载待审核列表
  const loadPendingItems = async () => {
    if (!token) {
      setError('未登录或token过期');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await contentWorkflowAPI.getPendingArticles(0, 50, undefined, token);
      setItems(data);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingItems();
  }, [token]);

  // 批准
  const handleApprove = async (item: ReviewItem) => {
    if (!token) return;

    try {
      const updatedItem = { ...item, isLoading: true };
      setItems(items.map(i => i.id === item.id ? updatedItem : i));

      await contentWorkflowAPI.approveArticle(item.id, token);

      // 从列表中移除
      setItems(items.filter(i => i.id !== item.id));
      setSelectedItem(null);
    } catch (err: any) {
      const updatedItem = { ...item, isLoading: false, error: err.message };
      setItems(items.map(i => i.id === item.id ? updatedItem : i));
    }
  };

  // 拒绝
  const handleReject = async (item: ReviewItem) => {
    if (!token || !rejectReason.trim()) {
      setError('请输入拒绝原因');
      return;
    }

    try {
      const updatedItem = { ...item, isLoading: true };
      setItems(items.map(i => i.id === item.id ? updatedItem : i));

      await contentWorkflowAPI.rejectArticle(item.id, rejectReason, token);

      // 从列表中移除
      setItems(items.filter(i => i.id !== item.id));
      setSelectedItem(null);
      setRejectReason('');
      setShowRejectModal(false);
    } catch (err: any) {
      const updatedItem = { ...item, isLoading: false, error: err.message };
      setItems(items.map(i => i.id === item.id ? updatedItem : i));
    }
  };

  // 权限检查
  if (!user || !['admin', 'super_admin'].includes(user.role || 'guest')) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full",
        isLight ? "bg-white" : "bg-black/40"
      )}>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">权限不足</h2>
          <p className="text-gray-500">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full flex flex-col overflow-hidden",
      isLight ? "bg-white" : "bg-black/40"
    )}>
      {/* 标题栏 */}
      <div className={cn(
        "p-6 border-b",
        isLight ? "border-gray-200" : "border-wangfeng-purple/20"
      )}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">审核面板</h1>
          <button
            onClick={loadPendingItems}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
              isLight
                ? "bg-wangfeng-purple text-white hover:bg-wangfeng-dark"
                : "bg-wangfeng-purple/20 text-wangfeng-light hover:bg-wangfeng-purple/30"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            刷新
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 flex overflow-hidden gap-4 p-6">
        {/* 列表 */}
        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-8 h-8 animate-spin text-wangfeng-purple" />
            </div>
          ) : error ? (
            <div className={cn(
              "p-4 rounded-lg border",
              isLight ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/30"
            )}>
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">没有待审核的内容</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all",
                    isLight
                      ? "bg-white border-gray-200 hover:border-wangfeng-purple/50 hover:shadow-md"
                      : "bg-black/30 border-wangfeng-purple/20 hover:border-wangfeng-purple/50 hover:bg-black/50",
                    selectedItem?.id === item.id && (
                      isLight
                        ? "border-wangfeng-purple bg-wangfeng-purple/5"
                        : "border-wangfeng-purple bg-wangfeng-purple/10"
                    )
                  )}
                >
                  <h3 className="font-semibold mb-2 line-clamp-2">{item.title}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{item.author}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 详情面板 */}
        {selectedItem ? (
          <div className={cn(
            "w-96 flex flex-col border rounded-lg overflow-hidden",
            isLight
              ? "bg-white border-gray-200"
              : "bg-black/50 border-wangfeng-purple/20"
          )}>
            {/* 详情头 */}
            <div className={cn(
              "p-4 border-b",
              isLight ? "border-gray-200" : "border-wangfeng-purple/20"
            )}>
              <h2 className="font-bold text-lg mb-2">{selectedItem.title}</h2>
              <div className="text-sm text-gray-500 space-y-1">
                <p>作者: {selectedItem.author}</p>
                <p>提交时间: {new Date(selectedItem.created_at).toLocaleString()}</p>
                <p>分类: {selectedItem.category_primary}</p>
              </div>
            </div>

            {/* 内容预览 */}
            <div className={cn(
              "flex-1 overflow-y-auto p-4 border-b",
              isLight ? "border-gray-200" : "border-wangfeng-purple/20"
            )}>
              <p className="text-sm whitespace-pre-wrap">{selectedItem.excerpt || selectedItem.content.substring(0, 500)}</p>
            </div>

            {/* 错误信息 */}
            {selectedItem.error && (
              <div className={cn(
                "p-3 border-b",
                isLight ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/30"
              )}>
                <p className="text-sm text-red-600 dark:text-red-400">{selectedItem.error}</p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className={cn(
              "p-4 border-t space-y-2",
              isLight ? "border-gray-200" : "border-wangfeng-purple/20"
            )}>
              {showRejectModal ? (
                <>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="输入拒绝原因..."
                    className={cn(
                      "w-full p-2 rounded border text-sm resize-none",
                      isLight
                        ? "bg-white border-gray-300"
                        : "bg-black/30 border-wangfeng-purple/20"
                    )}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(selectedItem)}
                      disabled={selectedItem.isLoading || !rejectReason.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      {selectedItem.isLoading && <Loader className="w-4 h-4 animate-spin" />}
                      确认拒绝
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectModal(false);
                        setRejectReason('');
                      }}
                      className="flex-1 px-3 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-black/30"
                    >
                      取消
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleApprove(selectedItem)}
                    disabled={selectedItem.isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium"
                  >
                    {selectedItem.isLoading && <Loader className="w-4 h-4 animate-spin" />}
                    <CheckCircle className="w-4 h-4" />
                    批准发布
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={selectedItem.isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    拒绝
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className={cn(
            "w-96 flex items-center justify-center border rounded-lg",
            isLight
              ? "bg-gray-50 border-gray-200"
              : "bg-black/20 border-wangfeng-purple/20"
          )}>
            <p className="text-gray-500">选择一个项目查看详情</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewPanel;
