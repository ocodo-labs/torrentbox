import { json_header, serverBaseUrl } from '@/config';
import { useLeadingEdgeDebounce } from '@/lib/debounce';
import { notifyCompletion } from '@/lib/utils';
import type { DestructiveDownloadedFileAction, DestructiveTorrentAction } from '@/types/actions';
import { type SoftDeletedFileType, SoftDeletedFile } from '@/types/soft-deleted-file';
import { type Torrent, type TransmissionData, type TorrentFile } from '@/types/torrent';
import React, { createContext, useCallback, useContext, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner';
import videoFileExtensions from 'video-extensions';
import subtitleFileExtensions from '@/lib/subtitle-file-extensions';
import { playSound } from '@/lib/play-sound';
import { useLocalStorage } from 'usehooks-ts';

export interface FileRenameType {
  filename: string
  newname: string
}

interface TransmissionContextType {
  torrents: Torrent[]
  downloadedFiles: string[]
  connectionError: boolean
  suggestionsLLMOnline: boolean
  getFilenames: (torrent: Torrent) => string[]
  getActiveFilenames: (torrent: Torrent) => string[]
  getActiveFiles: (torrent: Torrent) => TorrentFile[]
  getShowVideoFilenames: (torrent: Torrent) => string[]
  getShowSubtitleFilenames: (torrent: Torrent) => string[]
  getShowFilenames: (torrent: Torrent) => string[]
  getVideoFilenames: (torrent: Torrent) => string[]
  isTVShowSeasonTorrent: (torrent: Torrent) => boolean
  canRename: (torrent: Torrent) => boolean
  fetchTorrents: () => Promise<void>
  fetchSuggestions: (filename: string) => Promise<void>
  isSoftDeleted: (hash: string, index: number) => boolean
  softDeleteTorrentSubFile: (torrent: Torrent, filename: string) => void
  getTorrentSoftDeletedFiles: (torrent: Torrent) => void
  clearSoftDeleted: (torrent: Torrent) => void
  handleAction: (item: Torrent | string, action: DestructiveDownloadedFileAction | DestructiveTorrentAction) => Promise<void>
  handleRenameDownloaded: (item: string) => void
  handleRenameTorrent: (torrent: Torrent, filename?: string) => void
  confirmRename: () => void
  cancelRenameTorrent: () => void
  autoTitleVideos: (torrent: Torrent) => Promise<void>
  batchRenameTorrentFiles: (torrent: Torrent, renames: FileRenameType[]) => void
  renameTorrent: (torrent: Torrent, currentFilename: string, newName: string) => void
  confirmRenameDownloadedFile: () => void
  resetState: () => void
  toggleExpand: (id: string) => void
  expandedTorrent: string | null
  setExpandedTorrent: Dispatch<SetStateAction<string | null>>
  renameDialogOpen: boolean
  setRenameDialogOpen: Dispatch<SetStateAction<boolean>>
  showTVShowRenameDialog: boolean
  setShowTVShowRenameDialog: Dispatch<SetStateAction<boolean>>
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
  selectedTorrents: Set<string>
  setSelectedTorrents: Dispatch<SetStateAction<Set<string>>>
  executeSelectedTorrentsAction: (action: DestructiveTorrentAction) => Promise<void>
  addMagnet: (magnetUrl: string) => Promise<void>
}

export const useTransmissionContext = (): TransmissionContextType => {
  const context = useContext(TransmissionContext)
  if (!context) {
    throw new Error("useTransmissionContext must be used within a TorrentManagerProvider")
  }
  return context
}

const TransmissionContext = createContext<TransmissionContextType | undefined>(undefined);

export const TransmissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [torrents, setTorrents] = useState<Torrent[]>([])
  const [downloadedFiles, setDownloadedFiles] = useState<string[]>([])
  const [torrentSoftDeletedFiles, setTorrentSoftDeletedFiles] = useLocalStorage<SoftDeletedFile[]>('soft-deleted-files', [])
  const [connectionError, setConnectionError] = useState(false)
  const [suggestionsLLMOnline, setSuggestionsLLMOnline] = useState(false)
  const [expandedTorrent, setExpandedTorrent] = useState<string | null>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [currentTorrent, setCurrentTorrent] = useState<Torrent | null>(null)
  const [currentTorrentFilename, setCurrentTorrentFilename] = useState<string | null>(null)
  const [currentDownloadedFile, setCurrentDownloadedFile] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [suggestions, setSuggestions] = useState<Set<string>>(new Set())
  const [showTVShowRenameDialog, setShowTVShowRenameDialog] = useState(false)
  const [selectedTorrents, setSelectedTorrents] = useState<Set<string>>(new Set())

  const getFilenames = (torrent: Torrent) => torrent.files.map(e => e[0])

  const getActiveFilenames = (torrent: Torrent) =>
    torrent.files.
      filter((_, i) => !isSoftDeleted(torrent.id, i)).
      map(e => e[0])

  const getActiveFiles = (torrent: Torrent) =>
    torrent.files.
      filter((_, i) => !isSoftDeleted(torrent.id, i))

  const getShowFilenames = (torrent: Torrent) => getActiveFilenames(torrent).
    filter((f) => f.toLowerCase().match(/(s\d+e\d+|\d+x\d{2,})/))

  const getShowVideoFilenames = (torrent: Torrent) => getVideoFilenames(torrent).
    filter((f) => f.toLowerCase().match(/(s\d+e\d+|\d+x\d{2,})/))

  const getShowSubtitleFilenames = (torrent: Torrent) => getActiveFilenames(torrent).
    filter((f) => subtitleFileExtensions.some(e => f.toLowerCase().endsWith(e)))

  const getVideoFilenames = (torrent: Torrent) => getActiveFilenames(torrent)
    .filter((f) => videoFileExtensions.some(e => f.toLowerCase().endsWith(e)))

  const isTVShowSeasonTorrent = (torrent: Torrent) => {
    return getVideoFilenames(torrent).length > 1 && getVideoFilenames(torrent).length == getShowVideoFilenames(torrent).length
  }

  const canRename = (torrent: Torrent) => torrent?.files?.length > 0

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
      const data: TransmissionData = await res.json()
      const newTorrents: Torrent[] = data.downloading
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

  const autoTitleVideos = async (torrent: Torrent) => {
    const torrent_id = torrent.id
    const videosLength = torrent.files
      .filter((f) => ['mp4', 'mkv']
        .some((e) => f[0]
          .endsWith(e)))
      .length
    const videos = videosLength > 1 ? 'videos' : 'video'
    const message = `Auto titled ${videos} in ${torrent.name}`
    const errorMessage = `Error when titling ${videos} in ${torrent.name}`
    try {
      const response = await fetch(`${serverBaseUrl}/torrents/retitle/videos?torrent_id=${torrent_id}`)
      if (response.ok) {
        toast(message)
      } else {
        toast(errorMessage)
      }
      return
    } catch {
      toast(errorMessage)
      return
    }
  }

  const executeSelectedTorrentsAction = async (
    action: DestructiveTorrentAction
  ) => {
    const torrentsSelected: Torrent[] = torrents.filter((t) => selectedTorrents.has(t.id))
    torrentsSelected.forEach(async (t) => await executeTorrentAction(action, t))
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
      try {
        if (action == 'remove') {
          const cleanup = await fetch(
            `${serverBaseUrl}/torrents/cleanup`,
            {
              method: 'post',
              body: JSON.stringify({
                torrent_id: torrent.id,
                name: torrent.name,
                files: getTorrentSoftDeletedFiles(torrent),
              }),
              headers: json_header
            }
          )

          if (!cleanup.ok) {
            const data = await cleanup.json()
            const failed = data.failed
            toast(`${torrent.name} deleted, some files were not deleted, ${failed.join(', ')}`)
            return
          }
        }

        toast(`${torrent.name} ${action} completed`);
        playSound("/sounds/torrent-success.mp3");
      } catch {
        toast(`${torrent.name} cleanup failed.`)
      } finally {
        clearSoftDeleted(torrent)
      }
    } catch (error) {
      const correctedAction = action.substring(0, action.length - 1);
      console.log(`Error ${correctedAction}ing torrent:`, error);
      toast(`Failed to ${action} torrent`);
    }
    return
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
    playSound("/sounds/torrent-file-delete.mp3")
  }

  const getTorrentSoftDeletedFiles = (torrent: Torrent): string[] => {
    const indexes = torrentSoftDeletedFiles
      .filter((e: SoftDeletedFileType) => e.torrent === torrent.id)
      .map((e: SoftDeletedFileType) => e.fileIndex)

    return torrent.files
      .filter((_, idx) => indexes.includes(idx))
      .map(e => e[0])
  }

  const clearSoftDeleted = (torrent: Torrent) => {
    setTorrentSoftDeletedFiles(
      torrentSoftDeletedFiles.filter((entry: SoftDeletedFile) => entry.torrent != torrent.id)
    )
  }

  const batchRenameTorrentFiles = async (torrent: Torrent, renames: FileRenameType[]) => {
    const payload = {
      torrent_id: torrent.id,
      renames: renames,
    }

    try {
      const response = await fetch(`${serverBaseUrl}/torrents/active/files/rename`,
        {
          method: "POST",
          headers: json_header,
          body: JSON.stringify(payload),
        }
      )

      if (response.ok) {
        const json = await response.json()
        if (json.errors.length == 0) {
          toast('Renamed torrent files')
        } else {
          toast('Renamed torrent files with errors')
          console.error("Renaming Torrent Files...")
          json.errors.forEach((e: string) => console.error(e))
        }
      }
    } catch {
      toast("Network error on batch rename")
    }
  }

const addMagnet = async (magnetUrl: string) => {
    const postUrl=`${serverBaseUrl}/torrents/magnet/new`
    const magnetRegex = /magnet:\?xt=urn:btih:[a-zA-Z0-9]{32,40}(&.+)?$/;
    if (magnetRegex.test(magnetUrl)) {

      try {
        const response = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ magnet_url: magnetUrl }),
        })
        if (!response.ok) {
          toast(`Error Failed to Add Magnet Link`)
        }
      } catch (error) {
        toast(`Network Error Adding Magnet Link`)
      }
    } else {
      toast("Invalid Magnet URL")
    }
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
    <TransmissionContext.Provider value={{
      torrents,
      downloadedFiles,
      connectionError,
      suggestionsLLMOnline,
      getActiveFilenames,
      getActiveFiles,
      getShowFilenames,
      getVideoFilenames,
      getShowVideoFilenames,
      getShowSubtitleFilenames,
      getFilenames,
      isTVShowSeasonTorrent,
      canRename,
      fetchTorrents,
      fetchSuggestions,
      softDeleteTorrentSubFile,
      isSoftDeleted,
      getTorrentSoftDeletedFiles,
      clearSoftDeleted,
      handleAction,
      handleRenameDownloaded,
      confirmRenameDownloadedFile,
      handleRenameTorrent,
      confirmRename,
      renameTorrent,
      batchRenameTorrentFiles,
      cancelRenameTorrent,
      resetState,
      toggleExpand,
      expandedTorrent,
      setExpandedTorrent,
      renameDialogOpen,
      setRenameDialogOpen,
      showTVShowRenameDialog,
      setShowTVShowRenameDialog,
      currentTorrent,
      setCurrentTorrent,
      currentTorrentFilename,
      setCurrentTorrentFilename,
      currentDownloadedFile,
      setCurrentDownloadedFile,
      newName,
      setNewName,
      suggestions,
      setSuggestions,
      autoTitleVideos,
      selectedTorrents,
      setSelectedTorrents,
      executeSelectedTorrentsAction,
      addMagnet,
    }}>
      {children}
    </TransmissionContext.Provider>
  );
};
