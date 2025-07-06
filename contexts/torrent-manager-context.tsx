import { json_header, serverBaseUrl } from '@/app/config';
import { useLeadingEdgeDebounce } from '@/lib/debounce';
import { useLocalStorage } from '@/lib/use-local-storage';
import { notifyCompletion } from '@/lib/utils';
import type { DestructiveDownloadedFileAction, DestructiveTorrentAction } from '@/types/actions';
import { type SoftDeletedFileType, SoftDeletedFile } from '@/types/soft-deleted-file';
import { Torrent, TorrentData } from '@/types/torrent';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner';

interface TorrentManagerContextType {
  torrents: Torrent[]
  downloadedFiles: string[]
  connectionError: boolean
  suggestionsLLMOnline: boolean
  fetchTorrents: () => void
  fetchSuggestions: (filename: string) => Promise<void>
  isSoftDeleted: (hash: string, index: number) => boolean
  softDeleteTorrentSubFile: (torrent: Torrent, filename: string) => void
  getTorrentSoftDeletedFiles: (torrent: Torrent) => void
  cleanupSoftDeletedFiles: (torrent_id: string, name: string, files: string[]) => void
  handleAction: (item: Torrent | string,  action: DestructiveDownloadedFileAction | DestructiveTorrentAction) => void
  handleRenameDownloaded: (item: string) => void
  handleRenameTorrent: (torrent: Torrent, filename?: string) => void
  confirmRename: () => void
  cancelRenameTorrent: () => void
  renameTorrent: (torrent: Torrent, currentFilename: string, newName: string) => void
  confirmRenameDownloadedFile: () => void
  resetState: () => void
  toggleExpand: (id: string) => void
  expandedTorrent: string | null
  setExpandedTorrent: Dispatch<SetStateAction<string | null>>
  renameDialogOpen: boolean
  setRenameDialogOpen: Dispatch<SetStateAction<boolean>>
  action: DestructiveTorrentAction | DestructiveDownloadedFileAction | null
  setAction: Dispatch<SetStateAction<DestructiveTorrentAction | DestructiveDownloadedFileAction | null>>
  currentActionType: 'torrent' | 'downloadedFile' | null
  setCurrentActionType: Dispatch<SetStateAction<'torrent' | 'downloadedFile' | null | null>>
  currentTorrent: Torrent | null
  setCurrentTorrent: Dispatch<SetStateAction<Torrent | null>>
  currentTorrentFilename: string | null
  setCurrentTorrentFilename: Dispatch<SetStateAction<string | null>>
  currentDownloadedFile: string | null
  setCurrentDownloadedFile: Dispatch<SetStateAction<string | null>>
  newName: string
  setNewName: Dispatch<SetStateAction<string>>
  suggestions: Set<string>
  setSuggestions: Dispatch<SetStateAction<Set<string>>>
}

export const useTorrentManagerContext = (): TorrentManagerContextType => {
  const context = useContext(TorrentManagerContext)
  if (!context) {
    throw new Error("useTorrentManagerContext must be used within a TorrentManagerProvider")
  }
  return context
}

const TorrentManagerContext = createContext<TorrentManagerContextType | undefined>(undefined);

export const TorrentManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [torrents, setTorrents] = useState<Torrent[]>([])
  const [downloadedFiles, setDownloadedFiles] = useState<string[]>([])
  const [torrentSoftDeletedFiles, setTorrentSoftDeletedFiles] = useLocalStorage('soft-deleted-files', [])
  const [connectionError, setConnectionError] = useState(false)
  const [suggestionsLLMOnline, setSuggestionsLLMOnline] = useState(false)
  const [expandedTorrent, setExpandedTorrent] = useState<string | null>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [currentActionType, setCurrentActionType] = useState<'torrent' | 'downloadedFile' | null>(null);
  const [currentTorrent, setCurrentTorrent] = useState<Torrent | null>(null)
  const [currentTorrentFilename, setCurrentTorrentFilename] = useState<string | null>(null)
  const [currentDownloadedFile, setCurrentDownloadedFile] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [suggestions, setSuggestions] = useState<Set<string>>(new Set())
  const [action, setAction] = useState<DestructiveTorrentAction | DestructiveDownloadedFileAction | null>(null);
  const actionInProgress = useRef(false);

  const fetchTorrents = useLeadingEdgeDebounce(async () => {
    try {
      const res = await fetch(
        `${serverBaseUrl}/torrents/active`,
        { headers: json_header })
      if (!res.ok) {
        toast.error(`Failed to fetch torrents (${res.status})`)
        setConnectionError(true)
        return
      }
      const data: TorrentData = await res.json()
      const newTorrents = data.downloading.map(t => new Torrent(t))
      setTorrents(newTorrents)
      setDownloadedFiles(data.downloaded)
      newTorrents.forEach(t => notifyCompletion(t))
      setConnectionError(false)
    } catch {
      toast(`Fetch Error`)
      setConnectionError(true)
    } finally {
      fetchSuggestNamesStatus()
    }
  }, 1100)

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
      setRenameDialogOpen(false)
      return
    }

    if (currentTorrent) {
      const filename = currentTorrentFilename || currentTorrent.name
      await renameTorrent(currentTorrent, filename, newName)
    }

    resetState()
    setRenameDialogOpen(false)
  }
  const cleanupSoftDeletedFiles = useCallback(async (torrent_id: string, name: string, files: string[]) => {
    try {
      const response = await fetch(
        `${serverBaseUrl}/torrents/cleanup`,
        {
          method: 'POST',
          headers: json_header,
          body: JSON.stringify({ torrent_id, files, name })
        }
      )

      if (!response.ok) {
        console.log(`Network error cleaning up soft deleted files: ${response.status}`)
        toast(`Failed to cleanup files (${response.status})`)
        return
      }

      try {
        const allSoftDeleted = localStorage.getItem('soft-deleted-files')
        if (allSoftDeleted) {
          const softDeleted = JSON.parse(allSoftDeleted)
          const cleanedSoftDeleted = softDeleted.filter((e: SoftDeletedFile) => e.torrent != torrent_id)
          localStorage.setItem('soft-deleted-files', JSON.stringify(cleanedSoftDeleted))
          setTorrentSoftDeletedFiles(cleanedSoftDeleted)
        }
      } catch (e) {
        console.log("Error updating soft deleted files in localStorage:", e)
        toast("Error updating soft deleted files in storage")
      }
    } catch (error) {
      console.log("Error cleaning up soft deleted files:", error)
      toast("Failed to cleanup deleted files")
    } finally {
      fetchTorrents()
    }
  }, [fetchTorrents, setTorrentSoftDeletedFiles])

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
    setRenameDialogOpen(false)
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
      toast(`${action.substring(0, 1).toUpperCase()}${action.substring(1)} ${item}`)
      setAction(action);
      setCurrentDownloadedFile(item);
      setCurrentActionType('downloadedFile');
      fetchTorrents()
    }

    if (typeof item === 'object') {
      const torrent: Torrent = item as Torrent;
      if (torrent.id) {
        console.log(`Torrent Action: ${action} ... ${torrent.name}`)
        toast(`${action.substring(0, 1).toUpperCase()}${action.substring(1)} ${torrent.name}`)
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

  const resetState = () => {
    setCurrentDownloadedFile(null)
    setCurrentTorrent(null)
    setCurrentTorrentFilename(null)
    setNewName('')
    setSuggestions(new Set())
  }

  const handleRenameDownloaded = (item: string) => {
    resetState()
    setCurrentDownloadedFile(item)
    setNewName(item)
    setRenameDialogOpen(true)
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

    setRenameDialogOpen(true)
  }

  const fetchSuggestNamesStatus = useCallback(async () => {
    try {
      const res = await fetch(`${serverBaseUrl}/llm/status`)
      setSuggestionsLLMOnline(res.ok)
    } catch {
      setSuggestionsLLMOnline(false)
    }
  }, [])

  const isSoftDeleted = (hash: string, index: number) => (
    torrentSoftDeletedFiles.some((e: SoftDeletedFileType) => e.torrent === hash && e.fileIndex === index)
  )

  const softDeleteTorrentSubFile = (torrent: Torrent, filename: string) => {
    const index = torrent.files.findIndex(f => f[0] === filename)
    const hash = torrent.id
    if (!isSoftDeleted(hash, index)) {
      setTorrentSoftDeletedFiles([...torrentSoftDeletedFiles, new SoftDeletedFile(hash, index)])
    }
  }

  const getTorrentSoftDeletedFiles = (torrent: Torrent): string[] => {
    const indexes = torrentSoftDeletedFiles
      .filter((e: SoftDeletedFileType) => e.torrent === torrent.id)
      .map((e: SoftDeletedFileType) => e.fileIndex)

    return torrent.files
      .filter((_, idx) => indexes.includes(idx))
      .map(e => e[0])
  }

  const renameTorrent = async (torrent: Torrent, currentFilename: string, newName: string) => {
    const payload = {
      filename: currentFilename,
      newname: newName,
      torrent_id: torrent.id,
    }

    try {
      const response = await fetch(`${serverBaseUrl}/torrents/active/rename`, {
        method: 'POST',
        headers: json_header,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        toast(`Failed to rename torrent (${response.status})`)
      } else {
        toast("Torrent renamed successfully")
      }
    } catch (error) {
      console.error("Error renaming torrent:", error)
      toast("Failed to rename torrent")
    } finally {
      fetchTorrents()
    }
  }

  return (
    <TorrentManagerContext.Provider value={{
      torrents,
      downloadedFiles,
      connectionError,
      suggestionsLLMOnline,
      fetchTorrents,
      fetchSuggestions,
      toggleExpand,
      softDeleteTorrentSubFile,
      isSoftDeleted,
      getTorrentSoftDeletedFiles,
      cleanupSoftDeletedFiles,
      handleAction,
      handleRenameDownloaded,
      confirmRenameDownloadedFile,
      handleRenameTorrent,
      confirmRename,
      renameTorrent,
      cancelRenameTorrent,
      resetState,
      expandedTorrent,
      setExpandedTorrent,
      renameDialogOpen,
      setRenameDialogOpen,
      action,
      setAction,
      currentActionType,
      setCurrentActionType,
      currentTorrent,
      setCurrentTorrent,
      currentTorrentFilename,
      setCurrentTorrentFilename,
      currentDownloadedFile,
      setCurrentDownloadedFile,
      newName,
      setNewName,
      suggestions,
      setSuggestions
    }}>
      {children}
    </TorrentManagerContext.Provider>
  );
};
