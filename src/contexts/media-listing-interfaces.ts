export interface MediaListingItem {
  name: string;
  href: string;
  existing?: string[]
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
