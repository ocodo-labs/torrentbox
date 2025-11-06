import type { Dispatch, ReactNode, SetStateAction } from "react";

export interface MediaListingItem {
  name: string;
  href: string;
  existing?: string[];
  imageUrl?: string;
  setImageUrl?: Dispatch<SetStateAction<string | undefined>>;
}

export interface MediaListingContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  listing: MediaListingItem[];
  loading: boolean;
  error: string | null;
  fetchMagnet: (href: string) => Promise<string | null>;
  fetchListing: () => Promise<void>;
  icon: ReactNode;
  title: string;
}

export interface MediaListingModalProps {
  isOpen: boolean;
  close: () => void;
  listing: MediaListingItem[];
  loading: boolean;
  error: string | null;
  title: string;
  icon: ReactNode;
  listingTools?: MediaListingTool[];
  itemTools?: MediaItemToolType[];
}

export interface MediaItemNameFilter {
  pattern: RegExp;
  replacement?: string;
  groups?: string[];
}

export interface MediaItemToolType {
  icon: ReactNode;
  action: (media: MediaListingItem) => void | Promise<void>;
  title?: string;
  item?: MediaItemToolType;
  nameFilters?: MediaItemNameFilter[];
}

export interface MediaListingTool {
  icon: ReactNode;
  action: () => void;
  title: string;
}

export const applyNameFilters = (
  name: string,
  filters?: MediaItemNameFilter[]
): string => {
  let modifiedName = name;

  const matchingFilters = filters?.filter((filter) =>
    modifiedName.match(filter.pattern)
  );

  matchingFilters?.forEach((filter) => {
    if (filter && filter.replacement) {
      modifiedName = modifiedName.replace(filter.pattern, filter.replacement);
    }
  });

  return modifiedName;
};
