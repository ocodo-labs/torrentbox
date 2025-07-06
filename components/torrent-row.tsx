import { FloatButton } from "@/components/float-button"
import { LongPressFloatButton } from "@/components/long-press-float-button"
import { OcodoLoaderIcon } from "@/components/ocodo-loader-icon"
import { TorrentFileRow } from "@/components/torrent-file-row"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { DestructiveDownloadedFileAction, DestructiveTorrentAction } from "@/types/actions"
import { Torrent } from "@/types/torrent"
import { ChevronDown, ChevronUp, Edit, Trash, X } from "lucide-react"
import { useState } from "react"

interface TorrentRowProps {
  torrent: Torrent
  expandedTorrent: string | null
  toggleExpand: (id: string) => void
  handleAction: (item: Torrent, action: DestructiveTorrentAction | DestructiveDownloadedFileAction) => void
  handleRename: (item: Torrent, filename?: string) => void
  handleSoftDelete: (torrent: Torrent, filename: string) => void
  isSoftDeletedFn: (torrentId: string, index: number) => boolean
}

const TorrentRow = (props: TorrentRowProps) => {
  const {
    torrent,
    handleRename,
    handleAction,
    handleSoftDelete,
    toggleExpand,
    expandedTorrent,
    isSoftDeletedFn
  } = props

  const [isDeleting, setIsDeleting] = useState(false)

  return (
    <div key={torrent.id} className="p-4 border border-foreground/20 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
        <h3 className="text-lg font-semibold mb-2 sm:mb-0 truncate">{torrent.name}</h3>
        <div className="flex space-x-2">
          <FloatButton title="Rename"
            icon={<Edit className="h-4 w-4" />}
            onClick={() => handleRename(torrent)} />
          <LongPressFloatButton
            title="Remove Torrent"
            fillColor="bg-primary"
            icon={<X className="h-4 w-4" />}
            onLongPress={() => handleAction(torrent, 'remove')} />
          {!isDeleting
            ? <LongPressFloatButton
              title="Delete Torrent"
              icon={<Trash className="h-4 w-4" />}
              onLongPress={() => {
                setIsDeleting(true);
                handleAction(torrent, 'delete');
                setTimeout(() => setIsDeleting(false), 1500)
              }} />
            :
            <Button
              variant={'ghost'}
              disabled
              size={'icon'}
            >
              <OcodoLoaderIcon className="h-4 w-4 animate-spin" />
            </Button>
          }
          {
            torrent.files.length > 0 ?
              (<FloatButton
                hAlign='left'
                vAlign='middle'
                title={`${expandedTorrent === torrent.id ? 'Hide' : 'Show'} Torrent Files`}
                icon={
                  expandedTorrent === torrent.id
                    ? <ChevronUp className="h-4 w-4" />
                    : <ChevronDown className="h-4 w-4" />}
                onClick={() => toggleExpand(torrent.id)} />)
              : ""
          }
        </div>
      </div>
      <Progress value={torrent.percent} className="w-full" />
      {expandedTorrent === torrent.id && (
        <div className="mt-4 overflow-x-auto">
          {torrent.files
            .filter((_, index) => !isSoftDeletedFn(torrent.id, index))
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
        </div>
      )}
    </div>
  )
}

export { TorrentRow }
