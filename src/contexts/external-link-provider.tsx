import type { MediaListingContextType } from '@/types/media-listing-interfaces';
import { useLinkListing } from '@/hooks/use-link-listing';
import React, { createContext, useContext } from 'react';
import { thinIconStyle } from '@/lib/styling';
import { BittorrentIcon } from '@/components/icons/bit-torrent-icon';

const ExternalLinkContext = createContext<MediaListingContextType | undefined>(undefined);

export function ExternalLinkProvider({ children }: { children: React.ReactNode }) {
  const value = useLinkListing({
    linksUrl: 'api/external_links',
    icon: <BittorrentIcon  style={thinIconStyle} />,
    title: 'Links'
  });

  console.log(`External Link Provider:`)
  console.log(value)

  return (
    <ExternalLinkContext.Provider value={value}>
      {children}
    </ExternalLinkContext.Provider>
  );
}

export const useExternalLinks = () => {
  const context = useContext(ExternalLinkContext);
  if (!context) throw new Error('useExternalLinks must be used within ExternalLinkProvider');
  return context;
};
