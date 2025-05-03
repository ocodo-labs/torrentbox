import { useEffect, useState, useCallback } from 'react'
import { Torrent, TorrentData } from "@/types/torrent"
import { json_header, serverBaseUrl } from "@/app/config"
import { toast } from "@/hooks/use-toast"
import { notifyCompletion } from "@/lib/utils"
import { useLocalStorage } from "@/lib/use-local-storage"
import { ISoftDeletedFile, SoftDeletedFile } from "@/types/soft-deleted-file"

export function useTorrentManager() {
  const [torrents, setTorrents] = useState<Torrent[]>([])
  const [downloadedFiles, setDownloadedFiles] = useState<string[]>([])
  const [torrentSoftDeletedFiles, setTorrentSoftDeletedFiles] = useLocalStorage('soft-deleted-files', [])
  const [connectionError, setConnectionError] = useState(false)
  const [suggestionsLLMOnline, setSuggestionsLLMOnline] = useState(false)

  const fetchSuggestNamesStatus = useCallback(async () => {
    try {
      const res = await fetch(`${serverBaseUrl}/torrents/suggest_names/status`)
      setSuggestionsLLMOnline(res.ok)
    } catch (err) {
      setSuggestionsLLMOnline(false)
    }
  }, [])

  const fetchTorrents = useCallback(async () => {
    fetchSuggestNamesStatus()
    try {
      const res = await fetch(`${serverBaseUrl}/torrents/active`, { headers: json_header })
      if (!res.ok) {
        toast({ title: 'Network Error', description: `Failed to fetch torrents (${res.status})` })
        setConnectionError(true)
        return
      }
      const data: TorrentData = await res.json()
      const newTorrents = data.downloading.map(t => new Torrent(t))
      setTorrents(newTorrents)
      setDownloadedFiles(data.downloaded)
      newTorrents.forEach(t => notifyCompletion(t))
      setConnectionError(false)
    } catch (err) {
      toast({ title: 'Fetch Error', description: `${err}` })
      setConnectionError(true)
    }
  }, [fetchSuggestNamesStatus])

  const isSoftDeleted = useCallback((hash: string, index: number) =>
    torrentSoftDeletedFiles.some((e: ISoftDeletedFile) => e.torrent === hash && e.fileIndex === index),
    [torrentSoftDeletedFiles]
  )

  const softDeleteTorrentSubFile = (torrent: Torrent, filename: string) => {
    const index = torrent.files.findIndex(f => f[0] === filename)
    const hash = torrent.id
    if (!isSoftDeleted(hash, index)) {
      setTorrentSoftDeletedFiles([...torrentSoftDeletedFiles, new SoftDeletedFile(hash, index)])
    }
  }

  const getTorrentSoftDeletedFiles = useCallback((torrent: Torrent): string[] => {
    const indexes = torrentSoftDeletedFiles
      .filter((e: ISoftDeletedFile) => e.torrent === torrent.id)
      .map((e: ISoftDeletedFile) => e.fileIndex)

    return torrent.files
      .filter((_, idx) => indexes.includes(idx))
      .map(e => e[0])
  }, [torrentSoftDeletedFiles])

  const cleanupSoftDeletedFiles = async (torrent_id: string, name: string, files: string[]) => {
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
        toast({
          title: "Network Error",
          description: `Failed to cleanup files (${response.status})`
        })
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
        toast({
          title: "Soft Delete Error",
          description: "Error updating soft deleted files in storage"
        })
      }
    } catch (error) {
      console.log("Error cleaning up soft deleted files:", error)
      toast({
        title: "Error",
        description: "Failed to cleanup deleted files"
      })
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

      if (!response.ok) {
        toast({ title: "Network Error", description: `Failed to rename torrent (${response.status})` })
      } else {
        toast({ title: "Success", description: "Torrent renamed successfully" })
      }
    } catch (error) {
      console.error("Error renaming torrent:", error)
      toast({ title: "Error", description: "Failed to rename torrent" })
    } finally {
      fetchTorrents()
    }
  }

  useEffect(() => {
    fetchTorrents()
    const interval = setInterval(fetchTorrents, 1000)
    return () => clearInterval(interval)
  }, [fetchTorrents])

  return {
    torrents,
    downloadedFiles,
    connectionError,
    suggestionsLLMOnline,
    fetchTorrents,
    softDeleteTorrentSubFile,
    isSoftDeleted,
    getTorrentSoftDeletedFiles,
    cleanupSoftDeletedFiles,
    renameTorrent,
  }
}
