import React, { createContext, useContext } from 'react';
import type { MediaListingContextType } from '@/contexts/media-listing-interfaces';
import { useLinkListing } from '@/hooks/use-link-listing';

const Top100MoviesContext = createContext<MediaListingContextType | undefined>(undefined);

export function Top100MoviesProvider({ children }: { children: React.ReactNode }) {
  const value = useLinkListing({ apiUrl: 'api/torrents/1337x/top-100-movies' });
  return (
    <Top100MoviesContext.Provider value={value}>
      {children}
    </Top100MoviesContext.Provider>
  );
}

export const useTop100MoviesContext = () => {
  const context = useContext(Top100MoviesContext);
  if (!context)
    throw new Error('useTop100MoviesContext must be used within Top100MoviesProvider');
  return context;
};
