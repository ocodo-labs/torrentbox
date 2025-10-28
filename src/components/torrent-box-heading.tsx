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
import { Film, Magnet, Menu, Moon, Sun, TrendingUp, Tv } from 'lucide-react'
import { useContext, useState } from 'react'
import { thinIconStyle } from '@/lib/styling'
import { useTop100MoviesContext } from '@/contexts/top-100-movies-context'
import { useTop100TVShowsContext } from '@/contexts/top-100-tvshows-context'
import { useTrendingTodayContext } from '@/contexts/trending-today-context'
import { useTrendingWeekContext } from '@/contexts/trending-week-context'

export function TorrentBoxHeading() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { toggleTheme, theme } = useContext(ThemeContext)
  const { open: openTop100Movies } = useTop100MoviesContext()
  const { open: openTop100TVShows } = useTop100TVShowsContext()
  const { open: openTrendingToday } = useTrendingTodayContext()
  const { open: openTrendingWeek } = useTrendingWeekContext()

  const handleAddMagnet = () => {
    setMenuOpen(false)
    setDialogOpen(true)
  }

  const themeIcons = (theme: string) => {
    return {
      light: <Sun className="h-6 w-6" style={{ strokeWidth: 0.5 }} />,
      dark: <Moon className="h6 w-6" style={{ strokeWidth: 0.5 }} />,
      oli: <Olivetti1954 className="h-6 w-6" />,
      'oli-dark': <Olivetti1954 className="h-6 w-6" style={{ fill: "#FFFFFF" }} />,
    }[theme]
  }

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <Menu className="h-6 w-6" style={thinIconStyle} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={handleAddMagnet}>
            <Magnet className='mr-2 w-6 h-6' style={thinIconStyle} /> Add magnet
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openTop100Movies}>
            <Film className='mr-2 w-6 h-6' style={thinIconStyle} /> Top 100 Movies
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openTop100TVShows}>
            <Tv className='mr-2 w-6 h-6' style={thinIconStyle} /> Top 100 TV Shows
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openTrendingToday}>
            <TrendingUp className='mr-2 w-6 h-6' style={thinIconStyle} /> Trending Today
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openTrendingWeek}>
            <TrendingUp className='mr-2 w-6 h-6' style={thinIconStyle} /> Trending This Week
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
      />
    </header>
  )
}
