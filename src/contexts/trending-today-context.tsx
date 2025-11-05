import type { MediaListingContextType } from '@/types/media-listing-interfaces';
import { useLinkListing } from '@/hooks/use-link-listing';
import React, { createContext, useContext } from 'react';

const TrendingTodayContext = createContext<MediaListingContextType | undefined>(undefined);

export function TrendingTodayProvider({ children }: { children: React.ReactNode }) {
  const value = useLinkListing({ apiUrl: 'api/torrents/1337x/trending' });
  return (
    <TrendingTodayContext.Provider value={value}>
      {children}
    </TrendingTodayContext.Provider>
  );
}

export const useTrendingTodayContext = () => {
  const context = useContext(TrendingTodayContext);
  if (!context) throw new Error('useTrendingTodayContext must be used within TrendingTodayProvider');
  return context;
};
