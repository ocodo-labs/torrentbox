import { useTrendingWeekContext } from "@/contexts/trending-week-context";
import { thinIconStyle } from "@/lib/styling";
import type { MediaItemToolType } from "@/types/media-listing-interfaces";
import { TrendingUp } from "lucide-react";
import { mediaItemFetchPoster, mediaItemSearchInGoogle } from "./media-item-tools";
import { MediaListingModal } from "./media-listing-modal";

export function TrendingWeekModal() {
  const props = useTrendingWeekContext();
  const title = "Trending This Week";
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
