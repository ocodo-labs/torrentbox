import { ThemeProvider } from "@/contexts/theme-provider";
import { TransmissionProvider } from "@/contexts/transmission-provider";
import { TorrentBox } from "@/components/torrent-box";
import { Toaster } from "sonner";
import { PinnedQueriesProvider } from "@/contexts/pinned-queries-provider";
import { TorrentSearchProvider } from "@/contexts/torrent-search-provider";

export default function App() {
  return (
    <ThemeProvider>
      <TransmissionProvider>
        <PinnedQueriesProvider>
          <TorrentSearchProvider>
            <>
              <TorrentBox />
              <Toaster
                position="bottom-center"
                theme='dark'
                richColors />
            </>
          </TorrentSearchProvider>
        </PinnedQueriesProvider>
      </TransmissionProvider>
    </ThemeProvider>
  );
}
