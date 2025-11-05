import { useTop100AppsContext } from "@/contexts/top-100-apps-context";
import { MediaListingModal } from "@/components/listing-modals/media-listing-modal";
import { AppWindowIcon } from "lucide-react";
import { thinIconStyle } from "@/lib/styling";
import { mediaItemSearchInGoogle } from "./media-item-tools";
import type { MediaItemToolType } from "@/types/media-listing-interfaces";

export function Top100AppsModal() {
  const props = useTop100AppsContext();
  const title = "Top 100 Apps";
  const icon = <AppWindowIcon style={thinIconStyle} className="w-12 h-12" />;
  const itemTools: MediaItemToolType[] = [mediaItemSearchInGoogle];

  return (
    <MediaListingModal
      itemTools={itemTools}
      title={title}
      icon={icon}
      {...props}
    />
  );
}
