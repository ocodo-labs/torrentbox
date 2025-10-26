// Top100Context.tsx
import { fetchListingFactory, fetchListingMagnet } from '@/lib/fetch-listing-functions';
import React, { createContext, useContext, useState } from 'react';

interface Top100Movie {
  name: string;
  href: string;
  existing: string[];
}

interface Top100MoviesContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  movies: Top100Movie[];
  loading: boolean;
  error: string | null;
  fetchTop100MovieMagnet: (href: string) => Promise<string | null>;
  fetchTop100Movies: () => Promise<void>
}

const Top100MoviesContext = createContext<Top100MoviesContextType | undefined>(undefined);

export function Top100MoviesProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [movies, setMovies] = useState<Top100Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTop100Movies = fetchListingFactory<Top100Movie[]>(
    {
      apiUrl: '/api/torrents/top-100-movies',
      setData: setMovies,
      setLoading,
      setError,
    }
  )

  const fetchTop100MovieMagnet = fetchListingMagnet

  const open = () => {
    setIsOpen(true);
    fetchTop100Movies();
  };

  const close = () => {
    setIsOpen(false);
    setError(null);
  };

  return (
    <Top100MoviesContext.Provider value={{
      isOpen,
      open,
      close,
      movies,
      loading,
      error,
      fetchTop100Movies,
      fetchTop100MovieMagnet,
    }}>
      {children}
    </Top100MoviesContext.Provider >
  );
}

export const useTop100MoviesContext = () => {
  const context = useContext(Top100MoviesContext);
  if (!context) throw new Error('useTop100MoviesContext must be used within Top100MoviesProvider');
  return context;
};
