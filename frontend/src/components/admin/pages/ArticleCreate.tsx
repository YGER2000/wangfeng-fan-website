import { useNavigate } from 'react-router-dom';
import ArticleEditor from '@/components/ui/ArticleEditor';
import { Article } from '@/utils/contentManager';
import { articleAPI, uploadAPI } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

const ArticleCreate = () => {
  const navigate = useNavigate();
  const { token, currentRole } = useAuth();

  const handleSave = async (article: Article, coverImage?: File) => {
    try {
      // 判断是否为管理员
      const isAdmin = currentRole === 'admin' || currentRole === 'super_admin';

      // 1. 如果有封面图片，先上传
      let coverUrl: string | undefined = undefined;
      if (coverImage) {
        try {
          console.log('正在上传封面图片...');
          const uploadResult = await uploadAPI.uploadImage(coverImage);
          coverUrl = uploadResult.url;
          console.log('封面上传成功:', coverUrl);
        } catch (uploadError) {
          console.error('封面上传失败:', uploadError);
          throw new Error('封面图片上传失败，请重试');
        }
      }

      // 2. 准备文章数据
      const articleData = {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        author: article.author,
        category: article.category,
        category_primary: article.category_primary,
        category_secondary: article.category_secondary,
        tags: article.tags || [],
        cover_url: coverUrl, // 添加封面URL
        // 普通用户发布的文章需要审核
        review_status: isAdmin ? 'approved' : 'pending',
        is_published: isAdmin, // 管理员直接发布，普通用户待审核
      };

      // 3. 创建文章
      const savedArticle = await articleAPI.create(articleData, token);
      console.log('文章发布成功:', savedArticle);

      // 4. 跳转到文章列表
      navigate('/admin/articles/list');
    } catch (error) {
      console.error('发布文章失败:', error);
      throw error;
    }
  };

  const handlePreview = (article: Article) => {
    console.log('预览文章:', article);
  };

  return <ArticleEditor onSave={handleSave} onPreview={handlePreview} />;
};

export default ArticleCreate;
