import { cleanNameForSearch, fetchPosterForMediaItem } from "@/lib/fetch-listing-functions";
import { modalItemToolIconClasses, thinIconStyle } from "@/lib/styling";
import type { MediaItemToolType } from "@/types/media-listing-interfaces";
import { Film, SearchIcon } from "lucide-react";

export const mediaItemFetchPoster: MediaItemToolType = {
  icon: <Film style={thinIconStyle} className={modalItemToolIconClasses} />,
  action: fetchPosterForMediaItem,
  title: "Look for {name} Poster image",
};

export const mediaItemSearchInGoogle: MediaItemToolType = {
  icon: <SearchIcon style={thinIconStyle} className={modalItemToolIconClasses} />,
  action: (media) => {
    window.open(
      `https://google.com/search?q=${encodeURIComponent(cleanNameForSearch(media.name))}`
    );
  },
  title: `Search for {name} with Google`,
};
