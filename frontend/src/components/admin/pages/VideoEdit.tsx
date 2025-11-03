/**
 * 视频编辑页面
 * 普通用户编辑自己的视频或管理员编辑已发布的视频
 * 使用 VideoReviewEditor 组件处理两步工作流（编辑模式）
 */

import { useParams, useLocation } from 'react-router-dom';
import VideoReviewEditor from '@/components/ui/VideoReviewEditor';

const VideoEdit = () => {
  const { id } = useParams();
  const location = useLocation();
  const isEditPublish = location.pathname.includes('/edit-publish/');
  const backPath = (location.state as { backPath?: string } | null)?.backPath;

  if (!id) return null;

  return (
    <VideoReviewEditor
      videoId={id}
      mode="edit"
      isAdminView={isEditPublish}
      backPath={backPath}
    />
  );
};

export default VideoEdit;
