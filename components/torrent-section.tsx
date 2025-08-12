import { TorrentRow } from "@/components/torrent-row"
import { useTorrentContext } from "@/contexts/torrent-provider"
import { Torrent } from "@/types/torrent"

const TorrentsSection = () => {

  const {
    torrents,
  } = useTorrentContext()

  if (torrents.length > 0) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-4">Torrents</h2>
        <div className="space-y-4">
          {torrents.map((torrent: Torrent) => (
            <TorrentRow
              key={torrent.id}
              torrent={torrent}
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
