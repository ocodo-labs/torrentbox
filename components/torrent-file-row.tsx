import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TableCell, TableRow } from "@/components/ui/table"
import { Torrent } from "@/types/torrent"
import { Edit, Trash } from "lucide-react"

interface TorrentFileRowProps {
  filename: string
  size: number
  downloaded: number
  handleRename: (item: Torrent, filename: string) => void
  handleSoftDelete: (torrent: Torrent, filename: string) => void
  torrent: Torrent
}

const TorrentFileRow = (props: TorrentFileRowProps) => {
  const {
    filename,
    size,
    downloaded,
    handleRename,
    handleSoftDelete,
    torrent,
  } = props
  return (
    <TableRow>
      <TableCell className="font-medium">
        {filename}
        <Progress value={(downloaded / size) * 100} className="w-full" />
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" onClick={() => handleRename(torrent, filename)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleSoftDelete(torrent, filename)}>
          <Trash className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export { TorrentFileRow }
