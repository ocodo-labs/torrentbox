import { LongPressTooltipButton } from "@/components/long-press-tooltip-button"
import { TorrentRow } from "@/components/torrent-row"
import { useTransmissionContext } from "@/contexts/transmission-provider"
import { playSound } from "@/lib/play-sound"
import { thinIconStyle } from "@/lib/styling"
import { type Torrent } from "@/types/torrent"
import { CircleX, ListChecks, Trash, X } from "lucide-react"

const TorrentsSection = () => {

  const {
    torrents,
    selectedTorrents,
    setSelectedTorrents,
    clearSoftDeleted,
    executeSelectedTorrentsAction,

  } = useTransmissionContext()

  if (torrents.length > 0) {
    return (
      <section>
        <div className="text-xl font-semibold mb-4">Torrents</div>
        {selectedTorrents.size > 0 &&
          <>
            <div className="flex flex-row gap-2 my-2">
              <LongPressTooltipButton
                onLongPress={() => executeSelectedTorrentsAction("remove")}
                title="Remove Selected Torrents"
                fillColor="bg-primary"
                icon={
                  <X
                    className="h-4 w-4 cursor-pointer"
                    style={thinIconStyle}
                  />
                }
              />
              <LongPressTooltipButton
                title="Delete Selected Torrents"
                icon={
                  <Trash className="h-4 w-4 cursor-pointer" style={thinIconStyle} />
                }
                onLongPress={async () => {
                  playSound("/sounds/torrent-delete.mp3")
                  const selected = torrents.filter((t) => selectedTorrents.has(t.id))
                  await executeSelectedTorrentsAction("delete")
                  selected.forEach(clearSoftDeleted)
                }}
              />
              <LongPressTooltipButton
                title="Clear Selection"
                fillColor="bg-primary"
                duration={400}
                icon={
                  <CircleX className="h-4 w-4 cursor-pointer" style={thinIconStyle} />
                }
                onLongPress={() => {
                  setSelectedTorrents(new Set())
                }}
              />
              <LongPressTooltipButton
                title="Select All"
                fillColor="bg-primary"
                duration={400}
                icon={
                  <ListChecks className="h-4 w-4 cursor-pointer" style={thinIconStyle} />
                }
                onLongPress={() => {
                  setSelectedTorrents(new Set(torrents.map(torrent => torrent.id)))
                }}
              />
            </div>
          </>
        }
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
