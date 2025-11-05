import { useTop100TVShowsContext } from '@/contexts/top-100-tvshows-context';
import { MediaListingModal } from '@/components/listing-modals/media-listing-modal';
import { Tv } from 'lucide-react';
import { thinIconStyle } from '@/lib/styling';

export function Top100TVShowsModal() {
  const props = useTop100TVShowsContext();
  const title = 'Top 100 TV Shows'
  const icon = <Tv style={thinIconStyle} className='w-12 h-12' />

  return (
    <MediaListingModal icon={icon} title={title} {...props} />
  );
}


