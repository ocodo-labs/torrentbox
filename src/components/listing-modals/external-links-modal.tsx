import { useExternalLinks } from "@/contexts/external-link-provider";
import type { MediaItemToolType } from "@/types/media-listing-interfaces";
import { mediaItemFetchPoster, mediaItemSearchInGoogle } from "./media-item-tools";
import { MediaListingModal } from "./media-listing-modal";

export function ExternalLinksModal() {
  const props = useExternalLinks();
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
