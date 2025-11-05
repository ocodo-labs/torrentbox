import React, { createContext, useContext } from 'react';
import type { MediaListingContextType } from '@/contexts/media-listing-interfaces';
import { useLinkListing } from '@/hooks/use-link-listing';

const Top100GamesContext = createContext<MediaListingContextType | undefined>(undefined);

export function Top100GamesProvider({ children }: { children: React.ReactNode }) {
  const value = useLinkListing({ apiUrl: 'api/torrents/1337x/top-100-games' });
  return (
    <Top100GamesContext.Provider value={value}>
      {children}
    </Top100GamesContext.Provider>
  );
}

export const useTop100GamesContext = () => {
  const context = useContext(Top100GamesContext);
  if (!context)
    throw new Error('useTop100GamesContext must be used within Top100GamesProvider');
  return context;
};
