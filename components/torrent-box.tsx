import { DownloadedSection } from "@/components/downloaded-section"
import { RenameDialog } from "@/components/rename-dialog"
import { TorrentBoxHeading } from "@/components/torrent-box-heading"
import { TorrentSearch } from "@/components/torrent-search"
import { TorrentsSection } from "@/components/torrent-section"
import { ConnectionErrorPanel } from "@/components/connection-error-panel"
import { Torrent } from "@/types/torrent"
import { type FC, useEffect, useState } from "react"
import { toast } from "sonner"
import { useTransmissionContext } from "@/contexts/transmission-provider"
import { Dialog, DialogContent } from "@radix-ui/react-dialog"
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const TorrentBox: FC = () => {
  const [mounted, setMounted] = useState(false)

  const {
    connectionError,
    suggestionsLLMOnline,
    fetchTorrents,
    fetchSuggestions,
    confirmRename,
    cancelRenameTorrent,
    renameDialogOpen,
    setRenameDialogOpen,
    setShowTVShowRenameDialog,
    showTVShowRenameDialog,
    currentTorrent,
    currentTorrentFilename,
    currentDownloadedFile,
    newName,
    setNewName,
    suggestions,
  } = useTransmissionContext()

  useEffect(() => {
    setMounted(true)
    fetchTorrents()
  }, [fetchTorrents])

  const escapeName = (name: string): string => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const getTorrentSubFilename = (torrentName: string, filename: string): string =>
    filename.replace(new RegExp(`^${torrentName}/`), '')

  useEffect(() => {
    const fetchTorrentSubFilenameSuggestions = async (torrent: Torrent, filename: string) => {
      try {
        const name = torrent.name
        const escapedName = escapeName(name)
        const suggestionFilename = getTorrentSubFilename(escapedName, filename)
        fetchSuggestions(suggestionFilename)
      } catch (error) {
        console.log("Error fetching torrent subfile suggestions:", error)
        toast("Failed to get filename suggestions")
      }
    }

    if (!renameDialogOpen) return

    if (currentTorrent && currentTorrentFilename) {
      fetchTorrentSubFilenameSuggestions(currentTorrent, currentTorrentFilename)
    } else if (currentTorrent?.name) {
      fetchSuggestions(currentTorrent.name)
    }
  }, [renameDialogOpen, currentTorrent, currentTorrentFilename, fetchSuggestions])

  useEffect(() => {
    if (!renameDialogOpen || !currentDownloadedFile || !newName) return

    fetchSuggestions(currentDownloadedFile)
  }, [renameDialogOpen, currentDownloadedFile, newName, fetchSuggestions])


  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-background/90 text-foreground">
      <TorrentBoxHeading />
      <main className="flex-grow p-4 overflow-auto">
        {connectionError ? (
          <ConnectionErrorPanel fetchTorrents={fetchTorrents} />
        ) : (
          <div className="space-y-8">
            <TorrentSearch fetchTorrents={fetchTorrents} />
            <TorrentsSection />
            <DownloadedSection />
          </div>
        )}
      </main >
      <RenameDialog
        title="Rename Torrent"
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        newName={newName}
        setNewName={setNewName}
        suggestions={Array.from(suggestions)}
        suggestionsServiceOnline={suggestionsLLMOnline}
        onConfirm={confirmRename}
        onCancel={cancelRenameTorrent}
      />
      {showTVShowRenameDialog &&
        (
          <Dialog open={showTVShowRenameDialog} onOpenChange={setShowTVShowRenameDialog}>
            <DialogContent>
              <DialogDescription style={{ 'display': 'none' }}>Rename</DialogDescription>
              <DialogHeader>
                <DialogTitle>
                  <div className="flex flex-row items-center justify-start gap-2">
                    title
                  </div>
                </DialogTitle>
              </DialogHeader>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => (e.code == "Enter") && setShowTVShowRenameDialog(false)}
              />

              <div className='grid grid-cols-1 gap-0'>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTVShowRenameDialog(false)}>Cancel</Button>
                <Button onClick={() => setShowTVShowRenameDialog(false)}>Rename show files</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }
    </div >
  )
}
