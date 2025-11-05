import { thinIconStyle } from "@/lib/styling";
import { useTrendingTodayContext } from "@/contexts/trending-today-context";
import { TrendingUp } from "lucide-react";
import type { MediaItemTool } from "@/types/media-listing-interfaces";
import { mediaItemSearchInGoogle } from "./media-item-tools";
import { MediaListingModal } from "./media-listing-modal";

export function TrendingTodayModal() {
  const props = useTrendingTodayContext();
  const title = "Trending Today";
  const icon = <TrendingUp style={thinIconStyle} className="w-12 h-12" />;
  const itemTools: MediaItemTool[] = [mediaItemSearchInGoogle];

  return (
    <MediaListingModal
      itemTools={itemTools}
      title={title}
      icon={icon}
      {...props}
    />
  );
}
