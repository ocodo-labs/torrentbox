import { LineMdDownloadIcon } from "@/components/line-md-download-icon"
import { AsycJobLongPressTooltipButton } from "@/components/long-press-tooltip-button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTorrentSearch } from "@/contexts/torrent-search-context"
import type { TorrentSearchResult } from "@/contexts/torrent-search-provider"
import { thinIconStyle } from "@/lib/styling"
import { Circle } from "lucide-react"

export function TorrentSearchResultRow(props: TorrentSearchResult) {
  const {
    magnet_link,
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
            <Tooltip>
              <TooltipTrigger>
                <Circle className="w-4 h-4" stroke="#AA6600" strokeWidth={3} />
              </TooltipTrigger>
              <TooltipContent>
                Existing Download: {existing}
              </TooltipContent>
            </Tooltip>
          }
          {
            existing.length == 0 &&
            <Circle className="w-4 h-4" />
          }
          <div>
            {name}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 select-none">
        <div className="text-xs text-muted-foreground">
          {size}
        </div>
        <Tooltip>
          <TooltipTrigger>
            <div className="text-xs w-3">
              {seeds}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Seeds
          </TooltipContent>
        </Tooltip>
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