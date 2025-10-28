import type { MediaListingContextType, MediaListingItem } from '@/contexts/media-listing-interfaces';
import { fetchListingFactory, fetchListingMagnet } from '@/lib/fetch-listing-functions';
import React, { createContext, useContext, useState } from 'react';

const TrendingTodayContext = createContext<MediaListingContextType | undefined>(undefined);

export function TrendingTodayProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [listing, setListing] = useState<MediaListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListing = fetchListingFactory<MediaListingItem[]>({
    apiUrl: '/api/torrents/trending',
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
    <TrendingTodayContext.Provider value={{
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
    </TrendingTodayContext.Provider >
  );
}

export const useTrendingTodayContext = () => {
  const context = useContext(TrendingTodayContext);
  if (!context) throw new Error('useTrendingTodayContext must be used within TrendingTodayProvider');
  return context;
};
