import type { MediaListingContextType } from '@/types/media-listing-interfaces';
import { useLinkListing } from '@/hooks/use-link-listing';
import React, { createContext, useContext } from 'react';

const TrendingWeekContext = createContext<MediaListingContextType | undefined>(undefined);

export function TrendingWeekProvider({ children }: { children: React.ReactNode }) {
  const value = useLinkListing({ apiUrl: 'api/torrents/1337x/trending-week' });
  return (
    <TrendingWeekContext.Provider value={value}>
      {children}
    </TrendingWeekContext.Provider>
  );
}

export const useTrendingWeekContext = () => {
  const context = useContext(TrendingWeekContext);
  if (!context) throw new Error('useTrendingWeekContext must be used within TrendingWeekProvider');
  return context;
};
