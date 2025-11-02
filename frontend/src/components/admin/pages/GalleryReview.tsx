import { useParams } from 'react-router-dom';
import GalleryEditor from '@/components/ui/GalleryEditor';

const GalleryReview = () => {
  const { id } = useParams();

  if (!id) return null;

  return (
    <GalleryEditor
      mode="review"
      groupId={id}
      backPath="/admin/manage/gallery"
    />
  );
};

export default GalleryReview;
