import { thinIconStyle } from "@/lib/styling";
import { useTrendingTodayContext } from "@/contexts/trending-today-context";
import { TrendingUp } from "lucide-react";
import type { MediaItemToolType } from "@/types/media-listing-interfaces";
import { MediaListingModal } from "@/components/listing-modals/media-listing-modal";
import { mediaItemFetchPoster, mediaItemSearchInGoogle } from "@/components/listing-modals/media-item-tools";


export function TrendingTodayModal() {
  const props = useTrendingTodayContext();
  const title = "Trending Today";
  const icon = <TrendingUp style={thinIconStyle} className="w-12 h-12" />;

  const itemTools: MediaItemToolType[] = [
    mediaItemFetchPoster,
    mediaItemSearchInGoogle,
  ];

  return (
    <MediaListingModal
      itemTools={itemTools}
      title={title}
      icon={icon}
      {...props}
    />
  );
}
