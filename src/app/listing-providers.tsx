import { Top100AppsProvider } from "@/contexts/top-100-apps-context";
import { Top100GamesProvider } from "@/contexts/top-100-games-context";
import { Top100MoviesProvider } from "@/contexts/top-100-movies-context";
import { Top100TVShowsProvider } from "@/contexts/top-100-tvshows-context";
import { TrendingTodayProvider } from "@/contexts/trending-today-context";
import { TrendingWeekProvider } from "@/contexts/trending-week-context";

export const ListingProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <Top100AppsProvider>
      <Top100GamesProvider>
        <Top100MoviesProvider>
          <Top100TVShowsProvider>
            <TrendingTodayProvider>
              <TrendingWeekProvider>
                {children}
              </TrendingWeekProvider>
            </TrendingTodayProvider>
          </Top100TVShowsProvider>
        </Top100MoviesProvider>
      </Top100GamesProvider>
    </Top100AppsProvider>
  );
};
