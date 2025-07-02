import { FloatBox } from "@/components/float-box"
import { Button } from "@/components/ui/button"
import { ConfirmDownloadedFileAction, ConfirmTorrentAction } from "@/types/actions"
import { Torrent } from "@/types/torrent"
import { Binary, BookIcon, ChevronRightIcon, Clapperboard, Edit, Ellipsis, HeadphonesIcon, Trash, Tv } from "lucide-react"
import { ReactNode, useState } from "react"

interface DownloadedSectionProps {
  downloadedFiles: string[]
  handleRename: (item: string, filename?: string) => void
  handleAction: (torrent: Torrent | string, action: ConfirmTorrentAction | ConfirmDownloadedFileAction) => void
}

function DownloadedSection(props: DownloadedSectionProps) {
  const { downloadedFiles, handleRename, handleAction } = props

  const [showMore, setShowMore] = useState<boolean>(false)

  if (downloadedFiles.length > 0) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-4">Downloaded</h2>
        <div className="space-y-4">
          {downloadedFiles.map((file: string, index: number) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                <h3 className="text-lg font-semibold mb-2 sm:mb-0">{file}</h3>
                <div className="flex space-x-2">
                  <>
                    <FloatButton title="Rename"
                      icon={<Edit className="h-4 w-4" />}
                      onClick={() => handleRename(file)} />
                    <FloatButton title="Move to TV Shows"
                      icon={<Tv className="h-4 w-4" />}
                      onClick={() => handleAction(file, 'files/move/tvshows')} />
                    <FloatButton title="Move to Movies"
                      icon={<Clapperboard className="h-4 w-4" />}
                      onClick={() => handleAction(file, 'files/move/movies')} />
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
                      <FloatButton title="Move to Books"
                        icon={<BookIcon className="h-4 w-4" />}
                        onClick={() => handleAction(file, 'files/move/books')} />
                      <FloatButton title="Move to Music"
                        icon={<HeadphonesIcon className="h-4 w-4" />}
                        onClick={() => handleAction(file, 'files/move/music')} />
                      <FloatButton title="Move to Software"
                        icon={<Binary className="h-4 w-4" />}
                        onClick={() => handleAction(file, 'files/move/software')} />
                    </>
                  }
                  <FloatButton title="Delete"
                    icon={<Trash className="h-4 w-4" />}
                    onClick={() => handleAction(file, 'files/delete')} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  } else {
    return null
  }
}

interface FloatButtonProps {
  title: string
  icon: ReactNode
  onClick: () => void
}

function FloatButton(props: FloatButtonProps) {

  const { title, icon, onClick } = props

  return (
    <FloatBox body={title} hAlign='center' vAlign='bottom'>
      <Button variant="ghost" size="icon" onClick={onClick}>
        {icon}
      </Button>
    </FloatBox>
  )
}


export { DownloadedSection }

