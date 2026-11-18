import { serverBaseUrl } from "@/config";
import { ModalHeader } from "@/components/modal/modal-header";
import { ModalOverlay } from "@/components/modal/modal-overlay";
import { usePinnedQueries } from "@/contexts/pinned-queries-context";
import { Check, Search, X } from "lucide-react";
import { type FC, useCallback, useEffect, useRef, useState } from "react";

interface CheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CheckResult {
  query: string;
  status: "idle" | "searching" | "matched" | "not-found";
  torrentName?: string;
}

interface TorrentSearchResult {
  name: string;
  magnet_link: string;
  seeds: string;
  size: string;
  category: string;
}

const SEARCH_DELAY_MS = 800; // don't hammer the server

export const PinnedQueriesCheckModal: FC<CheckModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { pinnedQueries } = usePinnedQueries();
  const [editableQueries, setEditableQueries] = useState<string[]>([]);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const searchAbortRef = useRef(false);

  // Initialize editable queries when modal opens
  useEffect(() => {
    if (isOpen && pinnedQueries.length > 0) {
      setEditableQueries([...pinnedQueries]);
      setResults(
        pinnedQueries.map((query) => ({
          query,
          status: "idle",
        }))
      );
      setCurrentProgress(0);
    }
    if (!isOpen) {
      searchAbortRef.current = false;
    }
  }, [isOpen, pinnedQueries]);

  const updateResult = useCallback((index: number, updates: Partial<CheckResult>) => {
    setResults((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }, []);

  const searchSingleQuery = useCallback(async (query: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${serverBaseUrl}/torrents/search/scrape?query=${encodeURIComponent(query)}`
      );
      if (!response.ok) return false;
      const data = await response.json();
      if (!data?.results?.filter) return false;
      // Check if any result matches (has seeds and isn't porn)
      const hasMatch = data.results.some(
        (r: TorrentSearchResult) =>
          parseInt(r.seeds, 10) > 0 &&
          !r.category.toLowerCase().includes("porn")
      );
      return hasMatch;
    } catch {
      return false;
    }
  }, []);

  const searchAll = useCallback(async () => {
    setIsSearching(true);
    searchAbortRef.current = false;

    for (let i = 0; i < editableQueries.length; i++) {
      if (searchAbortRef.current) break;

      const query = editableQueries[i];
      setCurrentProgress(i + 1);

      // Update status to searching
      updateResult(i, { query, status: "searching" });

      // Search this query
      const hasMatch = await searchSingleQuery(query);

      if (!searchAbortRef.current) {
        updateResult(i, {
          query,
          status: hasMatch ? "matched" : "not-found",
          torrentName: hasMatch ? "Found in search" : undefined,
        });
      }

      // Wait before next search
      await new Promise((resolve) => setTimeout(resolve, SEARCH_DELAY_MS));
    }

    setIsSearching(false);
    setCurrentProgress(editableQueries.length);
  }, [editableQueries, searchSingleQuery, updateResult]);

  const cancelSearch = useCallback(() => {
    searchAbortRef.current = true;
  }, []);

  const handleQueryChange = useCallback((index: number, value: string) => {
    setEditableQueries((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    // Reset result for this query when edited
    updateResult(index, { query: value, status: "idle" });
  }, [updateResult]);

  const matchedCount = results.filter((r) => r.status === "matched").length;

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <ModalHeader icon={<Search className="w-5 h-5" />} title="Did it show up yet?">
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {matchedCount}/{editableQueries.length} found
          </div>
          {!isSearching && editableQueries.length > 0 && (
            <button
              onClick={searchAll}
              className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-full hover:bg-primary/80 transition-colors"
            >
              Search All
            </button>
          )}
          {isSearching && (
            <button
              onClick={cancelSearch}
              className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </ModalHeader>

      {/* Progress bar */}
      {isSearching && (
        <div className="px-2 pb-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentProgress / editableQueries.length) * 100}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1 text-center">
            Searching: {editableQueries[currentProgress - 1] || "..."}
          </div>
        </div>
      )}

      <div className="grid gap-2 p-2 rounded-lg bg-background inset-shadow-sm max-h-[80vh] overflow-y-auto">
        {results.map((result, index) => (
          <div
            key={index}
            className={`flex flex-row items-center gap-3 p-3 border rounded-lg transition-all duration-300 ${
              result.status === "searching"
                ? "border-blue-500/50 bg-blue-500/5 scale-[1.02]"
                : result.status === "matched"
                ? "border-green-500/30 bg-green-500/5"
                : result.status === "not-found"
                ? "border-foreground/10 bg-card"
                : "border-foreground/10 bg-card"
            }`}
          >
            {/* Status icon */}
            <div className="shrink-0 w-4 h-4 flex items-center justify-center">
              {result.status === "searching" ? (
                <div className="animate-spin w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full" />
              ) : result.status === "matched" ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : result.status === "not-found" ? (
                <X className="w-4 h-4 text-muted-foreground/50" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/20" />
              )}
            </div>

            {/* Editable query */}
            <input
              type="text"
              value={result.query}
              onChange={(e) => handleQueryChange(index, e.target.value)}
              className="flex-1 min-w-0 text-sm bg-transparent border-none outline-none focus:ring-0 truncate"
              disabled={isSearching}
            />

            {/* Matched torrent name */}
            {result.status === "matched" && result.torrentName && (
              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                → {result.torrentName}
              </div>
            )}
          </div>
        ))}
      </div>
    </ModalOverlay>
  );
};
