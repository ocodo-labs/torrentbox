import type { MediaListingContextType } from '@/types/media-listing-interfaces';
import { useLinkListing } from '@/hooks/use-link-listing';
import React, { createContext, useContext } from 'react';
import { TrendingUp } from 'lucide-react';
import { thinIconStyle } from '@/lib/styling';

const TrendingTodayContext = createContext<MediaListingContextType | undefined>(undefined);

export function TrendingTodayProvider({ children }: { children: React.ReactNode }) {
  const value = useLinkListing({
    apiUrl: 'api/torrents/1337x/trending',
    icon: <TrendingUp style={thinIconStyle} />,
    title: 'Trending Today',
  });

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
