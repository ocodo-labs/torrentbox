import { fetchTop100Magnet } from '@/lib/fetch-top100-magnet';
import React, { createContext, useContext, useState } from 'react';

interface Top100TVShow {
  name: string;
  href: string;
}

interface Top100TVShowsContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  tvShows: Top100TVShow[];
  loading: boolean;
  error: string | null;
  fetchTop100TVShowMagnet: (href: string) => Promise<string | null>;
  fetchTop100TVShows: () => Promise<void>
}

const Top100TVShowsContext = createContext<Top100TVShowsContextType | undefined>(undefined);

export function Top100TVShowsProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tvShows, setTVShows] = useState<Top100TVShow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTop100TVShows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/torrents/top-100-television');
      const data = await response.json();
      console.log(data)
      setTVShows(data);
    } catch (err) {
      setError('Failed to fetch top movies');
    } finally {
      setLoading(false);
    }
  };

  const fetchTop100TVShowMagnet = fetchTop100Magnet

  const open = () => {
    setIsOpen(true);
    fetchTop100TVShows();
  };

  const close = () => {
    setIsOpen(false);
    setError(null);
  };

  return (
    <Top100TVShowsContext.Provider value={{
      isOpen,
      open,
      close,
      tvShows,
      loading,
      error,
      fetchTop100TVShows,
      fetchTop100TVShowMagnet,
    }}>
      {children}
    </Top100TVShowsContext.Provider >
  );
}

export const useTop100TVShowsContext = () => {
  const context = useContext(Top100TVShowsContext);
  if (!context) throw new Error('useTop100TVShowsContext must be used within Top100TVShowsProvider');
  return context;
};
