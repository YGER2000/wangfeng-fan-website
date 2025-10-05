import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import MDEditor from '@uiw/react-md-editor';
import { Save, Eye, Edit3, Calendar, User, Tag, FileText, FolderTree } from 'lucide-react';
import { Article } from '@/utils/contentManager';
import { ARTICLE_CATEGORIES, getSecondaryCategories, getPrimaryCategories } from '@/config/categories';
import { useAuth } from '@/contexts/AuthContext';
import { getAvailableCategories } from '@/utils/permissions';

interface ArticleEditorProps {
  initialArticle?: Partial<Article>;
  onSave?: (article: Article) => void;
  onPreview?: (article: Article) => void;
}

const ArticleEditor = ({ initialArticle, onSave, onPreview }: ArticleEditorProps) => {
  const { currentRole, user } = useAuth();

  // 根据用户角色获取可用的一级分类
  const availablePrimaryCategories = getAvailableCategories(currentRole);

  const [article, setArticle] = useState<Partial<Article>>({
    title: '',
    content: '',
    author: user?.username || '汪峰',
    category: '个人感悟',
    tags: [],
    excerpt: '',
    date: new Date().toISOString().split('T')[0],
    ...initialArticle,
  });

  // 新增：二级分类状态
  // 默认选择用户可用的第一个分类
  const defaultPrimary = initialArticle?.category_primary || availablePrimaryCategories[0] || '峰言峰语';
  const [categoryPrimary, setCategoryPrimary] = useState(defaultPrimary);
  const [categorySecondary, setCategorySecondary] = useState(
    initialArticle?.category_secondary || '汪峰博客'
  );
  const [availableSecondaries, setAvailableSecondaries] = useState<string[]>([]);

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // 当一级分类变化时，更新二级分类选项
  useEffect(() => {
    const secondaries = getSecondaryCategories(categoryPrimary);
    setAvailableSecondaries(secondaries);
    // 如果当前二级分类不在新的列表中，选择第一个
    if (!secondaries.includes(categorySecondary)) {
      setCategorySecondary(secondaries[0] || '');
    }
  }, [categoryPrimary]);

  const handleContentChange = useCallback((val?: string) => {
    setArticle(prev => ({ ...prev, content: val || '' }));
  }, []);

  const handleInputChange = (field: keyof Article, value: string) => {
    setArticle(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !article.tags?.includes(tagInput.trim())) {
      setArticle(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setArticle(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSave = async () => {
    if (!article.title || !article.content) {
      alert('请填写标题和内容');
      return;
    }

    setIsSaving(true);
    try {
      const fullArticle: Article = {
        id: initialArticle?.id || Date.now().toString(),
        slug: article.title?.toLowerCase().replace(/\s+/g, '-') || '',
        title: article.title || '',
        content: article.content || '',
        author: article.author || '汪峰',
        date: article.date || new Date().toISOString().split('T')[0],
        category: article.category || '个人感悟',
        category_primary: categoryPrimary,        // 新增
        category_secondary: categorySecondary,    // 新增
        tags: article.tags || [],
        excerpt: article.excerpt || article.content?.substring(0, 150) + '...' || '',
      };

      // 调用保存 API
      if (onSave) {
        await onSave(fullArticle);
      }

      alert('文章保存成功！');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (article.title && article.content) {
      const fullArticle: Article = {
        id: initialArticle?.id || Date.now().toString(),
        slug: article.title.toLowerCase().replace(/\s+/g, '-'),
        title: article.title,
        content: article.content,
        author: article.author || '汪峰',
        date: article.date || new Date().toISOString().split('T')[0],
        category: article.category || '个人感悟',
        category_primary: categoryPrimary,
        category_secondary: categorySecondary,
        tags: article.tags || [],
        excerpt: article.excerpt || article.content.substring(0, 150) + '...',
      };

      if (onPreview) {
        onPreview(fullArticle);
      }
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 头部 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bebas tracking-wider theme-text-primary mb-4">
            文章 <span className="text-wangfeng-purple animate-pulse-glow">编辑器</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple mb-6">
            创作属于你的精彩内容
          </h2>
        </motion.div>

        {/* 工具栏 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 theme-bg-card rounded-xl border theme-border-primary"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="flex items-center gap-2 px-4 py-2 bg-wangfeng-purple hover:bg-wangfeng-purple/80 rounded-lg transition-colors"
            >
              {isPreviewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isPreviewMode ? '编辑模式' : '预览模式'}
            </button>

            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              预览文章
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : '保存文章'}
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 文章元信息 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="theme-bg-card rounded-xl border theme-border-primary p-6">
              <h3 className="text-xl font-bold theme-text-primary mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-wangfeng-purple" />
                文章信息
              </h3>

              {/* 标题 */}
              <div className="mb-4">
                <label className="block text-sm font-semibold theme-text-primary mb-2">
                  文章标题 *
                </label>
                <input
                  type="text"
                  value={article.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="请输入文章标题"
                  className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-wangfeng-purple"
                />
              </div>

              {/* 作者 */}
              <div className="mb-4">
                <label className="block text-sm font-semibold theme-text-primary mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  作者
                </label>
                <input
                  type="text"
                  value={article.author || ''}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  placeholder="作者姓名"
                  className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-wangfeng-purple"
                />
              </div>

              {/* 日期 */}
              <div className="mb-4">
                <label className="block text-sm font-semibold theme-text-primary mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  发布日期
                </label>
                <input
                  type="date"
                  value={article.date || ''}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-wangfeng-purple"
                />
              </div>

              {/* 一级分类 */}
              <div className="mb-4">
                <label className="block text-sm font-semibold theme-text-primary mb-2 flex items-center gap-2">
                  <FolderTree className="w-4 h-4" />
                  一级分类（主目录）*
                </label>
                <select
                  value={categoryPrimary}
                  onChange={(e) => setCategoryPrimary(e.target.value)}
                  className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-wangfeng-purple"
                >
                  {availablePrimaryCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {availablePrimaryCategories.length === 0 && (
                  <p className="text-xs text-red-400 mt-1">
                    您没有权限发布文章。请联系管理员。
                  </p>
                )}
                {currentRole === 'user' && (
                  <p className="text-xs text-blue-400 mt-1">
                    普通用户只能发布"峰迷聊峰"分类的文章
                  </p>
                )}
                {currentRole === 'admin' && (
                  <p className="text-xs text-blue-400 mt-1">
                    管理员可以发布"峰言峰语"和"数据科普"分类的文章
                  </p>
                )}
              </div>

              {/* 二级分类 */}
              <div className="mb-4">
                <label className="block text-sm font-semibold theme-text-primary mb-2">
                  二级分类（子目录）*
                </label>
                <select
                  value={categorySecondary}
                  onChange={(e) => setCategorySecondary(e.target.value)}
                  className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-wangfeng-purple"
                >
                  {availableSecondaries.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  当前选择: {categoryPrimary} / {categorySecondary}
                </p>
              </div>

              {/* 摘要 */}
              <div className="mb-4">
                <label className="block text-sm font-semibold theme-text-primary mb-2">
                  文章摘要
                </label>
                <textarea
                  value={article.excerpt || ''}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  placeholder="简短描述文章内容..."
                  rows={3}
                  className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-wangfeng-purple resize-none"
                />
              </div>

              {/* 标签 */}
              <div className="mb-4">
                <label className="block text-sm font-semibold theme-text-primary mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  标签
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="添加标签"
                    className="flex-1 px-3 py-2 theme-bg-secondary theme-text-primary border theme-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-wangfeng-purple"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-wangfeng-purple hover:bg-wangfeng-purple/80 rounded-lg transition-colors"
                  >
                    添加
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {article.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-wangfeng-purple/20 text-wangfeng-purple text-sm rounded-full border border-wangfeng-purple/30"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 编辑器 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="theme-bg-card rounded-xl border theme-border-primary p-6">
              <h3 className="text-xl font-bold theme-text-primary mb-6">
                文章内容 *
              </h3>

              <div data-color-mode="dark" className="markdown-editor-container">
                <MDEditor
                  value={article.content}
                  onChange={handleContentChange}
                  preview={isPreviewMode ? 'preview' : 'edit'}
                  height={600}
                  data-color-mode="dark"
                  visibleDragbar={false}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
