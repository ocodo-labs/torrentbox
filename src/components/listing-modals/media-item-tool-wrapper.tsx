import { TooltipCompact } from "@/components/tooltip-compact";
import { applyNameFilters } from "@/lib/fetch-listing-functions";
import { modalToolButton } from "@/lib/styling";
import { type MediaItemToolType, type MediaListingItem } from "@/types/media-listing-interfaces";
import type { FC } from "react";

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
    title = tool.title.replace('{name}', title).trim()
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
