import { LineMdDownloadIcon } from "@/components/line-md-download-icon"
import { AsycJobLongPressTooltipButton } from "@/components/long-press-tooltip-button"
import { TooltipCompact } from "@/components/tooltip-compact"
import { useTorrentSearch } from "@/contexts/torrent-search-context"
import type { TorrentSearchResult } from "@/contexts/torrent-search-provider"
import { thinIconStyle } from "@/lib/styling"
import { Circle, ExternalLink } from "lucide-react"

export function TorrentSearchResultRow(props: TorrentSearchResult) {
  const {
    magnet_link,
    tpb_link,
    name,
    seeds,
    size,
    existing,
  } = props

  const { postTorrentMagnet } = useTorrentSearch()

  return (
    <div className="flex justify-between items-center border-b-2 border-secondary-foreground/10">
      <div className="text-sm w-30 truncate mr-2 md:w-fit md:text-base">
        <div className="flex flex-row gap-2 items-center justify-start">
          {
            existing.length > 0 &&
            <TooltipCompact tooltipChildren={`Existing Download: ${existing}`}>
              <Circle className="w-4 h-4" stroke="#AA6600" strokeWidth={3} />
            </TooltipCompact>
          }
          {
            existing.length == 0 &&
            <Circle className="w-4 h-4" />
          }
          <div className="flex flex-row gap-2 items-center">
            <div>
              {name}
            </div>
            <a href={tpb_link} target='_blank'>
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
