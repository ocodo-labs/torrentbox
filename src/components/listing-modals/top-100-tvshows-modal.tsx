import { useTop100TVShowsContext } from '@/contexts/top-100-tvshows-context';
import { MediaListingModal } from '@/components/listing-modals/media-listing-modal';
import { mediaItemFetchPoster, mediaItemSearchInGoogle } from './media-item-tools';
import type { MediaItemToolType } from '@/types/media-listing-interfaces';

export function Top100TVShowsModal() {
  const props = useTop100TVShowsContext();

  const itemTools: MediaItemToolType[] = [
    mediaItemFetchPoster,
    mediaItemSearchInGoogle,
  ];

  return (
    <MediaListingModal
      itemTools={itemTools}
      {...props}
    />
  );
}

