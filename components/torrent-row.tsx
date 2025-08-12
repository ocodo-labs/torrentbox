import { TooltipButton } from "@/components/float-button"
import { AsycJobLongPressFloatButton, LongPressTooltipButton } from "@/components/long-press-float-button"
import { TorrentFileRow } from "@/components/torrent-file-row"
import { Progress } from "@/components/ui/progress"
import { useTorrentContext } from "@/contexts/torrent-provider"
import { thinIconStyle } from "@/lib/styling"
import { Torrent } from "@/types/torrent"
import { ChevronDown, ChevronUp, Edit, Trash, X } from "lucide-react"

interface TorrentRowProps {
  torrent: Torrent
}

const TorrentRow = (props: TorrentRowProps) => {
  const {
    torrent
  } = props

  const {
    handleRenameTorrent,
    handleAction,
    toggleExpand,
    expandedTorrent,
    isSoftDeleted,
  } = useTorrentContext()

  return (
    <div key={torrent.id} className="p-4 border border-foreground/20 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
        <h3 className="text-lg font-semibold mb-2 sm:mb-0 truncate">{torrent.name}</h3>
        <div className="flex space-x-2">
          <TooltipButton title="Rename"
            icon={<Edit className="h-4 w-4" style={thinIconStyle}/>}
            onClick={() => handleRenameTorrent(torrent)} />
          <LongPressTooltipButton
            title="Remove Torrent"
            fillColor="bg-primary"
            icon={<X className="h-4 w-4" style={thinIconStyle}/>}
            onLongPress={() => handleAction(torrent, 'remove')} />
          <AsycJobLongPressFloatButton
            title="Delete Torrent"
            icon={<Trash className="h-4 w-4" style={thinIconStyle}/>}
            onLongPress={() => handleAction(torrent, 'delete')}
          />
          {
            torrent.files.length > 1 ?
              (<TooltipButton
                hAlign='left'
                vAlign='middle'
                title={`${expandedTorrent === torrent.id ? 'Hide' : 'Show'} Torrent Files`}
                icon={
                  expandedTorrent === torrent.id
                    ? <ChevronUp className="h-4 w-4" style={thinIconStyle}/>
                    : <ChevronDown className="h-4 w-4" style={thinIconStyle}/>}
                onClick={() => toggleExpand(torrent.id)} />)
              : ""
          }
        </div>
      </div>
      <Progress value={torrent.percent} className="w-full" />
      {expandedTorrent === torrent.id && (
        <div className="mt-4 overflow-x-auto">
          {torrent.files
            .filter((_, index) => !isSoftDeleted(torrent.id, index))
            .map(([filename, size, downloaded], index) => (
              <TorrentFileRow
                key={index}
                torrent={torrent}
                filename={filename}
                size={size}
                downloaded={downloaded}
              />
            ))}
        </div>
      )}
    </div>
  )
}

export { TorrentRow }
