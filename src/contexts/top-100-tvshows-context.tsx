import type { MediaListingContextType } from '@/types/media-listing-interfaces';
import { useLinkListing } from '@/hooks/use-link-listing';

import React, { createContext, useContext } from 'react';
import { Tv2 } from 'lucide-react';
import { thinIconStyle } from '@/lib/styling';

const Top100TVShowsContext = createContext<MediaListingContextType | undefined>(undefined);

export function Top100TVShowsProvider({ children }: { children: React.ReactNode }) {
  const value = useLinkListing({
    apiUrl: 'api/torrents/1337x/top-100-television',
    icon: <Tv2 style={thinIconStyle} />,
    title: 'Top 100 TV Shows',
  });

  return (
    <Top100TVShowsContext.Provider value={value}>
      {children}
    </Top100TVShowsContext.Provider>
  );
}

export const useTop100TVShowsContext = () => {
  const context = useContext(Top100TVShowsContext);
  if (!context) throw new Error('useTop100TVShowsContext must be used within Top100TVShowsProvider');
  return context;
};
