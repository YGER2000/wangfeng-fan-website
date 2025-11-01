import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Tag as TagIcon,
  Trash2,
  Edit,
  X
} from 'lucide-react';

import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  tagAPI,
  TagData,
  TagCategoryData
} from '@/utils/api';
import SimpleToast, { ToastType } from '@/components/ui/SimpleToast';

type CategoryFilter = 'all' | number;

interface TagFormState {
  categoryId: number;
  value: string;
  description: string;
}

interface CategoryFormState {
  name: string;
  description: string;
}

const emptyTagForm: TagFormState = {
  categoryId: 0,
  value: '',
  description: '',
};

const emptyCategoryForm: CategoryFormState = {
  name: '',
  description: '',
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '--';
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const TagManager = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const [tags, setTags] = useState<TagData[]>([]);
  const [categories, setCategories] = useState<TagCategoryData[]>([]);

  const [loadingTags, setLoadingTags] = useState<boolean>(true);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const [showTagModal, setShowTagModal] = useState<boolean>(false);
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [tagForm, setTagForm] = useState<TagFormState>(emptyTagForm);
  const [savingTag, setSavingTag] = useState<boolean>(false);

  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [savingCategory, setSavingCategory] = useState<boolean>(false);

  // Toast 提示
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    loadCategories();
    loadTags();
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;
    setTagForm((prev) => {
      if (prev.categoryId) {
        return prev;
      }
      return {
        ...prev,
        categoryId: categories[0].id,
      };
    });
  }, [categories]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await tagAPI.listCategories();
      setCategories(data);
    } catch (error) {
      console.error('加载标签种类失败:', error);
      setToast({ message: '加载标签种类失败，请稍后重试', type: 'error' });
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadTags = async () => {
    setLoadingTags(true);
    try {
      const data = await tagAPI.list(0, 500);
      setTags(data);
    } catch (error) {
      console.error('加载标签失败:', error);
      setToast({ message: '加载标签失败，请稍后重试', type: 'error' });
    } finally {
      setLoadingTags(false);
    }
  };

  const filteredTags = useMemo(() => {
    return tags.filter((tag) => {
      const matchesCategory =
        categoryFilter === 'all' ? true : tag.category_id === categoryFilter;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory;

      const combined = [
        tag.display_name,
        tag.value,
        tag.category_name ?? '',
        tag.description ?? ''
      ].join(' ').toLowerCase();

      return matchesCategory && combined.includes(query);
    });
  }, [tags, searchQuery, categoryFilter]);

  const stats = useMemo(() => ({
    total: tags.length,
    categories: categories.length,
    filtered: filteredTags.length
  }), [tags, categories.length, filteredTags.length]);

  const openCreateTagModal = () => {
    if (categories.length === 0) {
      setToast({ message: '请先创建标签种类', type: 'error' });
      return;
    }
    setEditingTag(null);
    setTagForm({
      categoryId: categories[0].id,
      value: '',
      description: '',
    });
    setShowTagModal(true);
  };

  const openEditTagModal = (tag: TagData) => {
    setEditingTag(tag);
    setTagForm({
      categoryId: tag.category_id,
      value: tag.value,
      description: tag.description ?? '',
    });
    setShowTagModal(true);
  };

  const closeTagModal = () => {
    setShowTagModal(false);
    setEditingTag(null);
    setTagForm(emptyTagForm);
  };

  const handleSaveTag = async () => {
    if (!tagForm.value.trim()) {
      setToast({ message: '请输入标签值', type: 'error' });
      return;
    }

    if (!tagForm.categoryId) {
      setToast({ message: '请选择标签种类', type: 'error' });
      return;
    }

    setSavingTag(true);
    try {
      if (editingTag) {
        const updated = await tagAPI.update(editingTag.id, {
          categoryId: tagForm.categoryId,
          value: tagForm.value,
          description: tagForm.description.trim() ? tagForm.description : undefined,
        });
        setTags((prev) => prev.map((item) => item.id === updated.id ? updated : item));
        setToast({ message: '标签更新成功', type: 'success' });
      } else {
        const created = await tagAPI.create({
          categoryId: tagForm.categoryId,
          value: tagForm.value,
          description: tagForm.description.trim() ? tagForm.description : undefined,
        });
        setTags((prev) => [...prev, created]);
        setToast({ message: '标签创建成功', type: 'success' });
      }
      closeTagModal();
    } catch (error) {
      console.error('保存标签失败:', error);
      setToast({ message: '保存标签失败，请检查输入后重试', type: 'error' });
    } finally {
      setSavingTag(false);
    }
  };

  const handleDeleteTag = async (tag: TagData) => {
    if (!window.confirm(`确定要删除标签"${tag.display_name}"吗？该操作无法撤销。`)) {
      return;
    }
    try {
      await tagAPI.delete(tag.id);
      setTags((prev) => prev.filter((item) => item.id !== tag.id));
      setToast({ message: '标签删除成功', type: 'success' });
    } catch (error) {
      console.error('删除标签失败:', error);
      setToast({ message: '删除标签失败，请稍后重试', type: 'error' });
    }
  };

  const openCategoryModal = () => {
    setCategoryForm(emptyCategoryForm);
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setCategoryForm(emptyCategoryForm);
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim()) {
      setToast({ message: '请输入标签种类名称', type: 'error' });
      return;
    }

    setSavingCategory(true);
    try {
      const created = await tagAPI.createCategory({
        name: categoryForm.name,
        description: categoryForm.description.trim() ? categoryForm.description : undefined,
      });
      setCategories((prev) => [...prev, created]);
      setTagForm((prev) => ({
        ...prev,
        categoryId: created.id,
      }));
      setToast({ message: '标签种类创建成功', type: 'success' });
      closeCategoryModal();
    } catch (error) {
      console.error('创建标签种类失败:', error);
      setToast({ message: error instanceof Error ? error.message : '创建标签种类失败', type: 'error' });
    } finally {
      setSavingCategory(false);
    }
  };

  return (
    <div className={cn(
      'h-full flex flex-col',
      isLight ? 'bg-gray-50' : 'bg-transparent'
    )}>
      {/* 顶部标题 */}
      <div className={cn(
        'flex-shrink-0 border-b px-6 py-4',
        isLight ? 'bg-white border-gray-200' : 'bg-black/40 border-wangfeng-purple/20'
      )}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <TagIcon className="h-6 w-6 text-wangfeng-purple" />
            <div>
              <h1 className={cn('text-xl font-bold', isLight ? 'text-gray-900' : 'text-white')}>
                标签管理
              </h1>
              <p className={cn('text-sm mt-0.5', isLight ? 'text-gray-500' : 'text-gray-400')}>
                管理所有标签种类与标签，支持创建、编辑和删除
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCategoryModal}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isLight
                  ? 'border border-gray-200 text-gray-700 hover:bg-gray-100'
                  : 'border border-wangfeng-purple/30 text-gray-200 hover:bg-wangfeng-purple/10'
              )}
            >
              <Plus className="h-4 w-4" />
              新增种类
            </button>
            <button
              onClick={openCreateTagModal}
              className="flex items-center gap-2 px-4 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={categories.length === 0}
            >
              <Plus className="h-4 w-4" />
              新增标签
            </button>
          </div>
        </div>

        {/* 指标 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className={cn(
            'rounded-lg p-4 border',
            isLight ? 'bg-white border-gray-200' : 'bg-black/40 border-wangfeng-purple/20'
          )}>
            <div className={cn('text-sm', isLight ? 'text-gray-600' : 'text-gray-400')}>
              总标签数
            </div>
            <div className={cn('text-2xl font-bold mt-1', isLight ? 'text-gray-900' : 'text-white')}>
              {stats.total}
            </div>
          </div>
          <div className={cn(
            'rounded-lg p-4 border',
            isLight ? 'bg-white border-gray-200' : 'bg-black/40 border-wangfeng-purple/20'
          )}>
            <div className={cn('text-sm', isLight ? 'text-gray-600' : 'text-gray-400')}>
              标签种类
            </div>
            <div className={cn('text-2xl font-bold mt-1', isLight ? 'text-gray-900' : 'text-white')}>
              {stats.categories}
            </div>
          </div>
          <div className={cn(
            'rounded-lg p-4 border',
            isLight ? 'bg-white border-gray-200' : 'bg-black/40 border-wangfeng-purple/20'
          )}>
            <div className={cn('text-sm', isLight ? 'text-gray-600' : 'text-gray-400')}>
              当前筛选
            </div>
            <div className={cn('text-2xl font-bold mt-1', isLight ? 'text-gray-900' : 'text-white')}>
              {stats.filtered}
            </div>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className={cn(
        'flex-shrink-0 border-b px-6 py-4',
        isLight ? 'bg-white border-gray-200' : 'bg-black/40 border-wangfeng-purple/20'
      )}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex-1 relative">
            <Search className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4',
              isLight ? 'text-gray-400' : 'text-gray-500'
            )} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索标签名称、种类或描述..."
              className={cn(
                'w-full pl-10 pr-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2',
                isLight
                  ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                  : 'bg-black/50 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/30'
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(event) => {
                const value = event.target.value;
                setCategoryFilter(value === 'all' ? 'all' : Number(value));
              }}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2',
                isLight
                  ? 'bg-white border-gray-300 text-gray-700 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                  : 'bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/30'
              )}
            >
              <option value="all">全部种类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 标签列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {(loadingTags || loadingCategories) ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple mx-auto mb-4" />
              <p className={cn('text-sm', isLight ? 'text-gray-600' : 'text-gray-400')}>
                加载中...
              </p>
            </div>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className={cn(
            'flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg',
            isLight ? 'border-gray-200 bg-white' : 'border-wangfeng-purple/20 bg-black/30'
          )}>
            <TagIcon className={cn(
              'h-12 w-12 mb-4',
              isLight ? 'text-gray-300' : 'text-gray-600'
            )} />
            <p className={cn('text-sm', isLight ? 'text-gray-500' : 'text-gray-400')}>
              {tags.length === 0 ? '尚未创建任何标签，点击“新增标签”开始吧。' : '没有满足当前筛选条件的标签。'}
            </p>
          </div>
        ) : (
          <div className={cn(
            'overflow-hidden border rounded-xl shadow-sm',
            isLight ? 'border-gray-200 bg-white' : 'border-wangfeng-purple/20 bg-black/30'
          )}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/60">
                <thead className={cn(
                  isLight ? 'bg-gray-50' : 'bg-black/40'
                )}>
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      标签
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      种类
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      值
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      描述
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      创建时间
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      更新时间
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className={cn(
                  isLight ? 'bg-white divide-y divide-gray-200/60' : 'divide-y divide-wangfeng-purple/20'
                )}>
                  {filteredTags.map((tag) => (
                    <tr key={tag.id} className={cn(
                      'transition-colors',
                      isLight ? 'hover:bg-gray-50' : 'hover:bg-black/40'
                    )}>
                      <td className="px-5 py-4">
                        <div className={cn(
                          'font-medium text-sm',
                          isLight ? 'text-gray-900' : 'text-white'
                        )}>
                          {tag.display_name}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {tag.id}
                        </div>
                      </td>
                      <td className={cn(
                        'px-5 py-4 text-sm',
                        isLight ? 'text-gray-700' : 'text-gray-200'
                      )}>
                        {tag.category_name ?? '—'}
                      </td>
                      <td className={cn(
                        'px-5 py-4 text-sm',
                        isLight ? 'text-gray-700' : 'text-gray-200'
                      )}>
                        {tag.value}
                      </td>
                      <td className={cn(
                        'px-5 py-4 text-sm',
                        isLight ? 'text-gray-500' : 'text-gray-400'
                      )}>
                        {tag.description ?? '—'}
                      </td>
                      <td className={cn(
                        'px-5 py-4 text-sm',
                        isLight ? 'text-gray-500' : 'text-gray-400'
                      )}>
                        {formatDateTime(tag.created_at)}
                      </td>
                      <td className={cn(
                        'px-5 py-4 text-sm',
                        isLight ? 'text-gray-500' : 'text-gray-400'
                      )}>
                        {formatDateTime(tag.updated_at)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditTagModal(tag)}
                            className={cn(
                              'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                              isLight
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-black/60 text-gray-200 hover:bg-wangfeng-purple/20'
                            )}
                          >
                            <Edit className="h-4 w-4" />
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag)}
                            className={cn(
                              'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                              isLight
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 标签表单模态框 */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={cn(
            'rounded-lg shadow-xl max-w-lg w-full p-6 border',
            isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-wangfeng-purple/40'
          )}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={cn(
                'text-lg font-semibold',
                isLight ? 'text-gray-900' : 'text-white'
              )}>
                {editingTag ? '编辑标签' : '新增标签'}
              </h2>
              <button
                onClick={closeTagModal}
                className={cn(
                  'rounded-full p-1.5',
                  isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-black/60 text-gray-300'
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  isLight ? 'text-gray-700' : 'text-gray-300'
                )}>
                  标签种类
                </label>
                <select
                  value={tagForm.categoryId}
                  onChange={(event) => setTagForm((prev) => ({
                    ...prev,
                    categoryId: Number(event.target.value)
                  }))}
                  className={cn(
                    'w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2',
                    isLight
                      ? 'bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                      : 'bg-black/60 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/30'
                  )}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  isLight ? 'text-gray-700' : 'text-gray-300'
                )}>
                  标签值
                </label>
                <input
                  type="text"
                  value={tagForm.value}
                  onChange={(event) => setTagForm((prev) => ({
                    ...prev,
                    value: event.target.value
                  }))}
                  placeholder="例如：花火、鲍家街43号"
                  className={cn(
                    'w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2',
                    isLight
                      ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                      : 'bg-black/60 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/30'
                  )}
                />
              </div>

              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  isLight ? 'text-gray-700' : 'text-gray-300'
                )}>
                  描述（可选）
                </label>
                <textarea
                  value={tagForm.description}
                  onChange={(event) => setTagForm((prev) => ({
                    ...prev,
                    description: event.target.value
                  }))}
                  rows={3}
                  placeholder="添加一些描述，方便区分同名标签"
                  className={cn(
                    'w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2',
                    isLight
                      ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                      : 'bg-black/60 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/30'
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={closeTagModal}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isLight
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-black/60 text-gray-300 hover:bg-black/50'
                )}
                disabled={savingTag}
              >
                取消
              </button>
              <button
                onClick={handleSaveTag}
                disabled={savingTag}
                className="px-4 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingTag ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增种类模态框 */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={cn(
            'rounded-lg shadow-xl max-w-md w-full p-6 border',
            isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-wangfeng-purple/40'
          )}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={cn(
                'text-lg font-semibold',
                isLight ? 'text-gray-900' : 'text-white'
              )}>
                新增标签种类
              </h2>
              <button
                onClick={closeCategoryModal}
                className={cn(
                  'rounded-full p-1.5',
                  isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-black/60 text-gray-300'
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  isLight ? 'text-gray-700' : 'text-gray-300'
                )}>
                  种类名称
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm((prev) => ({
                    ...prev,
                    name: event.target.value
                  }))}
                  placeholder="例如：单曲、专辑、演唱会"
                  className={cn(
                    'w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2',
                    isLight
                      ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                      : 'bg-black/60 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/30'
                  )}
                />
              </div>

              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  isLight ? 'text-gray-700' : 'text-gray-300'
                )}>
                  种类描述（可选）
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(event) => setCategoryForm((prev) => ({
                    ...prev,
                    description: event.target.value
                  }))}
                  rows={3}
                  placeholder="说明该种类的用途，例如“与单曲相关的标签”"
                  className={cn(
                    'w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2',
                    isLight
                      ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                      : 'bg-black/60 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/30'
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={closeCategoryModal}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isLight
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-black/60 text-gray-300 hover:bg-black/50'
                )}
                disabled={savingCategory}
              >
                取消
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={savingCategory}
                className="px-4 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingCategory ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default TagManager;
