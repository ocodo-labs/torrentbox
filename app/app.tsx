import { ThemeProvider } from "@/components/theme-provider";
import { TorrentBox } from "@/components/torrent-box";
import { TorrentManagerProvider } from "@/contexts/torrent-manager-context";
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
