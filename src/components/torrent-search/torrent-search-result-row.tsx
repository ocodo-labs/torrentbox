import { LineMdDownloadIcon } from "@/components/line-md-download-icon"
import { MediaItemImage } from "@/components/listing-modals/media-item-image"
import { MediaItemToolWrapper } from "@/components/listing-modals/media-item-tool-wrapper"
import { mediaItemFetchPoster, mediaItemSearchInGoogle } from "@/components/listing-modals/media-item-tools"
import { AsyncJobLongPressTooltipButton } from "@/components/long-press-tooltip-button"
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
    <div className="flex flex-col md:flex-row justify-between py-2 border-b-2 border-secondary-foreground/10">
      <div className="flex flex-row gap-2 items-center justify-start">
        {
          media.imageUrl &&
          <MediaItemImage media={media} />
        }
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
        <div className="truncate max-w-[75vw]">
          {name}
        </div>
        <a href={href} target='_blank'>
          <ExternalLink style={thinIconStyle} className="w-4 h-4" />
        </a>
      </div>
      <div className="flex flex-row gap-3 items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {size}
        </div>
        <TooltipCompact tooltipChildren={`Seeds`}>
          <div className="text-xs w-3 text-right">
            {seeds}
          </div>
        </TooltipCompact>
        {
          itemTools.map((tool) =>
            <MediaItemToolWrapper key={tool.title} tool={tool} media={media} />)
        }
        <AsyncJobLongPressTooltipButton
          fillColor="bg-primary"
          title={`Download ${name}`}
          onLongPress={() => postTorrentMagnet(name, magnet_link)}
          icon={<LineMdDownloadIcon className="h-4 w-4" style={thinIconStyle} />} />
      </div>
    </div>
  )
}
