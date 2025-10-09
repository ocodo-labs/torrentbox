import { PinnedQueriesContext, type PinnedQueriesContextType } from "@/contexts/pinned-queries-provider";
import { useContext } from "react";

export const usePinnedQueries = (): PinnedQueriesContextType => {
  const context = useContext(PinnedQueriesContext);
  if (!context) {
    throw new Error('usePinnedQueries must be used within a PinnedQueriesProvider');
  }
  return context;
};