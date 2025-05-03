import { TorrentFileRow } from "@/components/torrent-file-row"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody } from "@/components/ui/table"
import { ConfirmDownloadedFileAction, ConfirmTorrentAction } from "@/types/actions"
import { Torrent } from "@/types/torrent"
import { ChevronDown, ChevronUp, Edit, Trash, X } from "lucide-react"

interface TorrentRowProps {
    torrent: Torrent
    expandedTorrent: string | null
    toggleExpand: (id: string) => void
    handleAction: (item: Torrent, action: ConfirmTorrentAction | ConfirmDownloadedFileAction) => void
    handleRename: (item: Torrent, filename?: string) => void
    handleSoftDelete: (torrent: Torrent, filename: string) => void
    isSoftDeletedFn: (torrentId: string, index: number) => boolean
}

const TorrentRow = (props: TorrentRowProps) => {
    const { torrent, handleRename, handleAction, handleSoftDelete, toggleExpand, expandedTorrent, isSoftDeletedFn } = props
    return (
        <div key={torrent.id} className="p-4 border rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                <h3 className="text-lg font-semibold mb-2 sm:mb-0 truncate">{torrent.name}</h3>
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
    )
}

export { TorrentRow }
