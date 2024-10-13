'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Menu, Sun, Moon, Edit, Trash, X, ChevronDown, ChevronUp, WifiOff, Play, Tv, Film } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Torrent, TorrentData } from '@/types/torrent'
import { generateFakeDownloaded, generateFakeSuggestions, generateFakeTorrents } from '@/demo/fake'
import { ConfirmAction } from '@/types/actions'

function DemoPanel({tryAgain, startDemo}) {
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WifiOff className="h-6 w-6" />
          Oops! We&apos;re having a moment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Looks like we can&apos;t reach the torrent service right now. It&apos;s probably just taking a quick nap.
          Why not grab a refreshing beverage and try again in a little bit? (we&apos;ll try giving it a nudge to wake up.)
        </p>
        <div className="flex gap-4">
          <Button onClick={tryAgain}>
            Try Again
          </Button>
          <Button variant="outline" onClick={startDemo}>
            <Play className="h-4 w-4 mr-2" />
            See Demo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

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
      <div className="overflow-x-auto">
        <Table>
          <TableBody>
            {downloadedFiles.map((file: string, index: number) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{file}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleRename(file)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleAction(file, 'moveToTV')}>
                      <Tv  className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleAction(file, 'moveToMovies')}>
                      <Film className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleAction(file, 'delete')}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

const TorrentsSection = ({
  torrents,
  expandedTorrent,
  toggleExpand,
  handleAction,
  handleRename
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
  onConfirm}) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Torrent</DialogTitle>
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
            {confirmAction === 'remove' && 'This will remove the torrent from the list.'}
            {confirmAction === 'delete' && 'This will delete the torrent completely.'}
            {confirmAction === 'moveToTV' && 'This will move the torrent to the TV shows folder.'}
            {confirmAction === 'moveToMovies' && 'This will move the torrent to the Movies folder.'}
          </AlertDescription>
        </Alert>
        <div className="flex items-center space-x-2">
          <Checkbox
              id="dontShowAgain"
              checked={dontShowAgain[confirmAction as ConfirmAction]}
              onCheckedChange={(checked) =>
                setDontShowAgain(prev => ({ ...prev, [confirmAction as ConfirmAction]: checked as boolean }))
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
          <Button variant="destructive" onClick={() => executeAction(confirmAction as ConfirmAction)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TorrentManagerComponent() {
  const { theme, setTheme } = useTheme()
  const [torrents, setTorrents] = useState<Torrent[]>([])
  const [downloadedFiles, setDownloadedTorrents] = useState<string[]>([])
  const [expandedTorrent, setExpandedTorrent] = useState<string | null>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [currentTorrent, setCurrentTorrent] = useState<Torrent | null>(null)
  const [currentTorrentFilename, setCurrentTorrentFilename] = useState<string | null>(null)
  const [currentDownloaded, setCurrentDownloaded] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
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
      setDownloadedTorrents(generateFakeDownloaded())
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
      setDownloadedTorrents(data.downloaded)
      setConnectionError(false)
    } catch (error) {
      console.error('Error fetching torrents:', error)
      setConnectionError(true)
    }
  }

  const handleRename = (item: Torrent | string, filename?: string) => {
    if (typeof item === 'string') {
      setCurrentDownloaded(item)
      setNewName(item)
    } else {
      setCurrentTorrent(item)
      if (filename) setCurrentTorrentFilename(filename)
      setNewName(filename || item.name)
    }
    if (!isDemo) {
      if (currentTorrentFilename && currentTorrent) {
        fetchTorrentSubFilenameSuggestions(currentTorrent, currentTorrentFilename)
      } else {
        fetchSuggestions(filename || (typeof item === 'string' ? item : item.name))
      }
    } else {
      setSuggestions(generateFakeSuggestions(filename || (typeof item === 'string' ? item : item.name)))
    }
    setRenameDialogOpen(true)
  }

  const fetchTorrentSubFilenameSuggestions = async (torrent: Torrent, filename: string) => {
    const name = torrent.name
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const suggestionFilename = filename.replace(new RegExp(`^${escapedName}/`), '')
    console.log(`escaped name: ${escapedName}`)
    console.log(`suggestion filename: ${suggestionFilename}`)
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

  const confirmRename = async () => {
    if (currentTorrent || currentDownloaded) {
      if (!isDemo) {
        const filename = currentTorrentFilename ||
                         currentTorrent?.name ||
                         currentDownloaded

        const payload = {
          filename,
          newname: newName,
          torrent_id: currentTorrent?.id ? currentTorrent.id : ''
        }

        console.dir(payload)

        try {
          const response = await fetch('http://helios:5000/torrents/active/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
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
        } else if (currentDownloaded) {
          setDownloadedTorrents(downloadedFiles.map(t =>
            t === currentDownloaded ? newName : t
          ));
        }
      }
    }
    setRenameDialogOpen(false); // Close the rename dialog
  };


  const handleAction = (item: Torrent | string, action: ConfirmAction) => {
    if (typeof item === 'string') {
      setCurrentDownloaded(item)
      setCurrentTorrent(null)
    } else {
      setCurrentTorrent(item)
      setCurrentDownloaded(null)
    }
    setConfirmAction(action)
    if (dontShowAgain[action]) {
      executeAction(action)
    } else {
      setConfirmDialogOpen(true)
    }
  }

  const executeAction = async (action: ConfirmAction) => {
    if (currentTorrent || currentDownloaded) {
      if (!isDemo) {
        const torrent_id = currentTorrent?.id
        if (torrent_id) {
          try {
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
        } else {
          console.error(`Error torrent_id: ${torrent_id}`)
        }
      } else {
        if (currentTorrent) {
          setTorrents(torrents.filter(t => t.id !== currentTorrent.id))
        } else if (currentDownloaded) {
          setDownloadedTorrents(downloadedFiles.filter(t => t !== currentDownloaded))
        }
      }
    }
    setConfirmDialogOpen(false)
  }

  const toggleExpand = (id: string) => {
    setExpandedTorrent(expandedTorrent === id ? null : id)
  }

  const startDemo = () => {
    setIsDemo(true)
    setConnectionError(false)
    setTorrents(generateFakeTorrents())
    setDownloadedTorrents(generateFakeDownloaded())
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
      <div className="space-y-8"
      >            <TorrentsSection
                       torrents={torrents}
                       expandedTorrent={expandedTorrent}
                       toggleExpand={toggleExpand}
                       handleAction={handleAction}
                       handleRename={handleRename}
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
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        newName={newName}
        setNewName={setNewName}
        suggestions={suggestions}
        onConfirm={confirmRename}
        onCancel={() => setRenameDialogOpen(false)}
    />
    <ConfirmDialog
        confirmDialogOpen={confirmDialogOpen}
        setConfirmDialogOpen={setConfirmDialogOpen}
        confirmAction={confirmAction}
        executeAction={executeAction}
        dontShowAgain={dontShowAgain}
        setDontShowAgain={setDontShowAgain}
    />
    </div>
  )
}

export default TorrentManagerComponent
