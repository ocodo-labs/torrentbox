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
import { useContext, useState } from 'react'
import { BittorrentIcon } from '@/components/bit-torrent-icon'
import { ThemeContext } from '@/contexts/theme-context'
import { Olivetti1954 } from '@/components/olivetti-1954-logo'

export function TorrentBoxHeading() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { toggleTheme, theme } = useContext(ThemeContext)

  const handleSelect = () => {
    setMenuOpen(false)        // close the menu first
    setTimeout(() => {
      setDialogOpen(true)     // slight delay prevents focus conflict
    }, 50)
  }

  const themeIcons = (theme: string) => {
    return {
      light: (<Sun className="h-6 w-6 stroke-1" />),
      dark: (<Moon className="h-6 w-6 stroke-1" />),
      oli: (<Olivetti1954 className="h-6 w-6" />),
    }[theme]
  }

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <Menu className="h-6 w-6 stroke-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={handleSelect}>
            <MagnetIcon className='mr-2' /> Add magnet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className='flex'>
        <BittorrentIcon className='mr-2' />
        <h1 className="text-3xl font-black tracking-tighter">TorrentBox</h1>
      </div>
      <Button
        className='cursor-pointer'
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
      >
        {themeIcons(theme)}
      </Button>

      <TorrentNewMagnetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        postUrl={`${serverBaseUrl}/torrents/magnet/new`}
      />
    </header>
  )
}
