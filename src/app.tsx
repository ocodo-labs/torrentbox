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
import { TrendingTodayProvider } from "@/contexts/trending-today-context";
import { TrendingTodayModal } from "@/components/trending-today-modal";
import { TrendingWeekModal } from "@/components/trending-week-modal";
import { TrendingWeekProvider } from "@/contexts/trending-week-context";

export default function App() {
  return (
    <ThemeProvider>
      <Top100MoviesProvider>
        <Top100TVShowsProvider>
          <TrendingTodayProvider>
            <TrendingWeekProvider>
              <TransmissionProvider>
                <PinnedQueriesProvider>
                  <TorrentSearchProvider>
                    <>
                      <TorrentBox />
                      <Top100MoviesModal />
                      <Top100TVShowsModal />
                      <TrendingTodayModal />
                      <TrendingWeekModal />
                      <Toaster
                        position="bottom-center"
                        theme='dark'
                        richColors />
                    </>
                  </TorrentSearchProvider>
                </PinnedQueriesProvider>
              </TransmissionProvider>
            </TrendingWeekProvider>
          </TrendingTodayProvider>
        </Top100TVShowsProvider>
      </Top100MoviesProvider>
    </ThemeProvider>
  );
}
