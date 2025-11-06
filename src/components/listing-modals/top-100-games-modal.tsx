import { useTop100GamesContext } from '@/contexts/top-100-games-context';
import { MediaListingModal } from '@/components/listing-modals/media-listing-modal';
import type { MediaItemToolType } from '@/types/media-listing-interfaces';
import { mediaItemSearchInGoogle } from './media-item-tools';

export function Top100GamesModal() {
  const props = useTop100GamesContext();

  const itemTools: MediaItemToolType[] = [mediaItemSearchInGoogle];

  return (
    <MediaListingModal
      itemTools={itemTools}
      {...props}
    />
  );
}
