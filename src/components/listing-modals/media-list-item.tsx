import { fetchAndAddMediaItemMagnet } from '@/lib/fetch-listing-functions';
import { type MediaItemToolType, type MediaListingItem } from '@/types/media-listing-interfaces';
import { modalItemInfo, modalItemRow, modalItemToolIconClasses, thinIconStyle } from '@/lib/styling';
import type { FC } from 'react';
import { Magnet } from 'lucide-react';
import { ExistingMediaIndicator } from '@/components/icons/existing-media-indicator';
import { useTransmissionContext } from '@/contexts/transmission-provider';
import { TooltipCompact } from '@/components/tooltip-compact';
import { MediaItemImage } from '@/components/listing-modals/media-item-image';
import { miscToSpace, squeezeSpaces, videoNameFilter } from '@/components/listing-modals/media-item-tools';
import { MediaItemToolWrapper } from '@/components/listing-modals/media-item-tool-wrapper';

interface MediaListItemProps {
  media: MediaListingItem
  tools?: MediaItemToolType[]
}

export const MediaListItem: FC<MediaListItemProps> = ({ media, tools = [] }) => {
  const { addMagnet } = useTransmissionContext()

  return (
    <div className={modalItemRow}>
      {
        media.imageUrl &&
        <MediaItemImage media={media} />
      }
      {Object.keys(media).includes('existing') &&
        <ExistingMediaIndicator media={media} />
      }
      <TooltipCompact tooltipChildren={
        <div className='select-none'>
          Add {
            media.name
              .replace(videoNameFilter.pattern, '$1')
              .replace(miscToSpace.pattern, ' ')
              .replace(squeezeSpaces.pattern, ' ')
          } to Transmission
        </div>
      }>
        <Magnet
          style={thinIconStyle}
          className={modalItemToolIconClasses}
          onClick={() => fetchAndAddMediaItemMagnet(media, addMagnet)}
        />
      </TooltipCompact>
      {
        tools.map((tool) =>
          <MediaItemToolWrapper key={tool.title} tool={tool} media={media} />
        )
      }
      <div className={modalItemInfo}>
        {media.name.replaceAll('.', ' ')}
      </div>
    </div>
  )
}
