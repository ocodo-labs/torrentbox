import { useState, type FC } from "react"
import { Tv } from "lucide-react"
import { thinIconStyle } from "@/lib/styling"
import { useTransmissionContext } from "@/contexts/transmission-provider"
import { useStorage } from "@/contexts/storage-context"
import type { StorageNamePath } from "@/contexts/storage-provider"
import { StoragePathSelect } from "./storage-path-select"
import { cn } from "@/lib/utils"
import { TooltipCompact } from "../tooltip-compact"
import { toast } from "sonner"

export const TVShowToStorage: FC<{ file: string }> = ({ file }) => {

  const { tvShows, fetchTVShowList } = useStorage();
  const { handleAction } = useTransmissionContext();
  const [showTVShows, setShowTVShows] = useState<boolean>(false);
  const [currentShow, setCurrentShow] = useState<StorageNamePath>({} as StorageNamePath);

  const handleMoveToCurrentShowClick = () => {
    const seriesPath = currentShow.path;
    setCurrentShow({} as StorageNamePath);
    return handleAction(
      file, "files/move/tvshows",
      { 'tvseries': seriesPath }
    )
  }

  return (
    <>
      <TooltipCompact tooltipChildren="Move to TV Show">
        <div
          className="rounded-full cursor-pointer p-2 hover:bg-foreground/10"
        >

          <Tv
            className="h-4 w-4"
            style={thinIconStyle}
            onClick={() => {
              if (!showTVShows) {
                fetchTVShowList()
                setShowTVShows(true)
              } else {
                setShowTVShows(false)
                setCurrentShow({} as StorageNamePath)
              }
            }}
          />
        </div>
      </TooltipCompact>
      {
        showTVShows && !currentShow.name &&
        <StoragePathSelect
          selectLabel="Move to TV show..."
          items={[...tvShows, { name: 'Add new tv show...', path: '' }]}
          onPick={setCurrentShow}
        />
      }
      {
        currentShow.name &&
        <div
          className={cn(`rounded-full bg-primary cursor-pointer text-xs p-1 px-3`)}
          onClick={() => {
            if (currentShow.path != '') {
              handleMoveToCurrentShowClick()
            } else {
              toast('Welp...')
            }
          }}
        >
          {currentShow.path ? `Move to ${currentShow.name}` : currentShow.name}
        </div>
      }
      {
        // TODO: the user will want to add the download to a new show.
        // We let them enter a name (will extend to add TMDBorg api in a later iteration)
      }
    </>
  )
}

