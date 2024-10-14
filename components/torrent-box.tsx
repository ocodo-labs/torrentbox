'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Menu, Sun, Moon, Edit, Trash, X, ChevronDown, ChevronUp, Tv, Film } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell,  TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { generateFakeDownloaded, generateFakeSuggestions, generateFakeTorrents } from '@/demo/fake'
import { DemoPanel } from '@/components/demo-panel'
import { Torrent, TorrentData } from '@/types/torrent'
import { ConfirmDownloadedFileAction, ConfirmTorrentAction } from '@/types/actions'

function TorrentBoxHeading({setTheme, theme}) {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <Button variant="ghost" size="icon" className="md:hidden">
        <Menu className="h-6 w-6" />
      </Button>
      <h1 className="text-xl md:text-2xl font-bold">Torrent Box</h1>
      <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      >
        {theme === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
      </Button>
    </header>
  )
}

function DownloadedSection({downloadedFiles, handleRename, handleAction}) {
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
                <Button variant="ghost" size="icon" onClick={() => handleAction(file, 'delete')}>
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

const TorrentsSection = ({
  torrents,
  expandedTorrent,
  toggleExpand,
  handleAction,
  handleRename,
  handleSoftDelete,
}) => {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Torrents</h2>
      <div className="space-y-4">
        {torrents.map((torrent: Torrent) => (
          <div key={torrent.id} className="p-4 border rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <h3 className="text-lg font-semibold mb-2 sm:mb-0">{torrent.name}</h3>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" onClick={() => handleRename(torrent)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleAction(torrent, 'remove')}>
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleAction(torrent, 'delete')}>
                  <Trash className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => toggleExpand(torrent.id)}>
                  {expandedTorrent === torrent.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Progress value={torrent.percent} className="w-full" />
            {expandedTorrent === torrent.id && (
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableBody>
                    {torrent.files.map(([filename, size, downloaded], index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {filename}
                          <Progress value={(downloaded / size) * 100} className="w-full" />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleRename(torrent, filename)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleSoftDelete(torrent, filename)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

const RenameDialog = ({
  open,
  onOpenChange,
  newName,
  setNewName,
  suggestions,
  onCancel,
  onConfirm,
  title}) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Table>
            <TableBody>
              {suggestions.map((suggestion, index) => (
                <TableRow key={index} className={index % 2 === 0 ? 'bg-muted' : ''}>
                  <TableCell>
                    <Button variant="ghost" onClick={() => setNewName(suggestion)}>
                      {suggestion}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={onConfirm}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

const ConfirmDialog = ({
  confirmDialogOpen,
  setConfirmDialogOpen,
  confirmAction,
  executeAction,
  dontShowAgain,
  setDontShowAgain,
  alertDescriptions,
}) => {
  return (
    <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
      <DialogContent >
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
        </DialogHeader>
        <Alert>
          <AlertTitle>Are you sure?</AlertTitle>
          <AlertDescription>
            {alertDescriptions[confirmAction]}
          </AlertDescription>
        </Alert>
        <div className="flex items-center space-x-2">
          <Checkbox
              id="dontShowAgain"
              checked={dontShowAgain[confirmAction]}
              onCheckedChange={(checked) =>
                setDontShowAgain(prev => ({ ...prev, [confirmAction]: checked as boolean }))
              }
          />
          <label
              htmlFor="dontShowAgain"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Don't show this again for {confirmAction}
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => executeAction(confirmAction)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

class SoftDeletedFile {
  torrent: string
  fileIndex: number

  constructor(torrent: string, fileIndex: number) {
    this.torrent = torrent
    this.fileIndex = fileIndex
  }

  isEqual(torrent: string, fileIndex: number): boolean {
    return this.torrent == torrent && this.fileIndex == fileIndex
  }
}

function TorrentBox() {
  const { theme, setTheme } = useTheme()
  const [torrents, setTorrents] = useState<Torrent[]>([])
  const [torrentSoftDeletedFiles, setTorrentSoftDeletedFiles] = useState<SoftDeletedFile[]>([])
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
  const [dontShowAgain, setDontShowAgain] = useState({
    remove: false,
    delete: false,
    moveToTV: false,
    moveToMovies: false,
  })

  useEffect(() => {
    setMounted(true)
    if (!isDemo) {
      fetchTorrents()
      const id = setInterval(fetchTorrents, 3000);
      return () => clearInterval(id);
    } else {
      setTorrents(generateFakeTorrents())
      setDownloadedFiles(generateFakeDownloaded())
    }
  }, [isDemo])

  const fetchTorrents = async () => {
    try {
      const response = await fetch(
        'http://helios:5000/torrents/active', 
        {headers: {
          "Content-Type": "application/json"
        }}
      )
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data: TorrentData = await response.json()
      setTorrents(data.downloading)
      setDownloadedFiles(data.downloaded)
      setConnectionError(false)
    } catch (error) {
      console.error('Error fetching torrents:', error)
      setConnectionError(true)
    }
  }

  const softDeleteTorrentSubFile = (torrent: Torrent, filename: string) => {
    const index = torrent.files.findIndex(f => f[0] == filename )
    const hash = torrent.id
    const notSoftDeleted = torrentSoftDeletedFiles.findIndex(e => e.torrent == hash && e.fileIndex == index) == -1

    if (notSoftDeleted) {
      setTorrentSoftDeletedFiles([...torrentSoftDeletedFiles, new SoftDeletedFile(hash, index)])
    }
  }

  const handleRename = (item: Torrent | string, filename?: string) => {
    setRenameTorrentDialogOpen(true)
    setTimeout(() => {
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
          alert(filename)
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
    }, 600)
  }

  const escapeName = (name: string):string => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const getTorrentSubFilename = (torrentName: string, filename:string):string => filename.replace(new RegExp(`^${torrentName}/`), '')

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
        `http://helios:5000/torrents/suggest_names`,
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
    'filesDelete': 'Delete the downloaded files',
    'filesMoveMovies': 'Move downloaded files to the Movies folder.',
    'filesMoveTvshows': 'Move downloaded files to the TV shows folder.',
  }

  const confirmRename = async () => {
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
          const response = await fetch('http://helios:5000/torrents/active/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

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
      } else {
        // Handle demo mode (update in state directly)
        if (currentTorrent) {
          setTorrents(torrents.map(t =>
            t.id === currentTorrent.id ? { ...t, name: newName } : t
          ));
        } else {
          setDownloadedFiles(downloadedFiles.map(t =>
            t === currentDownloadedFile ? newName : t
          ));
        }
      }
    }
    setRenameTorrentDialogOpen(false); // Close the rename dialog
  };


  const handleAction = (item: Torrent | string, action: ConfirmTorrentAction | ConfirmDownloadedFileAction) => {
    if (typeof item === 'string') {
      setCurrentDownloadedFile(item)
      setCurrentTorrent(null)
      setConfirmDownloadedFileAction(action)
      if (dontShowAgain[action]) {
        executeDownloadedFileAction(action)
      } else {
        setConfirmDownloadedFileActionDialogOpen(true)
      }
    } else {
      setCurrentTorrent(item)
      setCurrentDownloadedFile(null)
      setConfirmTorrentAction(action)
      if (dontShowAgain[action]) {
        executeTorrentAction(action)
      } else {
        setConfirmTorrentActionDialogOpen(true)
      }
    }

  }

  const torrentActionRequest = async (action: ConfirmTorrentAction) => {
    if(currentTorrent) {
      try {
        const torrent_id = currentTorrent.id
        const response = await fetch(
          `http://helios:5000/torrents/active/${action}?torrent_id=${torrent_id}`,
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
        torrentActionRequest(action)
      }
      setTorrents(torrents.filter(t => t.id !== currentTorrent.id))
    }
    setConfirmTorrentActionDialogOpen(false)
  }

  const executeDownloadedFileAction = async (action: ConfirmDownloadedFileAction) => {
    if (currentDownloadedFile) {
      if (!isDemo) {
        const actionPath = action

        setDownloadedFiles(downloadedFiles.filter(t => t !== currentDownloadedFile))
      }
    }
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
          <DemoPanel tryAgain={fetchTorrents} startDemo={startDemo}/>
        ) : (
          <div className="space-y-8">
            <TorrentsSection
                torrents={torrents}
                expandedTorrent={expandedTorrent}
                toggleExpand={toggleExpand}
                handleAction={handleAction}
                handleRename={handleRename}
                handleSoftDelete={softDeleteTorrentSubFile}
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
          onConfirm={confirmRename}
          onCancel={() => setRenameTorrentDialogOpen(false)}
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
