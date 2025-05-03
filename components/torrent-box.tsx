'use client'

import { json_header, serverBaseUrl } from "@/app/config"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DownloadedSection } from "@/components/downloaded-section"
import { RenameDialog } from "@/components/rename-dialog"
import { TorrentBoxHeading } from "@/components/torrent-box-heading"
import { TorrentSearch } from "@/components/torrent-search"
import { TorrentsSection } from "@/components/torrent-section"
import { useLocalStorage } from "@/lib/use-local-storage"
import { ConfirmDownloadedFileAction, ConfirmTorrentAction } from "@/types/actions"
import { Torrent, TorrentData } from "@/types/torrent"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { AlertTriangle } from "lucide-react"
import { useTorrentManager } from "@/hooks/use-torrent-manager"

function TorrentBox() {
  const {
    torrents,
    downloadedFiles,
    connectionError,
    suggestionsLLMOnline,
    fetchTorrents,
    softDeleteTorrentSubFile,
    isSoftDeleted,
    getTorrentSoftDeletedFiles,
    cleanupSoftDeletedFiles,
  } = useTorrentManager()
  const { theme, setTheme } = useTheme()
  const [expandedTorrent, setExpandedTorrent] = useState<string | null>(null)
  const [renameTorrentDialogOpen, setRenameTorrentDialogOpen] = useState(false)
  const [confirmTorrentActionDialogOpen, setConfirmTorrentActionDialogOpen] = useState(false)
  const [confirmDownloadedFileActionDialogOpen, setConfirmDownloadedFileActionDialogOpen] = useState(false)
  const [currentTorrent, setCurrentTorrent] = useState<Torrent | null>(null)
  const [currentTorrentFilename, setCurrentTorrentFilename] = useState<string | null>(null)
  const [currentDownloadedFile, setCurrentDownloadedFile] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [confirmTorrentAction, setConfirmTorrentAction] = useState<ConfirmTorrentAction | null>(null)
  const [confirmDownloadedFileAction, setConfirmDownloadedFileAction] = useState<ConfirmDownloadedFileAction | null>(null)
  const [mounted, setMounted] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useLocalStorage('dont-show-confirm-again', {
    'remove': false,
    'delete': false,
    'files/delete': false,
    'files/move/tvshows': false,
    'files/move/movies': false,
  })

  useEffect(() => {
    setMounted(true)
    fetchTorrents()
    const id = setInterval(fetchTorrents, 1000);
    return () => clearInterval(id);
  }, [])

  const handleRenameTorrent = (item: Torrent, filename?: string) => {
    // Reset state first
    setCurrentDownloadedFile(null)
    setCurrentTorrent(null)
    setCurrentTorrentFilename(null)
    setNewName('')
    setSuggestions([])

    // Set new state
    setCurrentTorrent(item)
    if (filename) {
      setCurrentTorrentFilename(filename)
      setNewName(filename)
    } else {
      setNewName(item.name)
    }

    // Fetch suggestions
    if (filename) {
      fetchTorrentSubFilenameSuggestions(item, filename)
    } else {
      fetchSuggestions(item.name)
    }

    // Open dialog
    setRenameTorrentDialogOpen(true)
  }

  const handleRenameDownloaded = (item: string) => {
    // Reset state first
    setCurrentDownloadedFile(null)
    setCurrentTorrent(null)
    setCurrentTorrentFilename(null)
    setNewName('')
    setSuggestions([])

    // Set new state
    setCurrentDownloadedFile(item)
    setNewName(item)

    // Fetch suggestions
    fetchSuggestions(item)

    // Open dialog
    setRenameTorrentDialogOpen(true)
  }

  const escapeName = (name: string): string => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const getTorrentSubFilename = (torrentName: string, filename: string): string =>
    filename.replace(new RegExp(`^${torrentName}/`), '')

  const fetchTorrentSubFilenameSuggestions = async (torrent: Torrent, filename: string) => {
    try {
      const name = torrent.name
      const escapedName = escapeName(name)
      const suggestionFilename = getTorrentSubFilename(escapedName, filename)
      fetchSuggestions(suggestionFilename)
    } catch (error) {
      console.log("Error fetching torrent subfile suggestions:", error)
      toast({
        title: "Error",
        description: "Failed to get filename suggestions"
      })
    }
  }

  const fetchSuggestions = async (filename: string) => {
    try {
      if (!suggestionsLLMOnline) {
        setSuggestions([])
        return
      }

      const response = await fetch(
        `${serverBaseUrl}/torrents/suggest_names`,
        {
          method: 'POST',
          body: JSON.stringify({ filename: filename }),
          headers: json_header
        }
      )

      if (!response.ok) {
        console.log(`Network error fetching suggestions: ${response.status}`)
        toast({ title: `Network Error`, description: `Failed to get suggestions (${response.status})` })
        setSuggestions([])
        return
      }

      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch (error) {
      console.log("Error fetching suggestions:", error)
      toast({
        title: "Suggestions Error",
        description: "Failed to get name suggestions"
      })
      setSuggestions([])
    }
  }

  const confirmTorrentActionDescriptions = {
    'remove': 'This will deactivate the torrent and remove it from the list. Downloaded files will be kept.',
    'delete': 'This will delete the torrent completely.',
  }

  const confirmDownloadedFileActionDescriptions = {
    'files/delete': 'Delete the downloaded files',
    'files/move/movies': 'Move downloaded files to the Movies folder.',
    'files/move/tvshows': 'Move downloaded files to the TV shows folder.',
  }

  const confirmRenameDownloadedFile = async () => {
    if (!currentDownloadedFile) return

    try {
      // TODO: Add call to api for renaming a downloaded file.
      toast({
        title: "Not implemented",
        description: "Renaming downloaded files is not yet implemented"
      })
    } catch (error) {
      console.log("Error renaming downloaded file:", error)
      toast({
        title: "Error",
        description: "Failed to rename downloaded file"
      })
    }
  }

  const confirmRename = async () => {
    if (currentDownloadedFile) {
      await confirmRenameDownloadedFile()
      setRenameTorrentDialogOpen(false)
      return
    }

    if (currentTorrent) {
      const filename = currentTorrentFilename || currentTorrent.name
      const torrentId = currentTorrent.id

      const payload = {
        filename,
        newname: newName,
        torrent_id: torrentId
      }

      try {
        const response = await fetch(
          `${serverBaseUrl}/torrents/active/rename`,
          {
            method: 'POST',
            headers: json_header,
            body: JSON.stringify(payload),
          }
        )

        if (!response.ok) {
          console.log(`Network error renaming torrent: ${response.status}`)
          toast({
            title: "Network Error",
            description: `Failed to rename torrent (${response.status})`
          })
        } else {
          toast({
            title: "Success",
            description: "Torrent renamed successfully"
          })
        }
      } catch (error) {
        console.log("Error renaming torrent:", error)
        toast({
          title: "Error",
          description: "Failed to rename torrent"
        })
      }
    }

    // Always clean up and fetch the latest torrents
    setCurrentDownloadedFile(null)
    setCurrentTorrent(null)
    setCurrentTorrentFilename(null)
    setNewName('')
    setSuggestions([])
    setRenameTorrentDialogOpen(false)
    fetchTorrents()
  }

  const torrentActionRequest = async (action: ConfirmTorrentAction, files: string[] = []) => {
    if (!currentTorrent) return

    try {
      const torrent_id = currentTorrent.id
      const response = await fetch(
        `${serverBaseUrl}/torrents/active/${action}?torrent_id=${torrent_id}`,
        { headers: json_header }
      )

      if (!response.ok) {
        console.log(`Network error performing torrent action: ${response.status}`)
        toast({
          title: "Network Error",
          description: `Failed to ${action} torrent (${response.status})`
        })
        return
      }

      if (files && files.length > 0) {
        await cleanupSoftDeletedFiles(currentTorrent.id, currentTorrent.name, files)
      }

      toast({
        title: "Success",
        description: `Torrent ${action} completed`
      })
    } catch (error) {
      const correctedAction = action.substring(0, action.length - 1)
      console.log(`Error ${correctedAction}ing torrent:`, error)
      toast({
        title: "Error",
        description: `Failed to ${correctedAction} torrent`
      })
    } finally {
      fetchTorrents()
    }
  }

  const downloadedFilesActionRequest = async (action: ConfirmDownloadedFileAction) => {
    if (!currentDownloadedFile) return

    try {
      const response = await fetch(
        `${serverBaseUrl}/torrents/${action}?filename=${currentDownloadedFile}`,
        { headers: json_header }
      )

      if (!response.ok) {
        console.log(`Network error performing file action: ${response.status}`)
        toast({
          title: "Network Error",
          description: `Failed to ${action} file (${response.status})`
        })
        return
      }

      toast({
        title: "Success",
        description: `File action ${action} completed`
      })
    } catch (error) {
      console.log(`Error performing ${action} on file:`, error)
      toast({
        title: "Error",
        description: `Failed to perform ${action} on file`
      })
    } finally {
      fetchTorrents()
    }
  }

  const executeTorrentAction = async (action: ConfirmTorrentAction) => {
    if (currentTorrent) {
      if (action === 'remove') {
        const files = getTorrentSoftDeletedFiles(currentTorrent)
        await torrentActionRequest(action, files)
      } else {
        await torrentActionRequest(action)
      }
    }
    setConfirmTorrentActionDialogOpen(false)
  }

  const executeDownloadedFileAction = async (action: ConfirmDownloadedFileAction) => {
    if (currentDownloadedFile) {
      await downloadedFilesActionRequest(action)
    }
    setConfirmDownloadedFileActionDialogOpen(false)
  }

  const handleAction = (item: Torrent | string, action: ConfirmTorrentAction | ConfirmDownloadedFileAction) => {
    // Reset current selections
    setCurrentDownloadedFile(null)
    setCurrentTorrent(null)

    if (typeof item === 'string') {
      setCurrentDownloadedFile(item)
      setConfirmDownloadedFileAction(action as ConfirmDownloadedFileAction)
      if (dontShowAgain[action]) {
        executeDownloadedFileAction(action as ConfirmDownloadedFileAction)
      } else {
        setConfirmDownloadedFileActionDialogOpen(true)
      }
    } else {
      setCurrentTorrent(item)
      setConfirmTorrentAction(action as ConfirmTorrentAction)
      if (dontShowAgain[action]) {
        executeTorrentAction(action as ConfirmTorrentAction)
      } else {
        setConfirmTorrentActionDialogOpen(true)
      }
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedTorrent(expandedTorrent === id ? null : id)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <TorrentBoxHeading theme={theme} setTheme={setTheme} />
      <main className="flex-grow p-4 overflow-auto">
        {connectionError ? (
          <div className="flex flex-col items-center justify-center h-64 p-6 space-y-4 border rounded-lg border-destructive/50 bg-destructive/10">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <div className="text-center">
              <h3 className="text-lg font-medium">Media Server Not Connected</h3>
              <p className="text-sm text-muted-foreground">
                Unable to connect to the media server. Please check your connection and try again.
              </p>
            </div>
            <button
              onClick={fetchTorrents}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <TorrentSearch />
            <TorrentsSection
              torrents={torrents}
              expandedTorrent={expandedTorrent}
              toggleExpand={toggleExpand}
              handleAction={handleAction}
              handleRename={handleRenameTorrent}
              handleSoftDelete={softDeleteTorrentSubFile}
              isSoftDeletedFn={isSoftDeleted}
            />
            <DownloadedSection
              downloadedFiles={downloadedFiles}
              handleAction={handleAction}
              handleRename={handleRenameDownloaded}
            />
          </div>
        )}
      </main>

      <RenameDialog
        title="Rename Torrent"
        open={renameTorrentDialogOpen}
        onOpenChange={setRenameTorrentDialogOpen}
        newName={newName}
        setNewName={setNewName}
        suggestions={suggestions}
        suggestionsServiceOnline={suggestionsLLMOnline}
        onConfirm={confirmRename}
        onCancel={() => {
          setCurrentDownloadedFile(null)
          setCurrentTorrent(null)
          setCurrentTorrentFilename(null)
          setNewName('')
          setSuggestions([])
          setRenameTorrentDialogOpen(false)
        }}
      />

      <ConfirmDialog
        confirmDialogOpen={confirmTorrentActionDialogOpen}
        setConfirmDialogOpen={setConfirmTorrentActionDialogOpen}
        confirmAction={confirmTorrentAction}
        executeAction={executeTorrentAction}
        dontShowAgain={dontShowAgain}
        setDontShowAgain={setDontShowAgain}
        alertDescriptions={confirmTorrentActionDescriptions}
      />

      <ConfirmDialog
        confirmDialogOpen={confirmDownloadedFileActionDialogOpen}
        setConfirmDialogOpen={setConfirmDownloadedFileActionDialogOpen}
        confirmAction={confirmDownloadedFileAction}
        executeAction={executeDownloadedFileAction}
        dontShowAgain={dontShowAgain}
        setDontShowAgain={setDontShowAgain}
        alertDescriptions={confirmDownloadedFileActionDescriptions}
      />
    </div>
  )
}

export default TorrentBox