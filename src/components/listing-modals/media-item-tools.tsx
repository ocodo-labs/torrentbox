import { cleanNameForSearch, fetchPosterForMediaItem } from "@/lib/fetch-listing-functions";
import { modalItemToolIconClasses, thinIconStyle } from "@/lib/styling";
import type { MediaItemNameFilter, MediaItemToolType } from "@/types/media-listing-interfaces";

import { ImageIcon, SearchIcon } from "lucide-react";

export const videoNameFilter: MediaItemNameFilter = {
  pattern: /^(.*?)(mp4|ac3|[-._ ]BONE|uhd|bdremux|dv\/hdr10|bluray|-elite|dts-hd|mkv|avi|1080p|720p|2160p|480p|520p|IMAX|4k|hdrip|brrip|web[- ]?dl|amzn|-rmteam|hdr10|web[- ]?rip|dvdrip|bluray|xvid|h\.?264|h\.?265|hevc)+.*$/i,
  replacement: '$1',
  groups: ['name', 'format']
}

export const tvSeasonNameFilter: MediaItemNameFilter = {
  pattern: /^(.*)[^\w](season[\s._-]?\d{1,2}).*$/i,
  replacement: '$1 $2',
  groups: ['name', 'season']
}

export const tvShowNameFilter: MediaItemNameFilter = {
  pattern: /^(.*)(s\d{1,2}e\d{1,2}).*$/i,
  replacement: '$1 $2',
  groups: ['name', 'episode']
}

export const miscToSpace: MediaItemNameFilter = {
  pattern: /[._\-]/g,
  replacement: ' ',
  groups: ['name']
}

export const flushMisc: MediaItemNameFilter = {
  pattern: /[^\w\s]/g,
  replacement: '',
  groups: ['name']
}

export const squeezeSpaces: MediaItemNameFilter = {
  pattern: /\s+/g,
  replacement: ' ',
  groups: ['name']
}

export const mediaItemFetchPoster: MediaItemToolType = {
  icon: <ImageIcon style={thinIconStyle} className={modalItemToolIconClasses} />,
  action: fetchPosterForMediaItem,
  title: "Look for {name} Poster image",
  nameFilters: [videoNameFilter, tvSeasonNameFilter, tvShowNameFilter, miscToSpace, squeezeSpaces, flushMisc],
};

export const mediaItemSearchInGoogle: MediaItemToolType = {
  icon: <SearchIcon style={thinIconStyle} className={modalItemToolIconClasses} />,
  action: (media) => {
    window.open(
      `https://google.com/search?q=${encodeURIComponent(cleanNameForSearch(media.name))}`
    );
  },
  title: `Search for {name} with Google`,
  nameFilters: [videoNameFilter, tvSeasonNameFilter, tvShowNameFilter, miscToSpace, squeezeSpaces, flushMisc],
};
