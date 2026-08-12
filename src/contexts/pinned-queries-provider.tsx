import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  createContext,
  useEffect,
  useState,
} from 'react';

export interface PinnedQueriesContextType {
  pinnedQueries: string[];
  setPinnedQueries: Dispatch<SetStateAction<string[]>>;
  pinQuery: (query: string) => Promise<void>;
  unpinQuery: (query: string) => Promise<void>;
  refreshPinnedQueries: () => Promise<void>;
}

export const PinnedQueriesContext =
  createContext<PinnedQueriesContextType | undefined>(undefined);

export const PinnedQueriesProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [pinnedQueries, setPinnedQueries] = useState<string[]>([]);

  const applyPinnedQueriesResponse = (data: { queries: string[] }) => {
    setPinnedQueries(data.queries);
  };

  const refreshPinnedQueries = async () => {
    const response = await fetch('/api/pinned');

    if (!response.ok) {
      throw new Error('Failed to load pinned queries');
    }

    const data = await response.json();

    applyPinnedQueriesResponse(data);
  };

  useEffect(() => {
    refreshPinnedQueries();
  }, []);

  const pinQuery = async (query: string) => {
    const response = await fetch(
      `/api/pinned`,
      {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to pin query');
    }

    const data = await response.json();

    applyPinnedQueriesResponse(data);
  };

  const unpinQuery = async (query: string) => {
    const response = await fetch(
      `/api/pinned/${encodeURIComponent(query)}`,
      {
        method: 'DELETE'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to unpin query');
    }

    const data = await response.json();

    applyPinnedQueriesResponse(data);
  };

  return (
    <PinnedQueriesContext.Provider
      value={{
        pinnedQueries,
        setPinnedQueries,
        pinQuery,
        unpinQuery,
        refreshPinnedQueries,
      }}
    >
      {children}
    </PinnedQueriesContext.Provider>
  );
};
