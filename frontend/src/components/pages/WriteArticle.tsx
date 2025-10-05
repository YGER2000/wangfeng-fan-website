import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArticleEditor from '@/components/ui/ArticleEditor';
import { Article } from '@/utils/contentManager';
import { articleAPI } from '@/utils/api';

const WriteArticle = () => {
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  const handleSave = async (article: Article) => {
    try {
      // 调用后端API保存文章
      const articleData = {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        author: article.author,
        category: article.category,
        category_primary: article.category_primary || '峰言峰语',
        category_secondary: article.category_secondary || '汪峰博客',
        tags: article.tags || [],
      };

      const savedArticle = await articleAPI.create(articleData);
      console.log('文章保存成功:', savedArticle);

      // 保存成功后跳转到文章详情页面
      navigate(`/article/${savedArticle.slug}`);

    } catch (error) {
      console.error('保存文章失败:', error);
      throw error;
    }
  };

  const handlePreview = (article: Article) => {
    setPreviewArticle(article);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewArticle(null);
  };

  return (
    <>
      <ArticleEditor onSave={handleSave} onPreview={handlePreview} />
      
      {/* 预览模态框 */}
      {isPreviewOpen && previewArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* 预览头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">文章预览</h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* 预览内容 */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
              {/* 文章头部信息 */}
              <div className="mb-8">
                {previewArticle.category && (
                  <div className="mb-4">
                    <span className="text-sm text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                      {previewArticle.category}
                    </span>
                  </div>
                )}
                
                <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {previewArticle.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <span>作者: {previewArticle.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>日期: {new Date(previewArticle.date).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
                
                {previewArticle.excerpt && (
                  <div className="text-lg text-gray-700 bg-gray-50 p-4 rounded-lg border-l-4 border-purple-500 mb-6">
                    {previewArticle.excerpt}
                  </div>
                )}
                
                {previewArticle.tags && previewArticle.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {previewArticle.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-sm text-gray-600 bg-gray-200 px-3 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 文章内容 */}
              <div className="prose prose-lg max-w-none">
                <div
                  className="article-content"
                  dangerouslySetInnerHTML={{
                    __html: previewArticle.content
                      .split('\n')
                      .map(line => `<p>${line}</p>`)
                      .join('')
                  }}
                />
              </div>
            </div>
            
            {/* 预览底部 */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
              <button
                onClick={closePreview}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                关闭预览
              </button>
              <button
                onClick={() => {
                  closePreview();
                  // 这里可以直接保存文章
                  handleSave(previewArticle);
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                确认发布
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WriteArticle;