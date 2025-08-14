import { TooltipButton } from "@/components/tooltip-compact"
import { LongPressTooltipButton } from "@/components/long-press-float-button"
import { Progress } from "@/components/ui/progress"
import { useTransmissionContext } from "@/contexts/transmission-provider"
import { thinIconStyle } from "@/lib/styling"
import { Torrent } from "@/types/torrent"
import { Edit, Trash } from "lucide-react"

interface TorrentFileRowProps {
  torrent: Torrent
  filename: string
  size: number
  downloaded: number
}

const TorrentFileRow = (props: TorrentFileRowProps) => {
  const {
    torrent,
    filename,
    size,
    downloaded,
  } = props

  const { handleRenameTorrent, softDeleteTorrentSubFile } = useTransmissionContext()
  const shortFilename = filename.replace(torrent.name, '')
  const progressValue = (downloaded / size) * 100

  return (
    <div className="flex w-full border-b px-4 py-2">
      <div className="flex flex-col flex-1">
        <span className="font-medium">{shortFilename}</span>
        <Progress value={progressValue} className="w-full mt-1" />
      </div>
      <div className="flex items-center gap-2 ml-4">
        <TooltipButton title="Rename"
          icon={<Edit className="h-4 w-4" style={thinIconStyle} />}
          onClick={() => handleRenameTorrent(torrent, filename)} />
        <LongPressTooltipButton
          title="Delete"
          icon={<Trash className="h-4 w-4" style={thinIconStyle} />}
          onLongPress={() => softDeleteTorrentSubFile(torrent, filename)} />
      </div>
    </div>
  )
}

export { TorrentFileRow }
