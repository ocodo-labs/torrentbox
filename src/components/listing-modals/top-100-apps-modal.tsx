import { useTop100AppsContext } from "@/contexts/top-100-apps-context";
import { MediaListingModal } from "@/components/listing-modals/media-listing-modal";
import { mediaItemSearchInGoogle } from "./media-item-tools";
import type { MediaItemToolType } from "@/types/media-listing-interfaces";

export function Top100AppsMenuItem() {

}

export function Top100AppsModal() {
  const props = useTop100AppsContext();
  const itemTools: MediaItemToolType[] = [mediaItemSearchInGoogle];

  return (
    <MediaListingModal
      itemTools={itemTools}
      {...props}
    />
  );
}
