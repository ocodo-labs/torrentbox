import { Torrent } from "@/types/torrent"
import { ConfirmTorrentAction, ConfirmDownloadedFileAction } from "@/types/actions"
import { Edit, X, Trash, ChevronUp, ChevronDown } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Table, TableBody } from "@/components/ui/table"
import { TorrentFileRow } from "@/components/torrent-file-row"

interface TorrentsSectionProps {
  torrents: Torrent[]
  expandedTorrent: string | null
  toggleExpand: (id: string) => void
  handleAction: (item: Torrent | string, action: ConfirmTorrentAction | ConfirmDownloadedFileAction) => void
  handleRename: (item: Torrent | string, filename?: string) => void
  handleSoftDelete: (torrent: Torrent, filename: string) => void
  isSoftDeletedFn: (torrentId: string, index: number) => boolean
}

const TorrentsSection = (props: TorrentsSectionProps) => {
  const {
    torrents,
    expandedTorrent,
    toggleExpand,
    handleAction,
    handleRename,
    handleSoftDelete,
    isSoftDeletedFn } = props
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Torrents</h2>
      <div className="space-y-4">
        {torrents.map((torrent: Torrent) => (
          <div key={torrent.id} className="p-4 border rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <h3 className="text-lg font-semibold mb-2 sm:mb-0">{torrent.name}</h3>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" onClick={() => handleRename(torrent)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleAction(torrent, 'remove')}>
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleAction(torrent, 'delete')}>
                  <Trash className="h-4 w-4" />
                </Button>
                {
                  torrent.files.length > 0 ?
                    (<Button variant="ghost" size="icon" onClick={() => toggleExpand(torrent.id)}>
                      {expandedTorrent === torrent.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>) : ""
                }
              </div>
            </div>
            <Progress value={torrent.percent} className="w-full" />
            {expandedTorrent === torrent.id && (
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableBody>
                    {torrent.files
                      .filter((file, index) => !isSoftDeletedFn(torrent.id, index))
                      .map(([filename, size, downloaded], index) => (
                        <TorrentFileRow
                          key={index}
                          torrent={torrent}
                          filename={filename}
                          size={size}
                          downloaded={downloaded}
                          handleRename={handleRename}
                          handleSoftDelete={handleSoftDelete}
                        />
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export { TorrentsSection }