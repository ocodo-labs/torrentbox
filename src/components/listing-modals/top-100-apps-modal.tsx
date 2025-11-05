import { useTop100AppsContext } from '@/contexts/top-100-apps-context';
import { MediaListingModal } from '@/components/listing-modals/media-listing-modal';
import { AppWindowIcon } from 'lucide-react';
import { thinIconStyle } from '@/lib/styling';

export function Top100AppsModal() {
  const props = useTop100AppsContext();
  const icon = <AppWindowIcon style={thinIconStyle} className='w-12 h-12' />
  const title = 'Top 100 Apps'

  return (
    <MediaListingModal title={title} icon={icon} {...props} />
  );
}
