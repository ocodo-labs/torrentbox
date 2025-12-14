import { useExternalLinks } from "@/contexts/external-link-provider";
import type { MediaItemToolType } from "@/types/media-listing-interfaces";
import { mediaItemFetchPoster, mediaItemSearchInGoogle } from "./media-item-tools";
import { LinkListingModal } from "@/components/listing-modals/link-listing-modal";

export function ExternalLinksModal() {
  const props = useExternalLinks();
  const itemTools: MediaItemToolType[] = [
    mediaItemFetchPoster,
    mediaItemSearchInGoogle,
  ];

  return (
    <LinkListingModal
      itemTools={itemTools}
      {...props}
    />
  );
}
