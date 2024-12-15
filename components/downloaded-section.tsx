import { Button } from "@/components/ui/button"
import { ConfirmDownloadedFileAction, ConfirmTorrentAction } from "@/types/actions"
import { Torrent } from "@/types/torrent"
import { Clapperboard, Edit, Trash, Tv } from "lucide-react"

interface DownloadedSectionProps {
  downloadedFiles: string[]
  handleRename: (item: Torrent | string, filename?: string) => void
  handleAction: (torrent: Torrent | string, action: ConfirmTorrentAction | ConfirmDownloadedFileAction) => void
}

function DownloadedSection(props: DownloadedSectionProps) {
  const { downloadedFiles, handleRename, handleAction } = props

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Downloaded</h2>
      <div className="space-y-4">
        {downloadedFiles.map((file: string, index: number) => (
          <div key={index} className="p-4 border rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <h3 className="text-lg font-semibold mb-2 sm:mb-0">{file}</h3>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" onClick={() => handleRename(file)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleAction(file, 'files/move/tvshows')}>
                  <Tv className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleAction(file, 'files/move/movies')}>
                  <Clapperboard className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleAction(file, 'files/delete')}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export { DownloadedSection }
