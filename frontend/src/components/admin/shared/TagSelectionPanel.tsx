import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Loader2, AlertCircle, Search, Plus, X, Tag as TagIcon, Info } from 'lucide-react';

import { cn } from '@/lib/utils';
import { tagAPI, TagData, TagCategoryData } from '@/utils/api';

interface TagSelectionPanelProps {
  contextText: string;
  selectedTags: TagData[];
  onChange: (tags: TagData[]) => void;
  isLight: boolean;
  title?: string;
  infoMessage?: string;
  className?: string;
}

interface NewTagFormState {
  categoryId: string;
  value: string;
  description: string;
}

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, ' ');

const getDisplayName = (tag: TagData) => (tag.display_name || tag.name || tag.value || '').trim();

const TagSelectionPanel = ({
  contextText,
  selectedTags,
  onChange,
  isLight,
  title = '标签管理',
  infoMessage,
  className = '',
}: TagSelectionPanelProps) => {
  const [allTags, setAllTags] = useState<TagData[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategoryData[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagFetchError, setTagFetchError] = useState<string | null>(null);

  const [suggestedTags, setSuggestedTags] = useState<TagData[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [tagSearchResults, setTagSearchResults] = useState<TagData[]>([]);
  const [isSearchingTags, setIsSearchingTags] = useState(false);

  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [newTagForm, setNewTagForm] = useState<NewTagFormState>({
    categoryId: '',
    value: '',
    description: '',
  });
  const [newTagError, setNewTagError] = useState<string | null>(null);
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const loadTagResources = useCallback(async () => {
    setTagsLoading(true);
    setTagFetchError(null);
    try {
      const [tagsData, categoriesData] = await Promise.all([
        tagAPI.list(0, 500),
        tagAPI.listCategories(),
      ]);
      setAllTags(tagsData);
      setTagCategories(categoriesData);
    } catch (error) {
      console.error('加载标签资源失败:', error);
      setTagFetchError('加载标签资源失败，请稍后重试');
    } finally {
      setTagsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTagResources();
  }, [loadTagResources]);

  useEffect(() => {
    if (tagCategories.length > 0) {
      setNewTagForm(prev => {
        if (prev.categoryId) return prev;
        return {
          ...prev,
          categoryId: String(tagCategories[0].id),
        };
      });
    }
  }, [tagCategories]);

  const selectedTagIds = new Set(selectedTags.map(tag => tag.id));

  const recomputeSuggestions = useCallback(() => {
    if (allTags.length === 0) {
      setSuggestedTags([]);
      setIsGeneratingSuggestions(false);
      return;
    }

    const cleanedContext = stripHtml(contextText || '');
    if (!cleanedContext.trim()) {
      setSuggestedTags([]);
      setIsGeneratingSuggestions(false);
      return;
    }

    setIsGeneratingSuggestions(true);
    const normalized = cleanedContext.toLowerCase();
    const condensed = normalized.replace(/\s+/g, '');
    const matches: TagData[] = [];

    allTags.forEach(tag => {
      if (selectedTagIds.has(tag.id)) {
        return;
      }

      const candidates = [tag.value, tag.display_name, tag.name].filter(Boolean) as string[];
      const matched = candidates.some(candidate => {
        const normalizedCandidate = candidate.toLowerCase();
        const condensedCandidate = normalizedCandidate.replace(/\s+/g, '');
        return (
          normalizedCandidate.length > 0 &&
          (normalized.includes(normalizedCandidate) || condensed.includes(condensedCandidate))
        );
      });

      if (matched && !matches.some(item => item.id === tag.id)) {
        matches.push(tag);
      }
    });

    setSuggestedTags(matches.slice(0, 10));
    setIsGeneratingSuggestions(false);
  }, [allTags, contextText, selectedTagIds]);

  useEffect(() => {
    recomputeSuggestions();
  }, [recomputeSuggestions]);

  useEffect(() => {
    if (!tagSearchQuery.trim()) {
      setTagSearchResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearchingTags(true);
      try {
        const results = await tagAPI.search(tagSearchQuery.trim());
        setTagSearchResults(results.filter(tag => !selectedTagIds.has(tag.id)));
      } catch (error) {
        console.error('搜索标签失败:', error);
        setTagSearchResults([]);
      } finally {
        setIsSearchingTags(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [tagSearchQuery, selectedTagIds]);

  const handleAddTag = (tag: TagData) => {
    if (selectedTagIds.has(tag.id)) {
      return;
    }
    const next = [...selectedTags, tag];
    onChange(next);
    setSuggestedTags(prev => prev.filter(item => item.id !== tag.id));
    setTagSearchResults(prev => prev.filter(item => item.id !== tag.id));
  };

  const handleRemoveTag = (tagId: number) => {
    onChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleOpenCreateModal = () => {
    if (tagCategories.length === 0) {
      setNewTagError('请先在标签管理页面创建标签种类');
      return;
    }
    setNewTagError(null);
    setNewTagForm(prev => ({
      categoryId: prev.categoryId || (tagCategories[0] ? String(tagCategories[0].id) : ''),
      value: '',
      description: '',
    }));
    setShowCreateTagModal(true);
  };

  const handleCreateTag = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTagForm.value.trim()) {
      setNewTagError('请输入标签名称');
      return;
    }

    const categoryIdNum = Number(newTagForm.categoryId);
    if (!newTagForm.categoryId || Number.isNaN(categoryIdNum) || categoryIdNum <= 0) {
      setNewTagError('请选择标签种类');
      return;
    }

    setNewTagError(null);
    setIsCreatingTag(true);
    try {
      const created = await tagAPI.create({
        categoryId: categoryIdNum,
        value: newTagForm.value.trim(),
        description: newTagForm.description.trim() ? newTagForm.description.trim() : undefined,
      });
      setAllTags(prev => [...prev, created]);
      setShowCreateTagModal(false);
      onChange([...selectedTags, created]);
      setSuggestedTags(prev => prev.filter(item => item.id !== created.id));
      setTagSearchResults(prev => prev.filter(item => item.id !== created.id));
    } catch (error) {
      console.error('创建标签失败:', error);
      setNewTagError(error instanceof Error ? error.message : '创建标签失败，请稍后重试');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleResetCreateForm = () => {
    setNewTagError(null);
    setNewTagForm({
      categoryId: tagCategories[0] ? String(tagCategories[0].id) : '',
      value: '',
      description: '',
    });
  };

  const closeCreateTagModal = () => {
    setShowCreateTagModal(false);
    setNewTagError(null);
  };

  return (
    <div className={cn(
      "rounded-lg border p-6",
      isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20",
      className
    )}>
      <h2 className={cn(
        "text-lg font-semibold mb-4 pb-2 border-b flex items-center justify-between",
        isLight ? "text-gray-900 border-gray-200" : "text-white border-wangfeng-purple/20"
      )}>
        <span className="flex items-center gap-2">
          <TagIcon className="h-5 w-5 text-wangfeng-purple" />
          {title}
          {/* 信息提示图标 */}
          <div className="relative group">
            <button
              type="button"
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
              onClick={() => setShowInfoTooltip(!showInfoTooltip)}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                isLight
                  ? "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  : "text-gray-500 hover:bg-white/10 hover:text-gray-300"
              )}
              title="标签管理帮助"
            >
              <Info className="h-4 w-4" />
            </button>

            {/* Tooltip 提示框 */}
            {showInfoTooltip && (
              <div className={cn(
                "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 px-4 py-2 rounded-lg text-xs whitespace-nowrap",
                isLight
                  ? "bg-gray-900 text-white"
                  : "bg-gray-800 text-gray-100"
              )}>
                我们会基于内容推荐标签，也可搜索或创建新标签
                {/* Tooltip 箭头 */}
                <div className={cn(
                  "absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45",
                  isLight ? "bg-gray-900" : "bg-gray-800"
                )} />
              </div>
            )}
          </div>
        </span>
        <button
          type="button"
          onClick={recomputeSuggestions}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
            isLight
              ? "bg-wangfeng-purple/10 text-wangfeng-purple hover:bg-wangfeng-purple/20"
              : "bg-wangfeng-purple/30 text-wangfeng-purple hover:bg-wangfeng-purple/40"
          )}
        >
          <Sparkles className="h-4 w-4" />
          重新匹配
        </button>
      </h2>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className={cn(
            "text-sm font-semibold flex items-center gap-2",
            isLight ? "text-gray-900" : "text-gray-200"
          )}>
            <Sparkles className="h-4 w-4 text-wangfeng-purple" />
            推荐标签
          </h3>
          {tagsLoading && (
            <span className={cn(
              "text-xs flex items-center gap-1",
              isLight ? "text-gray-500" : "text-gray-400"
            )}>
              <Loader2 className="h-3 w-3 animate-spin" />
              加载标签资源...
            </span>
          )}
        </div>

        {tagFetchError && (
          <div className={cn(
            "rounded-lg border px-3 py-2 text-xs flex items-start gap-2 mb-3",
            isLight
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          )}>
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p>{tagFetchError}</p>
              <button
                type="button"
                onClick={() => { void loadTagResources(); }}
                className="mt-1 inline-flex items-center gap-1 text-xs text-wangfeng-purple hover:underline"
              >
                重新加载
              </button>
            </div>
          </div>
        )}

        {isGeneratingSuggestions ? (
          <div className={cn(
            "rounded-lg border px-4 py-6 text-center",
            isLight ? "border-gray-200 bg-gray-50" : "border-wangfeng-purple/20 bg-black/40"
          )}>
            <Loader2 className="h-5 w-5 mx-auto mb-2 animate-spin text-wangfeng-purple" />
            <p className={cn(
              "text-xs",
              isLight ? "text-gray-500" : "text-gray-400"
            )}>
              正在分析内容，寻找合适的标签...
            </p>
          </div>
        ) : suggestedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleAddTag(tag)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  isLight
                    ? "bg-wangfeng-purple/10 text-wangfeng-purple hover:bg-wangfeng-purple/20"
                    : "bg-wangfeng-purple/20 text-wangfeng-purple hover:bg-wangfeng-purple/30"
                )}
              >
                {getDisplayName(tag)}
                <Plus className="h-3 w-3" />
              </button>
            ))}
          </div>
        ) : (
          <p className={cn(
            "text-xs px-3 py-2 rounded-lg border",
            isLight ? "border-gray-200 text-gray-500 bg-gray-50" : "border-wangfeng-purple/20 text-gray-400 bg-black/40"
          )}>
            暂未找到匹配的推荐标签。可以尝试搜索或直接创建。
          </p>
        )}
      </div>

      <div className="mb-6">
        <label className={cn(
          "text-sm font-semibold flex items-center gap-2 mb-2",
          isLight ? "text-gray-900" : "text-gray-200"
        )}>
          <Search className="h-4 w-4 text-wangfeng-purple" />
          搜索标签
        </label>
        <div className="relative mb-3">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
            isLight ? "text-gray-500" : "text-gray-400"
          )} />
          <input
            value={tagSearchQuery}
            onChange={(e) => setTagSearchQuery(e.target.value)}
            placeholder="输入关键词搜索标签..."
            className={cn(
              "w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2",
              isLight
                ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
            )}
          />
          {isSearchingTags && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-wangfeng-purple" />
          )}
        </div>
        <div className={cn(
          "rounded-lg border px-3 py-3 min-h-[60px]",
          isLight ? "border-gray-200 bg-gray-50" : "border-wangfeng-purple/20 bg-black/40"
        )}>
          {tagSearchQuery.trim() === '' ? (
            <p className={cn(
              "text-xs",
              isLight ? "text-gray-500" : "text-gray-400"
            )}>
              输入关键词后，我们会显示匹配的标签结果。
            </p>
          ) : tagSearchResults.length === 0 ? (
            <p className={cn(
              "text-xs",
              isLight ? "text-gray-500" : "text-gray-400"
            )}>
              没有找到相关标签。尝试其他关键词，或直接创建新标签。
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tagSearchResults.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                    isLight
                      ? "bg-white text-wangfeng-purple border border-wangfeng-purple/40 hover:bg-wangfeng-purple/10"
                      : "bg-black/60 text-wangfeng-purple border border-wangfeng-purple/40 hover:bg-wangfeng-purple/20"
                  )}
                >
                  {getDisplayName(tag)}
                  <Plus className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h3 className={cn(
          "text-sm font-semibold mb-2 flex items-center gap-2",
          isLight ? "text-gray-900" : "text-gray-200"
        )}>
          <TagIcon className="h-4 w-4 text-wangfeng-purple" />
          已选择的标签
        </h3>
        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <span
                key={tag.id}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                  isLight
                    ? "bg-wangfeng-purple/10 text-wangfeng-purple"
                    : "bg-wangfeng-purple/20 text-wangfeng-purple"
                )}
              >
                {getDisplayName(tag)}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.id)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className={cn(
            "text-xs px-3 py-2 rounded-lg border",
            isLight ? "border-gray-200 text-gray-500 bg-gray-50" : "border-wangfeng-purple/20 text-gray-400 bg-black/40"
          )}>
            还没有选择标签。建议添加 1-2 个标签，便于内容分类与检索。
          </p>
        )}
      </div>

      <div className={cn(
        "rounded-lg border px-4 py-4",
        isLight ? "border-gray-200 bg-gray-50" : "border-wangfeng-purple/20 bg-black/30"
      )}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className={cn(
              "text-sm font-semibold flex items-center gap-2",
              isLight ? "text-gray-900" : "text-gray-200"
            )}>
              <Plus className="h-4 w-4 text-wangfeng-purple" />
              创建新标签
            </h3>
            <p className={cn(
              "text-xs mt-1",
              isLight ? "text-gray-500" : "text-gray-400"
            )}>
              若没有合适的标签，可以点击按钮新建，创建后会同步到标签管理页面。
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            disabled={tagCategories.length === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
              isLight
                ? "bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90 disabled:bg-gray-200 disabled:text-gray-500"
                : "bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90 disabled:bg-white/10 disabled:text-gray-500"
            )}
          >
            <Plus className="h-4 w-4" />
            新建标签
          </button>
        </div>
        {tagCategories.length === 0 && (
          <p className={cn(
            "text-xs mt-3 rounded-lg border px-3 py-2",
            isLight ? "border-yellow-200 bg-yellow-50 text-yellow-700" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
          )}>
            暂无标签种类可选，请先在标签管理页面创建种类后再返回此处添加标签。
          </p>
        )}
      </div>

      {showCreateTagModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={closeCreateTagModal} />
          <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto">
            <div className={cn(
              "relative w-full max-w-2xl rounded-2xl border shadow-2xl",
              isLight ? "bg-white border-gray-200" : "bg-black/80 border-wangfeng-purple/40"
            )}>
              <div className={cn(
                "flex items-center justify-between px-6 py-4 border-b",
                isLight ? "border-gray-200" : "border-wangfeng-purple/30"
              )}>
                <div>
                  <h2 className={cn(
                    "text-lg font-semibold",
                    isLight ? "text-gray-900" : "text-white"
                  )}>
                    创建新标签
                  </h2>
                  <p className={cn(
                    "text-xs mt-1",
                    isLight ? "text-gray-500" : "text-gray-400"
                  )}>
                    创建后将自动添加到当前内容，并在标签管理页面中可见。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTagModal(false);
                    setNewTagError(null);
                  }}
                  className={cn(
                    "rounded-full p-2 transition-colors",
                    isLight ? "text-gray-500 hover:bg-gray-100" : "text-gray-300 hover:bg-white/10"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTag} className="px-6 py-5 space-y-4">
                {newTagError && (
                  <div className={cn(
                    "rounded-lg border px-3 py-2 text-sm flex items-start gap-2",
                    isLight
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "bg-red-500/10 border-red-500/30 text-red-300"
                  )}>
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{newTagError}</span>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={cn(
                      "block text-xs font-semibold mb-2",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      选择标签种类
                    </label>
                    <select
                      value={newTagForm.categoryId}
                      onChange={(e) => setNewTagForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2",
                        isLight
                          ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          : "bg-black/60 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/30"
                      )}
                    >
                      <option value="">请选择标签种类</option>
                      {tagCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={cn(
                      "block text-xs font-semibold mb-2",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      标签名称
                    </label>
                    <input
                      value={newTagForm.value}
                      onChange={(e) => setNewTagForm(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="例如：2024巡演、线下签售"
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2",
                        isLight
                          ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          : "bg-black/60 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/30"
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={cn(
                      "block text-xs font-semibold mb-2",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      标签描述（可选）
                    </label>
                    <textarea
                      value={newTagForm.description}
                      onChange={(e) => setNewTagForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2",
                        isLight
                          ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                          : "bg-black/60 border-wangfeng-purple/30 text-gray-200 placeholder:text-gray-500 focus:border-wangfeng-purple focus:ring-wangfeng-purple/30"
                      )}
                      placeholder="补充标签使用场景或说明，便于其他管理员理解（可选）"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleResetCreateForm}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isLight
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    )}
                  >
                    重置
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTag}
                    className="px-5 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingTag ? '创建中...' : '创建并添加'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagSelectionPanel;
