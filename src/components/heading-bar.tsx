import { BittorrentIcon } from "@/components/icons/bit-torrent-icon";
import { Olivetti1954 } from "@/components/icons/olivetti-1954-logo";
import { TorrentNewMagnetDialog } from "@/components/torrent-new-magnet-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeContext } from "@/contexts/theme-context";
import {
  Magnet,
  Menu,
  Moon,
  Settings2Icon,
  Sun,
} from "lucide-react";
import { useContext, useState } from "react";
import { thinIconStyle } from "@/lib/styling";
import { useTop100MoviesContext } from "@/contexts/top-100-movies-context";
import { useTop100TVShowsContext } from "@/contexts/top-100-tvshows-context";
import { useTrendingTodayContext } from "@/contexts/trending-today-context";
import { useTrendingWeekContext } from "@/contexts/trending-week-context";
import { useServerConfig } from "@/contexts/server-config-provider";
import { useTop100GamesContext } from "@/contexts/top-100-games-context";
import { useTop100AppsContext } from "@/contexts/top-100-apps-context";
import { MiniClock } from "@/components/icons/mini-clock";

export function HeadingBar() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggleTheme, theme } = useContext(ThemeContext);
  const { open: openTop100Movies, title: top100MoviesTitle, icon: top100MoviesIcon } = useTop100MoviesContext();
  const { open: openTop100TVShows, title: top100TVShowsTitle, icon: top100TVShowsIcon } = useTop100TVShowsContext();
  const { open: openTop100Games, title: top100GamesTitle, icon: top100GamesIcon } = useTop100GamesContext();
  const { open: openTop100Apps, title: top100AppsTitle, icon: top100AppsIcon } = useTop100AppsContext();
  const { open: openTrendingToday, title: topTrendingTodayTitle, icon: topTrendingTodayIcon } = useTrendingTodayContext();
  const { open: openTrendingWeek, title: topTrendingWeekTitle, icon: topTrendingWeekIcon } = useTrendingWeekContext();
  const { open: openSettings } = useServerConfig();

  const handleAddMagnet = () => {
    setMenuOpen(false);
    setDialogOpen(true);
  };

  const menuItems = [
    {
      onSelect: handleAddMagnet,
      icon: <Magnet className="mr-2 w-6 h-6" style={thinIconStyle} />,
      label: "Add magnet"
    },
    {
      onSelect: openTop100Movies,
      icon: top100MoviesIcon,
      label: top100MoviesTitle
    },
    {
      onSelect: openTop100TVShows,
      icon: top100TVShowsIcon,
      label: top100TVShowsTitle
    },
    {
      onSelect: openTop100Games,
      icon: top100GamesIcon,
      label: top100GamesTitle
    },
    {
      onSelect: openTop100Apps,
      icon: top100AppsIcon,
      label: top100AppsTitle
    },
    {
      onSelect: openTrendingToday,
      icon: topTrendingTodayIcon,
      label: topTrendingTodayTitle
    },
    {
      onSelect: openTrendingWeek,
      icon: topTrendingWeekIcon,
      label: topTrendingWeekTitle
    },
    {
      onSelect: openSettings,
      icon: <Settings2Icon className="mr-2 w-6 h-6" style={thinIconStyle} />,
      label: 'Settings'
    },
  ];

  const themeIcons = (theme: string) => {
    return {
      light: <Sun className="h-6 w-6" style={{ strokeWidth: 0.5 }} />,
      dark: <Moon className="h6 w-6" style={{ strokeWidth: 0.5 }} />,
      oli: <Olivetti1954 className="h-6 w-6" />,
      "oli-dark": (
        <Olivetti1954 className="h-6 w-6" style={{ fill: "#FFFFFF" }} />
      ),
    }[theme];
  };

  return (
    <header className="flex items-center justify-between p-4 border-b">

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <Menu className="h-6 w-6" style={thinIconStyle} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          {menuItems.map((item, index) => (
            <DropdownMenuItem key={index} onSelect={item.onSelect}>
              <div className="flex flex-row items-center gap-4 cursor-pointer">
                <div>{item.icon}</div>
                <div>{item.label}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex">
        <BittorrentIcon className="mr-2" />
        <div className="text-3xl font-black tracking-tighter">TorrentBox</div>
      </div>

      <div className="flex flex-row items-center justify-end gap-2">
        <Button
          className="cursor-pointer"
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
        >
          {themeIcons(theme)}
        </Button>

        <MiniClock size={24} />
      </div>

      <TorrentNewMagnetDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </header>
  );
}
