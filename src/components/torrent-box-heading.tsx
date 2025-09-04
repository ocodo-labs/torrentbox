import { serverBaseUrl } from '@/config'
import { BittorrentIcon } from '@/components/bit-torrent-icon'
import { Olivetti1954 } from '@/components/olivetti-1954-logo'
import { TorrentNewMagnetDialog } from '@/components/torrent-new-magnet-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeContext } from '@/contexts/theme-context'
import { Magnet, Menu, Moon, Sun } from 'lucide-react'
import { useContext, useState } from 'react'

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
      light: <Sun className="h-6 w-6" style={{strokeWidth:0.5}}/>,
      dark: <Moon className="h6 w-6" style={{strokeWidth:0.5}}/>,
      oli: <Olivetti1954 className="h-6 w-6"/>,
      'oli-dark': <Olivetti1954 className="h-6 w-6" style={{fill: "#FFFFFF"}}/>,
    }[theme]
  }

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <Menu className="h-6 w-6" style={{strokeWidth: 0.5}} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={handleSelect}>
            <Magnet className='mr-2 w-6 h-6' style={{strokeWidth:0.5}} /> Add magnet
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
