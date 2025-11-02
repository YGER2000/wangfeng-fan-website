import { useParams, useLocation } from 'react-router-dom';
import GalleryEditor from '@/components/ui/GalleryEditor';

const GalleryEdit = () => {
  const { id } = useParams();
  const location = useLocation();
  const isEditPublish = location.pathname.includes('/edit-publish/');

  if (!id) return null;

  return (
    <GalleryEditor
      mode="edit"
      groupId={id}
      backPath="/admin/gallery/list"
      isEditPublish={isEditPublish}
    />
  );
};

export default GalleryEdit;
