import type { ReactNode } from "react";

export interface MediaListingItem {
  name: string;
  href: string;
  existing?: string[]
  imageUrl?: string,
}

export interface MediaListingContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  listing: MediaListingItem[];
  loading: boolean;
  error: string | null;
  fetchMagnet: (href: string) => Promise<string | null>;
  fetchListing: () => Promise<void>
}

export interface MediaListingModalProps {
  isOpen: boolean;
  close: () => void;
  listing: MediaListingItem[];
  loading: boolean;
  error: string | null;
  title: string;
  icon: ReactNode;
  listingTools?: MediaListingTool[]
  itemTools?: MediaItemTool[]
}

export interface MediaItemTool {
  icon: ReactNode;
  action: (media: MediaListingItem) => void | Promise<void>;
  title: string;
}

export interface MediaListingTool {
  icon: ReactNode;
  action: () => void;
  title: string;
}
