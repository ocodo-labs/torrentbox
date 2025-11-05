import { useTop100GamesContext } from '@/contexts/top-100-games-context';
import { thinIconStyle } from '@/lib/styling';
import { GamepadIcon } from 'lucide-react';
import { MediaListingModal } from '@/components/listing-modals/media-listing-modal';

export function Top100GamesModal() {
  const props = useTop100GamesContext();
  const title = 'Top 100 Games'
  const icon = <GamepadIcon style={thinIconStyle} className='w-12 h-12' />

  return (
    <MediaListingModal icon={icon} title={title} {...props} />
  );
}
