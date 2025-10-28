import type { MediaListingItem } from "@/contexts/media-listing-interfaces";

export function compare(a: MediaListingItem, b: MediaListingItem) {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}

export const listingOrdered = (ordered: Boolean, listing: MediaListingItem[]) => {
  const list = Array.from(listing);
  return ordered ? list.sort(compare) : list;
};
