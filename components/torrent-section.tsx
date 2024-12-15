import { TorrentRow } from "@/components/torrent-row"
import { ConfirmDownloadedFileAction, ConfirmTorrentAction } from "@/types/actions"
import { Torrent } from "@/types/torrent"

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
          <TorrentRow
            torrent={torrent}
            handleAction={handleAction}
            handleRename={handleRename}
            handleSoftDelete={handleSoftDelete}
            toggleExpand={toggleExpand}
            isSoftDeletedFn={isSoftDeletedFn}
            expandedTorrent={expandedTorrent}
          />
        ))}
      </div>
    </section>
  )
}

export { TorrentsSection }
