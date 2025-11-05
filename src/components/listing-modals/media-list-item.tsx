import { fetchAndAddMediaItemMagnet } from '@/lib/fetch-listing-functions';
import type { MediaListingItem } from '@/contexts/media-listing-interfaces';
import { modalItemInfo, modalItemRow, thinIconStyle } from '@/lib/styling';
import type { FC } from 'react';
import { Magnet } from 'lucide-react';
import { ExistingMediaIndicator } from '@/components/icons/existing-media-indicator';
import { useTransmissionContext } from '@/contexts/transmission-provider';

interface MediaListItemProps {
  media: MediaListingItem
}

export const MediaListItem: FC<MediaListItemProps> = ({ media }) => {
  const { addMagnet } = useTransmissionContext()

  return (
    <div key={media.href} className={modalItemRow}>
      {Object.keys(media).includes('existing') &&
        <ExistingMediaIndicator media={media} />
      }
      <Magnet
        style={thinIconStyle}
        className='cursor-pointer'
        onClick={() => fetchAndAddMediaItemMagnet(media, addMagnet)}
      />
      <div className={modalItemInfo}>
        {media.name}
      </div>
    </div>
  )
}
