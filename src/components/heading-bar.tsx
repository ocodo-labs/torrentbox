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
import { useExternalLinks } from "@/contexts/external-link-provider";
import { useServerConfig } from "@/contexts/server-config-provider";
import { MiniClock } from "@/components/icons/mini-clock";

export function HeadingBar() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggleTheme, theme } = useContext(ThemeContext);
  const { open: openLinkList, title: openLinkListTitle, icon: openLinkListIcon } = useExternalLinks();
  const { open: openSettings } = useServerConfig();

  const handleAddMagnet = () => {
    setMenuOpen(false);
    setDialogOpen(true);
  };

  const menuItems = [
    {
      onSelect: openLinkList,
      icon: openLinkListIcon,
      label: openLinkListTitle
    },
    {
      onSelect: openSettings,
      icon: <Settings2Icon className="mr-2 w-6 h-6" style={thinIconStyle} />,
      label: 'Settings'
    },
    {
      onSelect: handleAddMagnet,
      icon: <Magnet className="mr-2 w-6 h-6" style={thinIconStyle} />,
      label: "Add magnet"
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
        <div className="text-3xl font-black tracking-tighter select-none">TorrentBox</div>
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
