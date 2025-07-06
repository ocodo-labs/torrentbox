import { FloatButton } from "@/components/float-button"
import { LongPressFloatButton } from "@/components/long-press-float-button"
import { useTorrentManagerContext } from "@/contexts/torrent-manager-context"
import { type DestructiveDownloadedFileAction, type DestructiveTorrentAction } from "@/types/actions"
import { Torrent } from "@/types/torrent"
import { Binary, BookIcon, ChevronRightIcon, Clapperboard, Edit, Ellipsis, HeadphonesIcon, Trash, Tv } from "lucide-react"
import { type FC, useState } from "react"

export function DownloadedSection() {
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
  handleAction: (torrent: Torrent | string, action: DestructiveTorrentAction | DestructiveDownloadedFileAction) => void
}

export const DownloadedFileRow: FC<DownloadedFileRowProps> = ({
  file,
  handleAction,
  handleRename,
}) => {
  const [showMore, setShowMore] = useState<boolean>(false)
  return (
    <div className="p-4 border border-foreground/20 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
        <h3 className="text-lg font-semibold mb-2 sm:mb-0">{file}</h3>
        <div className="flex space-x-2">
          <>
            <FloatButton title="Rename"
              icon={<Edit className="h-4 w-4" />}
              onClick={() => handleRename(file)} />
            <LongPressFloatButton title="Move to TV Shows"
              fillColor="bg-primary"
              icon={<Tv className="h-4 w-4" />}
              onLongPress={() => handleAction(file, 'files/move/tvshows')} />
            <LongPressFloatButton title="Move to Movies"
              fillColor="bg-primary"
              icon={<Clapperboard className="h-4 w-4" />}
              onLongPress={() => handleAction(file, 'files/move/movies')} />
          </>
          {!showMore &&
            <FloatButton title="Show More places"
              icon={<Ellipsis className="h-4 w-4" />}
              onClick={() => setShowMore(true)} />
          }
          {showMore &&
            <>
              <FloatButton title="Close More places"
                icon={<ChevronRightIcon className="h-4 w-4" />}
                onClick={() => setShowMore(false)} />
              <LongPressFloatButton title="Move to Books"
                fillColor="bg-primary"
                icon={<BookIcon className="h-4 w-4" />}
                onLongPress={() => handleAction(file, 'files/move/books')} />
              <LongPressFloatButton title="Move to Music"
                fillColor="bg-primary"
                icon={<HeadphonesIcon className="h-4 w-4" />}
                onLongPress={() => handleAction(file, 'files/move/music')} />
              <LongPressFloatButton title="Move to Software"
                fillColor="bg-primary"
                icon={<Binary className="h-4 w-4" />}
                onLongPress={() => handleAction(file, 'files/move/software')} />
            </>
          }
          <LongPressFloatButton title="Delete"
            icon={<Trash className="h-4 w-4" />}
            onLongPress={() => handleAction(file, 'files/delete')} />
        </div>
      </div>
    </div>
  )
}

