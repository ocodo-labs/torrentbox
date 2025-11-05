import { fetchAndAddMediaItemMagnet } from '@/lib/fetch-listing-functions';
import type { MediaItemTool, MediaListingItem } from '@/types/media-listing-interfaces';
import { modalItemInfo, modalItemRow, modalToolButton, thinIconStyle } from '@/lib/styling';
import type { FC } from 'react';
import { Magnet } from 'lucide-react';
import { ExistingMediaIndicator } from '@/components/icons/existing-media-indicator';
import { useTransmissionContext } from '@/contexts/transmission-provider';
import { TooltipCompact } from '@/components/tooltip-compact';
import { MediaItemImage } from '@/components/listing-modals/media-item-image';

interface MediaListItemProps {
  media: MediaListingItem
  tools?: MediaItemTool[]
}

export const MediaListItem: FC<MediaListItemProps> = ({ media, tools = [] }) => {
  const { addMagnet } = useTransmissionContext()

  return (
    <div className={modalItemRow}>
      {Object.keys(media).includes('existing') &&
        <ExistingMediaIndicator media={media} />
      }
      <Magnet
        style={thinIconStyle}
        className='cursor-pointer'
        onClick={() => fetchAndAddMediaItemMagnet(media, addMagnet)}
      />
      {
        media.imageUrl &&
        <MediaItemImage media={media} />
      }
      <div className={modalItemInfo}>
        {media.name}
      </div>
      {
        tools.map((tool) => (
          <TooltipCompact tooltipChildren={tool.title} key={tool.title}>
            <div
              className={modalToolButton}
              onClick={() => tool.action(media)}>
              {tool.icon}
            </div>
          </TooltipCompact>
        ))
      }
    </div>
  )
}
