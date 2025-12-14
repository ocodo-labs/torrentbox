import { useState, useCallback, type ReactNode } from 'react';
import { fetchListingFactory, fetchListingMagnet } from '@/lib/fetch-listing-functions';
import type { MediaListingItem } from '@/types/media-listing-interfaces';

interface UseLinkListingOptions {
  linksUrl: string;
  title: string;
  icon: ReactNode;
}

export function useLinkListing({ linksUrl, title, icon }: UseLinkListingOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [listing, setListing] = useState<MediaListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListing = useCallback(
    fetchListingFactory<MediaListingItem[]>({
      linksUrl,
      setData: setListing,
      setLoading,
      setError,
    }),
    [linksUrl]
  );

  const fetchMagnet = fetchListingMagnet;

  const open = useCallback(() => {
    setIsOpen(true);
    fetchListing();
  }, [fetchListing]);

  const close = useCallback(() => {
    setIsOpen(false);
    setError(null);
  }, []);

  return {
    isOpen,
    open,
    close,
    listing,
    loading,
    error,
    fetchListing,
    fetchMagnet,
    title,
    icon,
  };
}
