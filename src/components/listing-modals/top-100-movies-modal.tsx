import { useTop100MoviesContext } from '@/contexts/top-100-movies-context';
import { thinIconStyle } from '@/lib/styling';
import { Film } from 'lucide-react';
import { MediaListingModal } from '@/components/listing-modals/media-listing-modal';
import type { MediaItemTool } from '@/types/media-listing-interfaces';
import { fetchPosterForMediaItem } from '@/lib/fetch-listing-functions';

export function Top100MoviesModal() {
  const props = useTop100MoviesContext();
  const title = 'Top 100 Movies'
  const icon = <Film style={thinIconStyle} className='w-12 h-12' />
  const itemTools: MediaItemTool[] = [
    {
      icon: <Film style={thinIconStyle} />,
      action: fetchPosterForMediaItem,
      title: 'Lookup Poster'
    }
  ]

  return (
    <MediaListingModal icon={icon} title={title} itemTools={itemTools} {...props} />
  );
}
