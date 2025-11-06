import { LineMdDownloadIcon } from "@/components/line-md-download-icon"
import { MediaItemImage } from "@/components/listing-modals/media-item-image"
import { mediaItemFetchPoster, mediaItemSearchInGoogle } from "@/components/listing-modals/media-item-tools"
import { MediaItemToolWrapper } from "@/components/listing-modals/media-list-item"
import { AsycJobLongPressTooltipButton } from "@/components/long-press-tooltip-button"
import { TooltipCompact } from "@/components/tooltip-compact"
import { useTorrentSearch } from "@/contexts/torrent-search-context"
import type { TorrentSearchResult } from "@/contexts/torrent-search-provider"
import { thinIconStyle } from "@/lib/styling"
import type { MediaItemToolType } from "@/types/media-listing-interfaces"
import { Circle, ExternalLink } from "lucide-react"
import { useState } from "react"

export function TorrentSearchResultRow(props: TorrentSearchResult) {
  const {
    magnet_link,
    href,
    name,
    seeds,
    size,
    existing,
  } = props

  const itemTools: MediaItemToolType[] = [
    mediaItemFetchPoster,
    mediaItemSearchInGoogle,
  ]

  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const media = { name, href, imageUrl, setImageUrl, existing };
  const { postTorrentMagnet } = useTorrentSearch()

  return (
    <div className="flex justify-between items-center border-b-2 border-secondary-foreground/10">
      <div className="text-sm w-30 truncate mr-2 md:w-fit md:text-base">
        <div className="flex flex-row gap-2 items-center justify-start">
          {
            existing?.length != undefined && existing.length > 0 &&
            <TooltipCompact tooltipChildren={`Existing Download: ${existing}`}>
              <Circle className="w-4 h-4" stroke="#AA6600" strokeWidth={3} />
            </TooltipCompact>
          }
          {
            existing?.length == 0 &&
            <Circle className="w-4 h-4" />
          }
          {
            media.imageUrl &&
            <MediaItemImage media={media} />
          }
          <div className="flex flex-row gap-2 items-center">
            {
              itemTools.map((tool) =>
                <MediaItemToolWrapper key={tool.title} tool={tool} media={media} />)
            }
            <div>
              {name}
            </div>
            <a href={href} target='_blank'>
              <ExternalLink style={thinIconStyle} className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 select-none">
        <div className="text-xs text-muted-foreground">
          {size}
        </div>
        <TooltipCompact tooltipChildren={`Seeds`}>
          <div className="text-xs w-3">
            {seeds}
          </div>
        </TooltipCompact>
        <div className="ml-4 my-[3px]">
          <AsycJobLongPressTooltipButton
            fillColor="bg-primary"
            title={`Download ${name}`}
            onLongPress={() => postTorrentMagnet(name, magnet_link)}
            icon={<LineMdDownloadIcon className="h-4 w-4" style={thinIconStyle} />} />
        </div>
      </div>
    </div>
  )
}
