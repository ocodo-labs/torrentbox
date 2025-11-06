import React, { createContext, useContext } from 'react';
import type { MediaListingContextType } from '@/types/media-listing-interfaces';
import { useLinkListing } from '@/hooks/use-link-listing';
import { Gamepad2Icon } from 'lucide-react';
import { thinIconStyle } from '@/lib/styling';

const Top100GamesContext = createContext<MediaListingContextType | undefined>(undefined);

export function Top100GamesProvider({ children }: { children: React.ReactNode }) {
  const value = useLinkListing({
    apiUrl: 'api/torrents/1337x/top-100-games',
    icon: <Gamepad2Icon style={thinIconStyle} />,
    title: 'Top 100 Games'
  });

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
