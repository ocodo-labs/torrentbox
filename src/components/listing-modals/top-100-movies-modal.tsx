import { useTop100MoviesContext } from "@/contexts/top-100-movies-context";
import { thinIconStyle } from "@/lib/styling";
import { Film } from "lucide-react";
import { MediaListingModal } from "@/components/listing-modals/media-listing-modal";
import type { MediaItemTool } from "@/types/media-listing-interfaces";
import {
  mediaItemFetchPoster,
  mediaItemSearchInGoogle,
} from "./media-item-tools";

export function Top100MoviesModal() {
  const props = useTop100MoviesContext();
  const title = "Top 100 Movies";
  const icon = <Film style={thinIconStyle} className="w-12 h-12" />;
  const itemTools: MediaItemTool[] = [
    mediaItemFetchPoster,
    mediaItemSearchInGoogle,
  ];

  return (
    <MediaListingModal
      itemTools={itemTools}
      icon={icon}
      title={title}
      {...props}
    />
  );
}
