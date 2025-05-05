'use client'

import { Button } from '@/components/ui/button'
import { Menu, Moon, Sun } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { serverBaseUrl } from '@/app/config'
import { TorrentNewMagnetDialog } from '@/components/torrent-new-magnet-dialog'
import { MagnetIcon } from '@/components/magnet-icon'
import { useState } from 'react'
import { BittorrentIcon } from '@/components/bit-torrent-icon'

interface TorrentBoxHeadingProps {
  setTheme: (theme: string) => void
  theme?: string | null
}

export function TorrentBoxHeading(props: TorrentBoxHeadingProps) {
  const { setTheme, theme } = props
  const [dialogOpen, setDialogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSelect = () => {
    setMenuOpen(false)        // close the menu first
    setTimeout(() => {
      setDialogOpen(true)     // slight delay prevents focus conflict
    }, 50)
  }
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={handleSelect}>
            <MagnetIcon className='mr-2' /> Add magnet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className='flex'>
        <BittorrentIcon className='mr-2'/>
        <h1 className="text-3xl font-black tracking-tighter">TorrentBox</h1>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      >
        {theme === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
      </Button>

      <TorrentNewMagnetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        postUrl={`${serverBaseUrl}/torrents/magnet/new`}
      />
    </header>
  )
}
