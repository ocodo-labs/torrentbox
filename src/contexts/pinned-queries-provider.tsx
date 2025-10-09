import React, { createContext, type ReactNode } from 'react';
import { useLocalStorage } from 'usehooks-ts';

export interface PinnedQueriesContextType {
  pinnedQueries: string[];
  setPinnedQueries: React.Dispatch<React.SetStateAction<string[]>>;
  pinQuery: (query: string) => void;
  unpinQuery: (query: string) => void;
}

export const PinnedQueriesContext = createContext<PinnedQueriesContextType | undefined>(undefined);

export const PinnedQueriesProvider = ({ children }: { children: ReactNode }) => {
  const [pinnedQueries, setPinnedQueries] = useLocalStorage<string[]>('pinned-search-queries', []);

  const pinQuery = (query: string) => {
    setPinnedQueries(prev => Array.from(new Set([...prev, query])));
  };

  const unpinQuery = (query: string) => {
    setPinnedQueries(prev => prev.filter(q => q !== query));
  };

  return (
    <PinnedQueriesContext.Provider
      value={{ pinnedQueries, setPinnedQueries, pinQuery, unpinQuery }}
    >
      {children}
    </PinnedQueriesContext.Provider>
  );
};


