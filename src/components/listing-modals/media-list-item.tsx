import { fetchAndAddMediaItemMagnet } from '@/lib/fetch-listing-functions';
import { applyNameFilters, type MediaItemToolType, type MediaListingItem } from '@/types/media-listing-interfaces';
import { modalItemInfo, modalItemRow, modalItemToolIconClasses, modalToolButton, thinIconStyle } from '@/lib/styling';
import type { FC } from 'react';
import { Magnet } from 'lucide-react';
import { ExistingMediaIndicator } from '@/components/icons/existing-media-indicator';
import { useTransmissionContext } from '@/contexts/transmission-provider';
import { TooltipCompact } from '@/components/tooltip-compact';
import { MediaItemImage } from '@/components/listing-modals/media-item-image';

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
          Add {media.name} to Transmission
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

export const MediaItemToolWrapper: FC<{ tool: MediaItemToolType; media: MediaListingItem }> = ({ tool, media }) => {
  let title = tool.title

  // Use nameFilters to match media type and customize title
  // If we don't get a match we do not show the tool for this media item.
  const isMatched = tool.nameFilters?.some((filter) => {
    return filter.pattern.test(media.name)
  })

  if (tool.nameFilters && !isMatched) {
    return null
  }

  if (tool.title?.includes('{name}')) {
    title = applyNameFilters(media.name, tool.nameFilters)
    title = tool.title.replace('{name}', title)
  }

  return (
    <TooltipCompact tooltipChildren={
      <div className='select-none'>{title}</div>
    } key={tool.title} >
      <div
        className={modalToolButton}
        onClick={() => tool.action(media)}>
        {tool.icon}
      </div>
    </TooltipCompact>
  )
}
