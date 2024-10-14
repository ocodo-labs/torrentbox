import { Progress } from "@/components/ui/progress"
import { Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TableRow, TableCell } from "@/components/ui/table"

const TorrentFileRow = (props) => {
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