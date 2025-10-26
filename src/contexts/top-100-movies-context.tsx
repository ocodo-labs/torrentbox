// Top100Context.tsx
import { fetchTop100Magnet } from '@/lib/fetch-top100-magnet';
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

  const fetchTop100Movies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/torrents/top-100-movies');
      const data = await response.json();
      console.log(data)
      setMovies(data);
    } catch (err) {
      setError('Failed to fetch top movies');
    } finally {
      setLoading(false);
    }
  };

  const fetchTop100MovieMagnet = fetchTop100Magnet

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
