// -*- coding: utf-8 -*-
/**
 * 文章编辑发布页面 - 复制自 ArticleEditor，仅改动第三步按钮
 * 用于：管理员编辑已发布的文章并更新发布
 * 第三步按钮：[上一步] [更新并发布]
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArticleEditor from '@/components/ui/ArticleEditor';
import { Article } from '@/utils/contentManager';
import { articleAPI, uploadAPI } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

const ArticleEditPublish = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, currentRole } = useAuth();
  const [initial, setInitial] = useState<Partial<Article> | null>(null);
  const [loading, setLoading] = useState(true);

  // 权限检查
  useEffect(() => {
    if (currentRole !== 'admin' && currentRole !== 'super_admin') {
      navigate('/admin/dashboard');
    }
  }, [currentRole, navigate]);

  // 加载已发布的文章
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await articleAPI.getById(id);

        // 验证文章状态（只能编辑已发布的文章）
        if (data.review_status !== 'approved') {
          alert('只能编辑已发布的文章');
          navigate('/admin/manage/articles');
          return;
        }

        setInitial({
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
      } catch (e) {
        console.error('加载文章失败', e);
        alert('加载文章失败');
        navigate('/admin/manage/articles');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleSave = async (article: Article, coverImage?: File) => {
    if (!id) return;

    try {
      // 1. 如果有新的封面图片，先上传
      let coverUrl: string | undefined = undefined;
      if (coverImage) {
        try {
          console.log('正在上传新封面图片...');
          const uploadResult = await uploadAPI.uploadImage(coverImage);
          coverUrl = uploadResult.url;
          console.log('封面上传成功:', coverUrl);
        } catch (uploadError) {
          console.error('封面上传失败:', uploadError);
          throw new Error('封面图片上传失败，请重试');
        }
      }

      // 2. 准备更新数据 - 编辑已发布文章
      const updateData = {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        author: article.author,
        category: article.category,
        category_primary: article.category_primary,
        category_secondary: article.category_secondary,
        tags: article.tags || [],
        cover_url: coverUrl,
        published_at: article.date ? new Date(article.date).toISOString() : undefined,
        // 保持已发布状态
        review_status: 'approved',
        is_published: true,
      };

      // 3. 更新文章
      await articleAPI.update(id, updateData, token);
    } catch (error) {
      console.error('更新文章失败:', error);
      throw error;
    }
  };

  const handleDelete = async (articleId: string) => {
    if (!confirm('确定删除该文章吗？')) return;
    try {
      await articleAPI.delete(articleId, token);
      navigate('/admin/manage/articles');
    } catch (error) {
      console.error('删除文章失败:', error);
      alert('删除失败');
    }
  };

  const handlePreview = (article: Article) => {
    console.log('预览文章:', article);
  };

  if (loading || !initial) return null;

  return (
    <ArticleEditor
      initialArticle={initial}
      onSave={handleSave}
      onPreview={handlePreview}
      onDelete={currentRole === 'super_admin' ? handleDelete : undefined}
      isPublishMode={true}
    />
  );
};

export default ArticleEditPublish;
