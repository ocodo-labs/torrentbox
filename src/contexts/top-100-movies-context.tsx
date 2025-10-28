import type { MediaListingContextType, MediaListingItem } from '@/contexts/media-listing-interfaces';
import { fetchListingFactory, fetchListingMagnet } from '@/lib/fetch-listing-functions';
import React, { createContext, useContext, useState } from 'react';

const Top100MoviesContext = createContext<MediaListingContextType | undefined>(undefined);

export function Top100MoviesProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [listing, setListing] = useState<MediaListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListing = fetchListingFactory<MediaListingItem[]>(
    {
      apiUrl: '/api/torrents/top-100-movies',
      setData: setListing,
      setLoading,
      setError,
    }
  )

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
    <Top100MoviesContext.Provider value={{
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
    </Top100MoviesContext.Provider >
  );
}

export const useTop100MoviesContext = () => {
  const context = useContext(Top100MoviesContext);
  if (!context) throw new Error('useTop100MoviesContext must be used within Top100MoviesProvider');
  return context;
};
