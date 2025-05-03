import { Button } from "@/components/ui/button"
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
        <Button variant="ghost" size="icon" onClick={() => handleRename(torrent, filename)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleSoftDelete(torrent, filename)}>
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export { TorrentFileRow }
