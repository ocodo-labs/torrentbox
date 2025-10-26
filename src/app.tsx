import { ThemeProvider } from "@/contexts/theme-provider";
import { TransmissionProvider } from "@/contexts/transmission-provider";
import { TorrentBox } from "@/components/torrent-box";
import { Toaster } from "sonner";
import { PinnedQueriesProvider } from "@/contexts/pinned-queries-provider";
import { TorrentSearchProvider } from "@/contexts/torrent-search-provider";
import { Top100MoviesProvider } from "@/contexts/top-100-movies-context";
import { Top100MoviesModal } from "@/components/top-100-movies-modal";
import { Top100TVShowsProvider } from "@/contexts/top-100-tvshows-context";
import { Top100TVShowsModal } from "@/components/top-100-tvshows-modal";

export default function App() {
  return (
    <ThemeProvider>
      <Top100MoviesProvider>
        <Top100TVShowsProvider>
          <TransmissionProvider>
            <PinnedQueriesProvider>
              <TorrentSearchProvider>
                <>
                  <TorrentBox />
                  <Top100MoviesModal />
                  <Top100TVShowsModal />
                  <Toaster
                    position="bottom-center"
                    theme='dark'
                    richColors />
                </>
              </TorrentSearchProvider>
            </PinnedQueriesProvider>
          </TransmissionProvider>
        </Top100TVShowsProvider>
      </Top100MoviesProvider>
    </ThemeProvider>
  );
}
