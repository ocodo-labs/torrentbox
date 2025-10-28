import type { MediaListingContextType, MediaListingItem } from '@/contexts/media-listing-interfaces';
import { fetchListingFactory, fetchListingMagnet } from '@/lib/fetch-listing-functions';
import React, { createContext, useContext, useState } from 'react';

const Top100TVShowsContext = createContext<MediaListingContextType | undefined>(undefined);

export function Top100TVShowsProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [listing, setListing] = useState<MediaListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListing = fetchListingFactory<MediaListingItem[]>({
    apiUrl: '/api/torrents/top-100-television',
    setData: setListing,
    setLoading,
    setError,
  });

  const fetchMagnet = fetchListingMagnet

  const open = () => {
    setIsOpen(true);
    fetchListing();
  };

  const close = () => {
    setIsOpen(false);
    setError(null);
  };

  return (
    <Top100TVShowsContext.Provider value={{
      isOpen,
      open,
      close,
      listing,
      loading,
      error,
      fetchListing,
      fetchMagnet,
    }}>
      {children}
    </Top100TVShowsContext.Provider >
  );
}

export const useTop100TVShowsContext = () => {
  const context = useContext(Top100TVShowsContext);
  if (!context) throw new Error('useTop100TVShowsContext must be used within Top100TVShowsProvider');
  return context;
};
