import { TorrentRow } from "@/components/torrent-row"
import { useTorrentManagerContext } from "@/contexts/torrent-manager-context"
import { Torrent } from "@/types/torrent"

const TorrentsSection = () => {

  const {
    torrents,
    handleRenameTorrent,
    handleAction,
    softDeleteTorrentSubFile,
    expandedTorrent,
    toggleExpand,
    isSoftDeleted,
  } = useTorrentManagerContext()

  if (torrents.length > 0) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-4">Torrents</h2>
        <div className="space-y-4">
          {torrents.map((torrent: Torrent) => (
            <TorrentRow
              key={torrent.id}
              torrent={torrent}
              handleAction={handleAction}
              handleRename={handleRenameTorrent}
              handleSoftDelete={softDeleteTorrentSubFile}
              toggleExpand={toggleExpand}
              isSoftDeletedFn={isSoftDeleted}
              expandedTorrent={expandedTorrent}
            />
          ))}
        </div>
      </section>
    )
  } else {
    return null
  }
}

export { TorrentsSection }
