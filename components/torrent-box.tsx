'use client'

import { json_header, serverBaseUrl } from "@/app/config"
import { DownloadedSection } from "@/components/downloaded-section"
import { RenameDialog } from "@/components/rename-dialog"
import { TorrentBoxHeading } from "@/components/torrent-box-heading"
import { TorrentSearch } from "@/components/torrent-search"
import { TorrentsSection } from "@/components/torrent-section"
import { ConnectionErrorPanel } from "@/components/connection-error-panel"
import { DestructiveDownloadedFileAction, DestructiveTorrentAction } from "@/types/actions"
import { Torrent } from "@/types/torrent"
import { useTheme } from "next-themes"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTorrentManager } from "@/hooks/use-torrent-manager"
import { toast } from "sonner"
import { useLeadingEdgeDebounce } from "@/lib/debounce"

function TorrentBox() {
  const { theme, setTheme } = useTheme()
  const [expandedTorrent, setExpandedTorrent] = useState<string | null>(null)
  const [renameTorrentDialogOpen, setRenameTorrentDialogOpen] = useState(false)
  const [currentActionType, setCurrentActionType] = useState<'torrent' | 'downloadedFile' | null>(null);
  const [currentTorrent, setCurrentTorrent] = useState<Torrent | null>(null)
  const [currentTorrentFilename, setCurrentTorrentFilename] = useState<string | null>(null)
  const [currentDownloadedFile, setCurrentDownloadedFile] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [suggestions, setSuggestions] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)
  const [action, setAction] = useState<DestructiveTorrentAction | DestructiveDownloadedFileAction | null>(null);
  const actionInProgress = useRef(false);

  const {
    torrents,
    downloadedFiles,
    connectionError,
    suggestionsLLMOnline,
    fetchTorrents,
    softDeleteTorrentSubFile,
    isSoftDeleted,
    cleanupSoftDeletedFiles,
    renameTorrent,
  } = useTorrentManager()

  useEffect(() => {
    setMounted(true)
    fetchTorrents()
  }, [fetchTorrents])

  const resetState = () => {
    setCurrentDownloadedFile(null)
    setCurrentTorrent(null)
    setCurrentTorrentFilename(null)
    setNewName('')
    setSuggestions(new Set())
  }

  const handleRenameTorrent = (item: Torrent, filename?: string) => {
    resetState()
    setCurrentTorrent(item)

    if (filename) {
      setCurrentTorrentFilename(filename)
      setNewName(filename)
    } else {
      setNewName(item.name)
    }

    setRenameTorrentDialogOpen(true)
  }

  const handleRenameDownloaded = (item: string) => {
    resetState()
    setCurrentDownloadedFile(item)
    setNewName(item)
    setRenameTorrentDialogOpen(true)
  }

  const escapeName = (name: string): string => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const getTorrentSubFilename = (torrentName: string, filename: string): string =>
    filename.replace(new RegExp(`^${torrentName}/`), '')

  const fetchSuggestions = useCallback(async (filename: string) => {
    try {
      if (!suggestionsLLMOnline) {
        setSuggestions(new Set())
        return
      }

      const response = await fetch(
        `${serverBaseUrl}/llm/suggest_names`,
        {
          method: 'POST',
          body: JSON.stringify({ filename: filename }),
          headers: json_header
        }
      )

      if (!response.ok) {
        console.log(`Network error fetching suggestions: ${response.status}`)
        toast(`Failed to get suggestions (${response.status})`)
        setSuggestions(new Set())
        return
      }

      const data = await response.json()
      const suggestions = new Set<string>(data.suggestions)
      setSuggestions(suggestions)
    } catch (error) {
      console.log("Error fetching suggestions:", error)
      toast("Failed to get name suggestions")
      setSuggestions(new Set())
    }
  }, [suggestionsLLMOnline])

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

    if (!renameTorrentDialogOpen) return

    if (currentTorrent && currentTorrentFilename) {
      fetchTorrentSubFilenameSuggestions(currentTorrent, currentTorrentFilename)
    } else if (currentTorrent?.name) {
      fetchSuggestions(currentTorrent.name)
    }
  }, [renameTorrentDialogOpen, currentTorrent, currentTorrentFilename, fetchSuggestions])

  useEffect(() => {
    if (!renameTorrentDialogOpen || !currentDownloadedFile || !newName) return

    fetchSuggestions(currentDownloadedFile)
  }, [renameTorrentDialogOpen, currentDownloadedFile, newName, fetchSuggestions])

  const confirmRenameDownloadedFile = async () => {
    if (!currentDownloadedFile) return

    try {
      const response = await fetch(`${serverBaseUrl}/torrents/downloaded/rename`, {
        method: 'POST',
        headers: json_header,
        body: JSON.stringify({
          filename: currentDownloadedFile,
          newname: newName
        })
      })
      if (response.ok) {
        toast(`Renamed ${currentDownloadedFile} to ${newName}`)
      }
    } catch (error) {
      console.log("Error renaming downloaded file:", error)
      toast(`Failed to rename ${currentDownloadedFile}`)
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
      await renameTorrent(currentTorrent, filename, newName)
    }

    resetState()
    setRenameTorrentDialogOpen(false)
  }

  const executeTorrentAction = useCallback(
    async (action: DestructiveTorrentAction, files: string[] = []) => {
      if (!currentTorrent) return;

      try {
        const torrent_id = currentTorrent.id;
        const response = await fetch(
          `${serverBaseUrl}/torrents/active/${action}?torrent_id=${torrent_id}`,
          { headers: json_header }
        );

        if (!response.ok) {
          console.log(`Network error performing torrent action: ${response.status}`);
          toast(`Failed to ${action} torrent (${response.status})`);
          return;
        }

        if (files && files.length > 0) {
          await cleanupSoftDeletedFiles(currentTorrent.id, currentTorrent.name, files);
        }

        toast(`Torrent ${action} completed`);
      } catch (error) {
        const correctedAction = action.substring(0, action.length - 1);
        console.log(`Error ${correctedAction}ing torrent:`, error);
        toast(`Failed to ${action} torrent`);
      }
    },
    [currentTorrent, cleanupSoftDeletedFiles] // Dependencies for memoization
  );

  const executeDownloadedFileAction = useCallback(
    async (action: DestructiveDownloadedFileAction) => {
      if (!currentDownloadedFile) return;

      try {
        const response = await fetch(
          `${serverBaseUrl}/torrents/${action}?filename=${currentDownloadedFile}`,
          { headers: json_header }
        );

        if (!response.ok) {
          console.log(`Network error performing file action: ${response.status}`);
          toast(`Failed to ${action} file (${response.status})`);
          return;
        }

        toast(`File action ${action} completed`);
      } catch (error) {
        console.log(`Error performing ${action} on file:`, error);
        toast(`Failed to perform ${action} on file`);
      }
    },
    [currentDownloadedFile]
  );

  const cancelRenameTorrent = () => {
    resetState()
    setRenameTorrentDialogOpen(false)
  }

  useEffect(() => {
    console.log('Effect Triggered - actionInProgress:', actionInProgress.current);

    const executeAction = () => {
      if (!currentActionType || (!currentDownloadedFile && !currentTorrent) || actionInProgress.current) {
        console.log('Exiting Effect: actionInProgress:', actionInProgress.current);
        if (actionInProgress.current) return
        return;
      }

      console.log('Starting action execution');
      actionInProgress.current = true; // Mark as in-progress

      try {
        console.log('Action started for type:', currentActionType);
        switch (currentActionType) {
          case 'downloadedFile':
            if (currentDownloadedFile && action) {
              executeDownloadedFileAction(action as DestructiveDownloadedFileAction);
            }
            break;
          case 'torrent':
            if (currentTorrent && action) {
              executeTorrentAction(action as DestructiveTorrentAction);
            }
            break;
          default:
            break;
        }
      } catch (error) {
        console.error("Error executing action:", error);
      } finally {
        actionInProgress.current = false; // Reset flag after action completes
        console.log('Action completed, actionInProgress reset.');
      }
    };

    executeAction(); // Execute action
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentActionType, action]);

  const handleAction = useLeadingEdgeDebounce((item: Torrent | string, action: DestructiveTorrentAction | DestructiveDownloadedFileAction) => {
    if (typeof item === 'string') {
      console.log(`Downloaded File Action: ${action} ... ${item}`)
      toast(`${action.substring(0,1).toUpperCase()}${action.substring(1)} ${item}`)
      setAction(action);
      setCurrentDownloadedFile(item);
      setCurrentActionType('downloadedFile');
      fetchTorrents()
    }

    if (typeof item === 'object') {
      const torrent: Torrent = item as Torrent;
      if (torrent.id) {
        console.log(`Torrent Action: ${action} ... ${torrent.name}`)
        toast(`${action.substring(0,1).toUpperCase()}${action.substring(1)} ${torrent.name}`)
        setAction(action);
        setCurrentTorrent(torrent);
        setCurrentActionType('torrent');
        fetchTorrents()
      }
    }
  }, 1300);

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
          <ConnectionErrorPanel fetchTorrents={fetchTorrents} />
        ) : (
          <div className="space-y-8">
            <TorrentSearch fetchTorrents={fetchTorrents} />
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
      </main >

      <RenameDialog
        title="Rename Torrent"
        open={renameTorrentDialogOpen}
        onOpenChange={setRenameTorrentDialogOpen}
        newName={newName}
        setNewName={setNewName}
        suggestions={Array.from(suggestions)}
        suggestionsServiceOnline={suggestionsLLMOnline}
        onConfirm={confirmRename}
        onCancel={cancelRenameTorrent}
      />
    </div >
  )
}

export default TorrentBox
