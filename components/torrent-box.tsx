'use client'

import { serverBaseUrl } from "@/app/config"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DemoPanel } from "@/components/demo-panel"
import { DownloadedSection } from "@/components/downloaded-section"
import { RenameDialog } from "@/components/rename-dialog"
import { TorrentBoxHeading } from "@/components/torrent-box-heading"
import { TorrentSearch } from "@/components/torrent-search"
import { TorrentsSection } from "@/components/torrent-section"
import { generateFakeDownloaded, generateFakeSuggestions, generateFakeTorrents } from "@/demo/fake"
import { useLocalStorage } from "@/lib/use-local-storage"
import { ConfirmDownloadedFileAction, ConfirmTorrentAction } from "@/types/actions"
import { SoftDeletedFile } from "@/types/soft-deleted-file"
import { Torrent, TorrentData } from "@/types/torrent"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

function TorrentBox() {
  const {theme, setTheme } = useTheme()
  const [torrents, setTorrents] = useState<Torrent[]>([])
  const [torrentSoftDeletedFiles, setTorrentSoftDeletedFiles] = useLocalStorage('soft-deleted-files', [])
  const [downloadedFiles, setDownloadedFiles] = useState<string[]>([])
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
  const [connectionError, setConnectionError] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [suggestionsLLMOnline, setSuggestionsLLMOnline] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useLocalStorage('dont-show-confirm-again', {
    'remove': false,
    'delete': false,
    'files/delete': false,
    'files/move/tvshows': false,
    'files/move/movies': false,
  })

  useEffect(() => {
    setMounted(true)
    if (!isDemo) {
      fetchTorrents()
      const id = setInterval(fetchTorrents, 1000);
      return () => clearInterval(id);
    } else {
      setTorrents(generateFakeTorrents())
      setDownloadedFiles(generateFakeDownloaded())
    }
  }, [isDemo])

  const fetchTorrents = async () => {
    fetchSuggestNamesStatus()
    try {
      const response = await fetch(
        `${serverBaseUrl}/torrents/active`,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data: TorrentData = await response.json()
      const fetchedTorrents: Torrent[] = await data.downloading.map(t => new Torrent(t))
      setTorrents(fetchedTorrents)
      fetchedTorrents.forEach(t => t.notifyCompletion())
      setDownloadedFiles(data.downloaded)
      setConnectionError(false)
    } catch (error) {
      console.error('Error fetching torrents:', error)
      setConnectionError(true)
    }
  }

  const isSoftDeleted = (hash: string, index: number) => torrentSoftDeletedFiles.findIndex((e: SoftDeletedFile) => e.torrent == hash && e.fileIndex == index) != -1

  const softDeleteTorrentSubFile = (torrent: Torrent, filename: string) => {
    const index = torrent.files.findIndex(f => f[0] == filename)
    const hash = torrent.id

    if (!isSoftDeleted(hash, index)) {
      setTorrentSoftDeletedFiles([...torrentSoftDeletedFiles, new SoftDeletedFile(hash, index)])
    }
  }

  const getTorrentSoftDeletedFiles = (torrent: Torrent): string[] => {
    const torrentName = torrent.name
    const indexes = torrentSoftDeletedFiles.
      filter((e: SoftDeletedFile) => e.torrent == torrent.id).
      map((e: SoftDeletedFile) => e.fileIndex)
    const fileNames = torrent.files.
      filter((e, index) => indexes.indexOf(index) != -1).
      map((e) => e[0]) // get the name of file

    return fileNames
  }

  const handleRenameTorrent = (item: Torrent, filename?: string) => {
    handleRename(item, filename)
  }

  const handleRenameDownloaded = (item: string) => {
    handleRename(item)
  }

  const handleRename = (item: Torrent | string, filename?: string) => {
    setRenameTorrentDialogOpen(true)
    if (typeof item === 'string') {
      setCurrentDownloadedFile(item)
      setCurrentTorrent(null)
      setCurrentTorrentFilename(null)
      setNewName(item)
    } else {
      if (filename) {
        setCurrentTorrentFilename(filename)
      }
      setCurrentTorrent(item)
      setCurrentDownloadedFile(null)
      setNewName(filename || item.name)
    }
    if (!isDemo) {
      if (currentTorrentFilename && currentTorrent) {
        fetchTorrentSubFilenameSuggestions(currentTorrent, currentTorrentFilename)
      } else {
        fetchSuggestions(
          filename || (typeof item === 'string' ? item : item.name)
        )
      }
    } else {
      setSuggestions(
        generateFakeSuggestions(
          filename || (typeof item === 'string' ? item : item.name)
        )
      )
    }
  }

  const escapeName = (name: string): string => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const getTorrentSubFilename = (torrentName: string, filename: string): string => filename.replace(new RegExp(`^${torrentName}/`), '')

  const fetchSuggestNamesStatus = async () => {
    const response = await fetch(`${serverBaseUrl}/torrents/suggest_names/status`)
    setSuggestionsLLMOnline(response.status == 200)
  }

  const fetchTorrentSubFilenameSuggestions = async (torrent: Torrent, filename: string) => {
    const name = torrent.name
    const escapedName = escapeName(name)
    const suggestionFilename = getTorrentSubFilename(escapedName, filename)
    fetchSuggestions(suggestionFilename)
  }

  const fetchSuggestions = async (filename: string) => {
    setNewName(filename)
    try {
      const response = await fetch(
        `${serverBaseUrl}/torrents/suggest_names`,
        {
          method: 'POST',
          body: JSON.stringify({ filename: filename }),
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      setSuggestions(data.suggestions)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
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

  const confirmRenameDownloadedFile = () => {
    if (currentDownloadedFile) {
      // TODO: Add call to api for renaming a downloaded file.
    }
  }

  const confirmRename = async () => {
    if (currentDownloadedFile) {
      confirmRenameDownloadedFile()
      return
    }
    if (currentTorrent) {
      if (!isDemo) {
        const filename = currentTorrentFilename ||
          currentTorrent?.name

        const payload = {
          filename,
          newname: newName,
          torrent_id: currentTorrent.id
        }

        try {
          const response = await fetch(
            `${serverBaseUrl}/torrents/active/rename`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }
          );

          if (!response.ok) {
            throw new Error('Network response was not ok');
          }

          setCurrentDownloadedFile(null)
          setCurrentTorrent(null)
          setCurrentTorrentFilename(null)
          setNewName('')
          setSuggestions([])

          fetchTorrents(); // Fetch updated torrents
        } catch (error) {
          console.error('Error renaming torrent:', error);
        }
      }
    }
    setRenameTorrentDialogOpen(false); // Close the rename dialog
  };

  const handleAction = (item: Torrent | string, action: ConfirmTorrentAction | ConfirmDownloadedFileAction) => {
    if (typeof item === 'string') {
      setCurrentDownloadedFile(item)
      setCurrentTorrent(null)
      setConfirmDownloadedFileAction(action as ConfirmDownloadedFileAction)
      if (dontShowAgain[action]) {
        executeDownloadedFileAction(action as ConfirmDownloadedFileAction)
      } else {
        setConfirmDownloadedFileActionDialogOpen(true)
      }
    } else {
      setCurrentTorrent(item)
      setCurrentDownloadedFile(null)
      setConfirmTorrentAction(action as ConfirmTorrentAction)
      if (dontShowAgain[action]) {
        executeTorrentAction(action as ConfirmTorrentAction)
      } else {
        setConfirmTorrentActionDialogOpen(true)
      }
    }
  }

  const cleanupSoftDeletedFiles = async (torrent_id: string, name: string, files: string[]) => {
    const response = await fetch(
      `${serverBaseUrl}/torrents/cleanup`,
      {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ torrent_id, files, name })
      }
    )

    // Response contains:
    // "info": "Ran torrent files cleanup, removed soft deleted files. Check failed_to_delete for failures",
    // "name": torrent_name,
    // "torrent_id": torrent_id,
    // "files": files that were to be deleted
    // "failed_to_delete": files to delete list of failures

    if (response.ok) {
      // get soft deleted files from local storage
      var allSoftDeleted = null
      try {
        allSoftDeleted = localStorage.getItem('soft-deleted-files')
      } catch (e) {
        console.error('Error getting soft deleted files from local storage')
        console.error(e)
      }
      // remove entries for torrent
      if (allSoftDeleted) {
        const softDeleted = JSON.parse(allSoftDeleted)
        const cleanedSoftDeleted = softDeleted.filter((e: SoftDeletedFile) => e.torrent != torrent_id)
        localStorage.setItem('soft-deleted-files', cleanedSoftDeleted)
      }
    }
  }

  const torrentActionRequest = async (action: ConfirmTorrentAction, files: string[] = []) => {
    if (currentTorrent) {
      try {
        const torrent_id = currentTorrent.id
        const response = await fetch(
          `${serverBaseUrl}/torrents/active/${action}?torrent_id=${torrent_id}`,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        )

        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        if (files) {
          cleanupSoftDeletedFiles(currentTorrent.id, currentTorrent.name, files)
        }
        fetchTorrents()
      } catch (error) {
        console.error(`Error ${action}ing torrent:`, error)
      }
    }
  }

  const downloadedFilesActionRequest = async (action: ConfirmDownloadedFileAction) => {
    if (currentDownloadedFile) {
      try {
        const response = await fetch(
          `${serverBaseUrl}/torrents/${action}?filename=${currentDownloadedFile}`,
          { headers: { 'Content-Type': 'application/json' } })

        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        fetchTorrents()
      } catch (error) {
        console.error(`Error ${action}ing torrent:`, error)
      }
    }
  }

  const executeTorrentAction = async (action: ConfirmTorrentAction) => {
    if (currentTorrent) {
      if (!isDemo) {
        if (action == 'remove') {
          const files = getTorrentSoftDeletedFiles(currentTorrent)
          torrentActionRequest(action, files)
        } else {
          torrentActionRequest(action)
        }
      }
      setTorrents(torrents.filter(t => t.id !== currentTorrent.id))
    }
    setConfirmTorrentActionDialogOpen(false)
  }


  const executeDownloadedFileAction = async (action: ConfirmDownloadedFileAction) => {
    if (currentDownloadedFile) {
      if (!isDemo) {
        downloadedFilesActionRequest(action)
      } else {
        setDownloadedFiles(downloadedFiles.filter(f => f !== currentDownloadedFile))
      }
    }
    setConfirmDownloadedFileActionDialogOpen(false)
  }

  const toggleExpand = (id: string) => {
    setExpandedTorrent(expandedTorrent === id ? null : id)
  }

  const startDemo = () => {
    setIsDemo(true)
    setConnectionError(false)
    setTorrents(generateFakeTorrents())
    setDownloadedFiles(generateFakeDownloaded())
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <TorrentBoxHeading theme={theme} setTheme={setTheme} />
      <main className="flex-grow p-4 overflow-auto">
        {connectionError ? (
          <DemoPanel tryAgain={fetchTorrents} startDemo={startDemo} />
        ) : (
          <div className="space-y-8">
            <TorrentSearch />
            <TorrentsSection
              torrents={torrents}
              expandedTorrent={expandedTorrent}
              toggleExpand={toggleExpand}
              handleAction={handleAction}
              handleRename={handleRename}
              handleSoftDelete={softDeleteTorrentSubFile}
              isSoftDeletedFn={isSoftDeleted}
            />
            <DownloadedSection
              downloadedFiles={downloadedFiles}
              handleAction={handleAction}
              handleRename={handleRename}
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
