import type { MediaListingContextType, MediaListingItem } from '@/contexts/media-listing-interfaces';
import { fetchListingFactory, fetchListingMagnet } from '@/lib/fetch-listing-functions';
import React, { createContext, useContext, useState } from 'react';

const TrendingWeekContext = createContext<MediaListingContextType | undefined>(undefined);

export function TrendingWeekProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [listing, setListing] = useState<MediaListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListing = fetchListingFactory<MediaListingItem[]>({
    apiUrl: '/api/torrents/trending-week',
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
    <TrendingWeekContext.Provider value={{
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
    </TrendingWeekContext.Provider >
  );
}

export const useTrendingWeekContext = () => {
  const context = useContext(TrendingWeekContext);
  if (!context) throw new Error('useTrendingWeekContext must be used within TrendingWeekProvider');
  return context;
};
