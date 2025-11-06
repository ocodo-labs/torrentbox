import React, { createContext, useContext } from 'react';
import type { MediaListingContextType } from '@/types/media-listing-interfaces';
import { useLinkListing } from '@/hooks/use-link-listing';
import { thinIconStyle } from '@/lib/styling';
import { AppWindow } from 'lucide-react';

const Top100AppsContext = createContext<MediaListingContextType | undefined>(undefined);

export function Top100AppsProvider({ children }: { children: React.ReactNode }) {
  const value = useLinkListing({
    apiUrl: 'api/torrents/1337x/top-100-applications',
    icon: <AppWindow style={thinIconStyle} />,
    title: 'Top 100 Applications',
  });

  return (
    <Top100AppsContext.Provider value={value}>
      {children}
    </Top100AppsContext.Provider>
  );
}

export const useTop100AppsContext = () => {
  const context = useContext(Top100AppsContext);
  if (!context)
    throw new Error('useTop100AppsContext must be used within Top100AppsProvider');
  return context;
};
