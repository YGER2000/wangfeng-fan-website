/**
 * 视频审核编辑页面
 * 仅用于审核员审核和编辑待发布的视频
 * 使用 VideoReviewEditor 组件处理两步工作流
 */

import { useParams } from 'react-router-dom';
import VideoReviewEditor from '@/components/ui/VideoReviewEditor';

const VideoReview = () => {
  const { id } = useParams();

  if (!id) return null;

  return <VideoReviewEditor videoId={id} isEditMode={false} />;
};

export default VideoReview;
