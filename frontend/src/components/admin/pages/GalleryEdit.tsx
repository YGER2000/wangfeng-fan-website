import { useParams, useLocation } from 'react-router-dom';
import GalleryEditor from '@/components/ui/GalleryEditor';

const GalleryEdit = () => {
  const { id } = useParams();
  const location = useLocation();
  const backPath = (location.state as { backPath?: string } | null)?.backPath;

  if (!id) return null;

  return (
    <GalleryEditor
      mode="edit"
      groupId={id}
      backPath={backPath || '/admin/manage/gallery'}
      isAdminView
    />
  );
};

export default GalleryEdit;
