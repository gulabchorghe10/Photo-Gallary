import { PhotoGallery } from '@/components/PhotoGallery';
import { SupabaseStatus } from '@/components/SupabaseStatus';
import { PhotoTableStatus } from '@/components/PhotoTableStatus';

const Index = () => {
  return (
    <div>
      <SupabaseStatus />
      <PhotoTableStatus />
      <PhotoGallery />
    </div>
  );
};

export default Index;
