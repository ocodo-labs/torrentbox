import { fetchPosterForMediaItem } from "@/lib/fetch-listing-functions";
import { thinIconStyle } from "@/lib/styling";
import type { MediaItemTool } from "@/types/media-listing-interfaces";
import { Film, SearchIcon } from "lucide-react";

export const mediaItemFetchPoster: MediaItemTool = {
  icon: <Film style={thinIconStyle} />,
  action: fetchPosterForMediaItem,
  title: "Lookup Poster",
};

export const mediaItemSearchInGoogle: MediaItemTool = {
  icon: <SearchIcon style={thinIconStyle} />,
  action: (media) => {
    window.open(
      `https://google.com/search?q=${encodeURIComponent(media.name)}`
    );
  },
  title: "Search in Google",
};
