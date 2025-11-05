import { useTop100TVShowsContext } from '@/contexts/top-100-tvshows-context';
import { MediaListingModal } from '@/components/listing-modals/media-listing-modal';
import { Tv } from 'lucide-react';
import { thinIconStyle } from '@/lib/styling';
import { mediaItemSearchInGoogle } from './media-item-tools';
import type { MediaItemToolType } from '@/types/media-listing-interfaces';

export function Top100TVShowsModal() {
  const props = useTop100TVShowsContext();
  const title = 'Top 100 TV Shows'
  const icon = <Tv style={thinIconStyle} className='w-12 h-12' />
  const itemTools: MediaItemToolType[] = [mediaItemSearchInGoogle];

  return (
    <MediaListingModal
      itemTools={itemTools}
      title={title}
      icon={icon}
      {...props}
    />
  );
}

