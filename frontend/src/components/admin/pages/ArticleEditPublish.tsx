// -*- coding: utf-8 -*-
/**
 * 文章编辑发布页面 - 复制自 ArticleEditor，仅改动第三步按钮
 * 用于：管理员编辑已发布的文章并更新发布
 * 第三步按钮：[上一步] [更新并发布]
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArticleEditor, { Step3Action } from '@/components/ui/ArticleEditor';
import { Article } from '@/utils/contentManager';
import { articleAPI, uploadAPI } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { contentWorkflowAPI } from '@/services/content-workflow-api';

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
          review_status: data.review_status,
        } as any);
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

  const handleAction = async (
    action: Step3Action,
    payload: { article?: Article; coverImageFile?: File | null; articleId?: string }
  ): Promise<Article | void> => {
    if (!id || !token) return;

    if (action === 'delete') {
      if (currentRole !== 'super_admin') {
        throw new Error('您没有权限删除该文章');
      }
      await contentWorkflowAPI.deleteArticle(id, token);
      return;
    }

    if (!payload.article) {
      return;
    }

    const targetStatus = action === 'update' ? 'approved' : (payload.article as any).review_status || 'approved';

    let coverUrl = (payload.article as any).coverUrl || initial?.coverUrl;
    if (payload.coverImageFile) {
      const uploadResult = await uploadAPI.uploadImage(payload.coverImageFile);
      coverUrl = uploadResult.url;
    }

    const updateBody = {
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
      is_published: true,
    };

    const updated = await contentWorkflowAPI.updateArticle(id, updateBody, token);
    return updated;
  };

  const handlePreview = (article: Article) => {
    console.log('预览文章:', article);
  };

  if (loading || !initial) return null;

  return (
    <ArticleEditor
      mode="edit"
      contentId={id}
      contentStatus={(initial as any).review_status}
      isAdminView
      initialArticle={initial}
      onAction={handleAction}
      onPreview={handlePreview}
    />
  );
};

export default ArticleEditPublish;
