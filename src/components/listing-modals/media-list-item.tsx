import { fetchAndAddMediaItemMagnet } from '@/lib/fetch-listing-functions';
import type { MediaItemTool, MediaListingItem } from '@/types/media-listing-interfaces';
import { modalItemInfo, modalItemRow, modalToolButton, thinIconStyle } from '@/lib/styling';
import type { FC } from 'react';
import { Magnet, XCircle } from 'lucide-react';
import { ExistingMediaIndicator } from '@/components/icons/existing-media-indicator';
import { useTransmissionContext } from '@/contexts/transmission-provider';
import { TooltipCompact } from '@/components/tooltip-compact';

interface MediaListItemProps {
  media: MediaListingItem
  tools?: MediaItemTool[]
}

export const MediaListItem: FC<MediaListItemProps> = ({ media, tools = [] }) => {
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

export const MediaItemImage: FC<{ media: MediaListingItem }> = ({ media }) => {
  if (!media.imageUrl) {
    return null
  }

  return (
    <div className='relative'>
      <XCircle
        className='absolute w-6 h-6 bg-black opacity-60 rounded-full top-[-10px] right-[-20px] text-white p-1'
        onClick={() => media.imageUrl = undefined}
      />
      <img
        src={media.imageUrl}
        alt={media.name}
        className='object-cover rounded-sm w-[100px]'
      />
    </div>
  )
}
