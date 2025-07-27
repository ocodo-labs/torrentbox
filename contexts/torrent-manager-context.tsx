import { json_header, serverBaseUrl } from '@/app/config';
import { useLeadingEdgeDebounce } from '@/lib/debounce';
import { useLocalStorage } from '@/lib/use-local-storage';
import { notifyCompletion } from '@/lib/utils';
import type { DestructiveDownloadedFileAction, DestructiveTorrentAction } from '@/types/actions';
import { type SoftDeletedFileType, SoftDeletedFile } from '@/types/soft-deleted-file';
import { Torrent, TorrentData } from '@/types/torrent';
import React, { createContext, useCallback, useContext, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner';

interface TorrentManagerContextType {
  torrents: Torrent[]
  downloadedFiles: string[]
  connectionError: boolean
  suggestionsLLMOnline: boolean
  fetchTorrents: () => Promise<void>
  fetchSuggestions: (filename: string) => Promise<void>
  isSoftDeleted: (hash: string, index: number) => boolean
  softDeleteTorrentSubFile: (torrent: Torrent, filename: string) => void
  getTorrentSoftDeletedFiles: (torrent: Torrent) => void
  handleAction: (item: Torrent | string, action: DestructiveDownloadedFileAction | DestructiveTorrentAction) => Promise<void>
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
  const [currentTorrent, setCurrentTorrent] = useState<Torrent | null>(null)
  const [currentTorrentFilename, setCurrentTorrentFilename] = useState<string | null>(null)
  const [currentDownloadedFile, setCurrentDownloadedFile] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [suggestions, setSuggestions] = useState<Set<string>>(new Set())

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
      return
    } catch {
      toast(`Fetch Error`)
      setConnectionError(true)
    } finally {
      fetchSuggestNamesStatus()
      return
    }
  }, 1500)

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

  const executeTorrentAction = async (
    action: DestructiveTorrentAction,
    torrent: Torrent
  ) => {

    try {
      const torrent_id = torrent.id;
      const response = await fetch(
        `${serverBaseUrl}/torrents/active/${action}?torrent_id=${torrent_id}`,
        { headers: json_header }
      );

      if (!response.ok) {
        console.log(`Network error performing torrent action: ${response.status}`);
        toast(`Failed to ${action} torrent (${response.status})`);
        return
      }

      toast(`${torrent.name} ${action} completed`);
    } catch (error) {
      const correctedAction = action.substring(0, action.length - 1);
      console.log(`Error ${correctedAction}ing torrent:`, error);
      toast(`Failed to ${action} torrent`);
    } finally {
      return
    }
  }

  const executeDownloadedFileAction = async (
    action: DestructiveDownloadedFileAction,
    downloadedFile: string
  ) => {

    const encodedDownloadedFileName = encodeURIComponent(downloadedFile)
    try {
      const response = await fetch(
        `${serverBaseUrl}/torrents/${action}?filename=${encodedDownloadedFileName}`,
        { headers: json_header }
      );

      if (!response.ok) {
        console.log(`Network error performing file action: ${response.status}`);
        toast(`Failed to ${action} ${downloadedFile} (${response.status})`);
        return;
      }

      toast(`${downloadedFile} ${action} completed`);
    } catch (error) {
      console.log(`Error performing ${action} on ${downloadedFile}:`, error);
      toast(`Failed to perform ${action} on ${downloadedFile}`);
    }
  }

  const cancelRenameTorrent = () => {
    resetState()
    setRenameDialogOpen(false)
  }

  const handleAction = async (
    item: Torrent | string,
    action: DestructiveTorrentAction | DestructiveDownloadedFileAction
  ) => {
    if (typeof item === 'string') {
      await executeDownloadedFileAction(action as DestructiveDownloadedFileAction, item)
      fetchTorrents()
      return
    }

    if (typeof item === 'object') {
      const torrent: Torrent = item as Torrent;
      if (torrent.id) {
        console.log(`Torrent Action: ${action} ... ${torrent.name}`)
        await executeTorrentAction(action as DestructiveTorrentAction, torrent)
        fetchTorrents()
        return
      }
    }
  }

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

      if (response.ok) {
        toast(`Renamed ${currentFilename} ⇢  ${newName}`)
      } else {
        const json = await response.json()
        if (json.detail) {
          toast.warning(json.detail)
        } else {
          toast.warning(`Failed to rename ${currentFilename} (${response.status})`)
        }
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
      softDeleteTorrentSubFile,
      isSoftDeleted,
      getTorrentSoftDeletedFiles,
      handleAction,
      handleRenameDownloaded,
      confirmRenameDownloadedFile,
      handleRenameTorrent,
      confirmRename,
      renameTorrent,
      cancelRenameTorrent,
      resetState,
      toggleExpand,
      expandedTorrent,
      setExpandedTorrent,
      renameDialogOpen,
      setRenameDialogOpen,
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
