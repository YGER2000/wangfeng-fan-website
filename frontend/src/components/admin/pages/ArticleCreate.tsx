import ArticleEditor, { Step3Action } from '@/components/ui/ArticleEditor';
import { Article } from '@/utils/contentManager';
import { uploadAPI } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { contentWorkflowAPI } from '@/services/content-workflow-api';

const ArticleCreate = () => {
  const { token, currentRole } = useAuth();

  const handleAction = async (
    action: Step3Action,
    payload: { article?: Article; coverImageFile?: File | null }
  ) => {
    if (action === 'delete' || !payload.article) {
      return;
    }

    if (!token) {
      throw new Error('缺少认证信息');
    }

    try {
      let coverUrl = payload.article.coverUrl;
      if (payload.coverImageFile) {
        const uploadResult = await uploadAPI.uploadImage(payload.coverImageFile);
        coverUrl = uploadResult.url;
      }

      const targetStatus = action === 'saveDraft' ? 'draft' : 'pending';

      const requestBody = {
        title: payload.article.title,
        content: payload.article.content,
        excerpt: payload.article.excerpt,
        author: payload.article.author,
        category: payload.article.category,
        category_primary: payload.article.category_primary || payload.article.category,
        category_secondary: payload.article.category_secondary || payload.article.category,
        tags: payload.article.tags || [],
        cover_url: coverUrl,
        review_status: targetStatus,
        is_published: false,
      };

      const created = await contentWorkflowAPI.createArticle(requestBody, token);
      return created;
    } catch (error) {
      console.error('提交文章失败:', error);
      throw error;
    }
  };

  const handlePreview = (article: Article) => {
    console.log('预览文章:', article);
  };

  return (
    <ArticleEditor
      mode="create"
      isAdminView={currentRole === 'admin' || currentRole === 'super_admin'}
      onAction={handleAction}
      onPreview={handlePreview}
    />
  );
};

export default ArticleCreate;
