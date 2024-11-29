import { Button } from '@/components/ui/button'
import { Menu, Moon, Sun } from 'lucide-react'

interface TorrentBoxHeadingProps {
  setTheme: (theme: string) => void
  theme?: string | null
}

function TorrentBoxHeading(props: TorrentBoxHeadingProps) {
  const { setTheme, theme } = props

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <Button variant="ghost" size="icon" className="md:hidden">
        <Menu className="h-6 w-6" />
      </Button>
      <h1 className="text-xl md:text-2xl font-bold">TorrentBox</h1>
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

export { TorrentBoxHeading }