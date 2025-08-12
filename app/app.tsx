import { ThemeProvider } from "@/contexts/theme-provider";
import { TorrentProvider } from "@/contexts/torrent-provider";
import { TorrentBox } from "@/components/torrent-box";
import { Toaster } from "sonner";

export default function App() {
  return (
    <ThemeProvider>
      <TorrentProvider>
        <>
          <TorrentBox />
          <Toaster
            position="bottom-center"
            theme='dark'
            richColors />
        </>
      </TorrentProvider>
    </ThemeProvider>
  );
}
