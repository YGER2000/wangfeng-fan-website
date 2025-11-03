/**
 * 视频审核编辑页面
 * 仅用于审核员审核和编辑待发布的视频
 * 使用 VideoReviewEditor 组件处理两步工作流
 */

import { useParams, useLocation } from 'react-router-dom';
import VideoReviewEditor from '@/components/ui/VideoReviewEditor';

const VideoReview = () => {
  const { id } = useParams();
  const location = useLocation();
  const backPath = (location.state as { backPath?: string } | null)?.backPath;

  if (!id) return null;

  return (
    <VideoReviewEditor
      videoId={id}
      mode="review"
      isAdminView
      backPath={backPath}
    />
  );
};

export default VideoReview;
