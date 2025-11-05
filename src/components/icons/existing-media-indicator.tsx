import { TooltipCompact } from "@/components/tooltip-compact"
import type { MediaListingItem } from "@/types/media-listing-interfaces"
import { Circle } from "lucide-react"
import type { FC } from "react"

interface ExistingMediaIndicatorProps {
  media: MediaListingItem
}

export const ExistingMediaIndicator: FC<ExistingMediaIndicatorProps> = ({ media }) => {
  const hasExistingMediaStyle = { stroke: "#AA6600", strokeWidth: 3 }
  return (
    <>
      {
        media.existing && media.existing.length > 0 &&
        <TooltipCompact tooltipChildren={`Existing Download${media.existing.length > 1 ? 's' : ''}: ${media.existing}`}>
          <Circle className="w-3 h-3" style={hasExistingMediaStyle} />
        </TooltipCompact>
      }
      {
        media.existing && media.existing.length == 0 &&
        <Circle className="w-3 h-3" />
      }
    </>
  )
}
