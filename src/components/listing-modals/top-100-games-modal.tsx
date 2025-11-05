import { useTop100GamesContext } from '@/contexts/top-100-games-context';
import { thinIconStyle } from '@/lib/styling';
import { GamepadIcon } from 'lucide-react';
import { MediaListingModal } from '@/components/listing-modals/media-listing-modal';
import type { MediaItemTool } from '@/types/media-listing-interfaces';
import { mediaItemSearchInGoogle } from './media-item-tools';

export function Top100GamesModal() {
  const props = useTop100GamesContext();
  const title = 'Top 100 Games'
  const icon = <GamepadIcon style={thinIconStyle} className='w-12 h-12' />
  const itemTools: MediaItemTool[] = [mediaItemSearchInGoogle];

  return (
    <MediaListingModal
      itemTools={itemTools}
      title={title}
      icon={icon}
      {...props}
    />
  );
}
