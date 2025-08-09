import { TooltipButton } from "@/components/float-button"
import { AsycJobLongPressFloatButton, LongPressTooltipButton } from "@/components/long-press-float-button"
import { useTorrentManagerContext } from "@/contexts/torrent-provider"
import { type DestructiveDownloadedFileAction, type DestructiveTorrentAction } from "@/types/actions"
import { Torrent } from "@/types/torrent"
import { Binary, BookIcon, ChevronRightIcon, Clapperboard, Edit, Ellipsis, HeadphonesIcon, Trash, Tv } from "lucide-react"
import { type FC, useState } from "react"


export const DownloadedSection:FC = () => {
  const {
    handleAction,
    handleRenameDownloaded,
    downloadedFiles,
  } = useTorrentManagerContext()

  if (downloadedFiles.length > 0) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-4">Downloaded</h2>
        <div className="space-y-4">
          {downloadedFiles.map((file: string, index: number) => (
            <DownloadedFileRow
              key={index}
              file={file}
              handleAction={handleAction}
              handleRename={handleRenameDownloaded}
            />
          ))}
        </div>
      </section>
    )
  } else {
    return null
  }
}

interface DownloadedFileRowProps {
  file: string
  handleRename: (item: string, filename?: string) => void
  handleAction: (torrent: Torrent | string, action: DestructiveTorrentAction | DestructiveDownloadedFileAction) => Promise<void>
}

export const DownloadedFileRow: FC<DownloadedFileRowProps> = ({
  file,
  handleAction,
  handleRename,
}) => {
  const [showMore, setShowMore] = useState<boolean>(false)
  return (
    <div className="p-4 border border-foreground/10 dark:border-foreground/5 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
        <h3 className="text-lg font-semibold mb-2 sm:mb-0">{file}</h3>
        <div className="flex space-x-2">
          <>
            <TooltipButton title="Rename"
              icon={<Edit className="h-4 w-4" />}
              onClick={() => handleRename(file)} />
            <AsycJobLongPressFloatButton title="Move to TV Shows"
              fillColor="bg-primary"
              icon={<Tv className="h-4 w-4" />}
              onLongPress={() => handleAction(file, 'files/move/tvshows')} />
            <AsycJobLongPressFloatButton title="Move to Movies"
              fillColor="bg-primary"
              icon={<Clapperboard className="h-4 w-4" />}
              onLongPress={() => handleAction(file, 'files/move/movies')} />
          </>
          {!showMore &&
            <TooltipButton title="Show More places"
              icon={<Ellipsis className="h-4 w-4" />}
              onClick={() => setShowMore(true)} />
          }
          {showMore &&
            <>
              <TooltipButton title="Close More places"
                icon={<ChevronRightIcon className="h-4 w-4" />}
                onClick={() => setShowMore(false)} />
              <AsycJobLongPressFloatButton title="Move to Books"
                fillColor="bg-primary"
                icon={<BookIcon className="h-4 w-4" />}
                onLongPress={() => handleAction(file, 'files/move/books')} />
              <AsycJobLongPressFloatButton title="Move to Music"
                fillColor="bg-primary"
                icon={<HeadphonesIcon className="h-4 w-4" />}
                onLongPress={() => handleAction(file, 'files/move/music')} />
              <AsycJobLongPressFloatButton title="Move to Software"
                fillColor="bg-primary"
                icon={<Binary className="h-4 w-4" />}
                onLongPress={() => handleAction(file, 'files/move/software')} />
            </>
          }
          <LongPressTooltipButton title="Delete"
            icon={<Trash className="h-4 w-4" />}
            onLongPress={() => handleAction(file, 'files/delete')} />
        </div>
      </div>
    </div>
  )
}

