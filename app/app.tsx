import { ThemeProvider } from "@/contexts/theme-provider";
import { TorrentManagerProvider } from "@/contexts/torrent-manager-context";
import { TorrentBox } from "@/components/torrent-box";
import { Toaster } from "sonner";

export default function App() {
  return (
    <ThemeProvider>
      <TorrentManagerProvider>
        <>
          <TorrentBox />
          <Toaster
            position="bottom-center"
            theme='dark'
            richColors />
        </>
      </TorrentManagerProvider>
    </ThemeProvider>
  );
}
