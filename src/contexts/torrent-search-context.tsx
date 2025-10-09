import { TorrentSearchContext, type TorrentSearchContextType } from "@/contexts/torrent-search-provider";
import { useContext } from "react";

export const useTorrentSearch = (): TorrentSearchContextType => {
  const context = useContext(TorrentSearchContext);
  if (!context) {
    throw new Error('useTorrentSearch must be used within a TorrentSearchProvider');
  }
  return context;
};
