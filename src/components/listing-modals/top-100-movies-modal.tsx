import { useTop100MoviesContext } from "@/contexts/top-100-movies-context";
import { MediaListingModal } from "@/components/listing-modals/media-listing-modal";
import type { MediaItemToolType } from "@/types/media-listing-interfaces";
import {
  mediaItemFetchPoster,
  mediaItemSearchInGoogle,
} from "./media-item-tools";

export function Top100MoviesModal() {
  const props = useTop100MoviesContext();
  const itemTools: MediaItemToolType[] = [
    mediaItemFetchPoster,
    mediaItemSearchInGoogle,
  ];

  return (
    <MediaListingModal
      itemTools={itemTools}
      {...props}
    />
  );
}
