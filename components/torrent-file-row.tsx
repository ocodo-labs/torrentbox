import { FloatButton } from "@/components/float-button"
import { LongPressFloatButton } from "@/components/long-press-float-button"
import { Progress } from "@/components/ui/progress"
import { Torrent } from "@/types/torrent"
import { Edit, Trash } from "lucide-react"

interface TorrentFileRowProps {
  torrent: Torrent
  filename: string
  size: number
  downloaded: number
  handleRename: (item: Torrent, filename: string) => void
  handleSoftDelete: (torrent: Torrent, filename: string) => void
}

const TorrentFileRow = (props: TorrentFileRowProps) => {
  const {
    torrent,
    filename,
    size,
    downloaded,
    handleRename,
    handleSoftDelete,
  } = props

  const progressValue = (downloaded / size) * 100

  return (
    <div className="flex w-full border-b px-4 py-2">
      <div className="flex flex-col flex-1">
        <span className="font-medium">{filename}</span>
        <Progress value={progressValue} className="w-full mt-1" />
      </div>
      <div className="flex items-center gap-2 ml-4">
        <FloatButton title="Rename"
          vAlign='middle'
          hAlign='left'
          icon={<Edit className="h-4 w-4" />}
          onClick={() => handleRename(torrent, filename)} />
        <LongPressFloatButton
          vAlign='top'
          title="Delete"
          icon={<Trash className="h-4 w-4" />}
          onLongPress={() => handleSoftDelete(torrent, filename)} />
      </div>
    </div>
  )
}

export { TorrentFileRow }
