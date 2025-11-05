import { Top100AppsModal } from "@/components/listing-modals/top-100-apps-modal";
import { Top100GamesModal } from "@/components/listing-modals/top-100-games-modal";
import { Top100MoviesModal } from "@/components/listing-modals/top-100-movies-modal";
import { Top100TVShowsModal } from "@/components/listing-modals/top-100-tvshows-modal";
import { TrendingTodayModal } from "@/components/listing-modals/trending-today-modal";
import { TrendingWeekModal } from "@/components/listing-modals/trending-week-modal";
import { ServerConfigModal } from "@/components/server-config-modal";


export const Modals = () => {
  return (
    <>
      <Top100AppsModal />
      <Top100GamesModal />
      <Top100MoviesModal />
      <Top100TVShowsModal />
      <TrendingTodayModal />
      <TrendingWeekModal />
      <ServerConfigModal />
    </>
  );
}
