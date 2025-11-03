import { useParams, useLocation } from 'react-router-dom';
import GalleryEditor from '@/components/ui/GalleryEditor';

const GalleryReview = () => {
  const { id } = useParams();
  const location = useLocation();
  const backPath = (location.state as { backPath?: string } | null)?.backPath;

  if (!id) return null;

  return (
    <GalleryEditor
      mode="review"
      groupId={id}
      backPath={backPath || '/admin/manage/gallery'}
      isAdminView
    />
  );
};

export default GalleryReview;
