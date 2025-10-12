import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import RichTextEditor from './RichTextEditor';
import {
  Card,
  Label,
  TextInput,
  Textarea,
  Select,
  Button,
  Badge,
  Alert,
  Tabs
} from 'flowbite-react';
import {
  HiSave,
  HiEye,
  HiPencil,
  HiCalendar,
  HiUser,
  HiTag,
  HiDocumentText,
  HiFolder,
  HiX,
  HiPlus,
  HiInformationCircle,
  HiCode,
  HiViewGridAdd
} from 'react-icons/hi';
import { Article } from '@/utils/contentManager';
import { ARTICLE_CATEGORIES, getSecondaryCategories, getPrimaryCategories } from '@/config/categories';
import { useAuth } from '@/contexts/AuthContext';
import { getAvailableCategories } from '@/utils/permissions';
import { flowbiteTheme } from '@/config/flowbite-theme';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-purple-50 dark:from-gray-900 dark:via-black dark:to-purple-950 pt-24 pb-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* 头部 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-wangfeng-purple via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Markdown 文章编辑器
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              创作属于你的精彩内容
            </p>
          </div>

          {/* 工具栏 */}
          <Card theme={flowbiteTheme.card}>
            <div className="flex flex-wrap items-center justify-end gap-4">
              <Button
                color="primary"
                theme={flowbiteTheme.button}
                onClick={handleSave}
                disabled={isSaving}
                size="md"
              >
                <HiSave className="mr-2 h-5 w-5" />
                {isSaving ? '保存中...' : '保存文章'}
              </Button>
            </div>

            {availablePrimaryCategories.length === 0 && (
              <Alert color="failure" icon={HiInformationCircle} className="mt-4">
                <span className="font-medium">权限不足！</span> 您没有权限发布文章。请联系管理员。
              </Alert>
            )}

            {currentRole === 'user' && availablePrimaryCategories.length > 0 && (
              <Alert color="info" icon={HiInformationCircle} className="mt-4">
                <span className="font-medium">提示：</span> 普通用户只能发布"峰迷荟萃"分类的文章
              </Alert>
            )}
          </Card>
        </motion.div>

        {/* 主要内容区域 */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* 左侧：文章元信息 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-4"
          >
            <Card theme={flowbiteTheme.card}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <HiDocumentText className="h-6 w-6 text-wangfeng-purple" />
                文章信息
              </h3>

              <div className="space-y-5">
                {/* 标题 */}
                <div>
                  <Label htmlFor="title" className="mb-2 flex items-center gap-2">
                    <span className="text-red-500">*</span>
                    文章标题
                  </Label>
                  <TextInput
                    id="title"
                    type="text"
                    theme={flowbiteTheme.textInput}
                    placeholder="请输入文章标题"
                    value={article.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                {/* 作者 */}
                <div>
                  <Label htmlFor="author" className="mb-2 flex items-center gap-2">
                    <HiUser className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    作者
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <HiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="author"
                      type="text"
                      placeholder="作者姓名"
                      value={article.author || ''}
                      onChange={(e) => handleInputChange('author', e.target.value)}
                      className="block w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 transition focus:border-wangfeng-purple focus:ring-2 focus:ring-wangfeng-purple/40 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-wangfeng-purple/80 dark:focus:ring-wangfeng-purple/40"
                    />
                  </div>
                </div>

                {/* 日期 */}
                <div>
                  <Label htmlFor="date" className="mb-2 flex items-center gap-2">
                    <HiCalendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    发布日期
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <HiCalendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="date"
                      type="date"
                      value={article.date || ''}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="block w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 transition focus:border-wangfeng-purple focus:ring-2 focus:ring-wangfeng-purple/40 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-wangfeng-purple/80 dark:focus:ring-wangfeng-purple/40"
                    />
                  </div>
                </div>

                {/* 一级分类 */}
                <div>
                  <Label htmlFor="primary-category" className="mb-2 flex items-center gap-2">
                    <HiFolder className="h-4 w-4" />
                    <span className="text-red-500">*</span>
                    一级分类（主目录）
                  </Label>
                  <Select
                    id="primary-category"
                    value={categoryPrimary}
                    onChange={(e) => setCategoryPrimary(e.target.value)}
                    required
                  >
                    {availablePrimaryCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </div>

                {/* 二级分类 */}
                <div>
                  <Label htmlFor="secondary-category" className="mb-2 flex items-center gap-2">
                    <HiFolder className="h-4 w-4" />
                    <span className="text-red-500">*</span>
                    二级分类（子目录）
                  </Label>
                  <Select
                    id="secondary-category"
                    value={categorySecondary}
                    onChange={(e) => setCategorySecondary(e.target.value)}
                    required
                  >
                    {availableSecondaries.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    当前选择: <span className="text-wangfeng-purple font-semibold">{categoryPrimary} / {categorySecondary}</span>
                  </p>
                </div>

                {/* 摘要 */}
                <div>
                  <Label htmlFor="excerpt" className="mb-2">
                    文章摘要
                  </Label>
                  <Textarea
                    id="excerpt"
                    placeholder="简短描述文章内容..."
                    rows={4}
                    value={article.excerpt || ''}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  />
                </div>

                {/* 标签 */}
                <div>
                  <Label htmlFor="tags" className="mb-2 flex items-center gap-2">
                    <HiTag className="h-4 w-4" />
                    标签
                  </Label>
                  <div className="flex gap-2 mb-3">
                    <TextInput
                      id="tags"
                      type="text"
                      theme={flowbiteTheme.textInput}
                      placeholder="添加标签"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      className="flex-1"
                    />
                    <Button
                      color="primary"
                      theme={flowbiteTheme.button}
                      onClick={handleAddTag}
                      size="sm"
                    >
                      <HiPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {article.tags?.map((tag, index) => (
                      <Badge
                        key={index}
                        color="purple"
                        size="sm"
                        className="inline-flex items-center gap-1 px-3 py-1"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-400 transition-colors"
                        >
                          <HiX className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* 右侧：Markdown 编辑器 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-8"
          >
            <Card theme={flowbiteTheme.card}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <HiCode className="h-6 w-6 text-wangfeng-purple" />
                  <span className="text-red-500">*</span>
                  文章内容
                </h3>
                <Badge color="info" size="sm">
                  所见即所得，像 Word 一样简单
                </Badge>
              </div>

              <div className="rich-text-editor-container rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <RichTextEditor
                  value={article.content || ''}
                  onChange={handleContentChange}
                  height={700}
                />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
