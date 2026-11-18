import { serverBaseUrl } from "@/config";
import { ModalHeader } from "@/components/modal/modal-header";
import { ModalOverlay } from "@/components/modal/modal-overlay";
import { usePinnedQueries } from "@/contexts/pinned-queries-context";
import { useTorrentSearch } from "@/contexts/torrent-search-context";
import {
  CircleDashed,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { type FC, useCallback, useEffect, useRef, useState } from "react";

interface CheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TorrentHit {
  name: string;
  magnet_link: string;
  seeds: string;
  size: string;
  category: string;
}

type ViewState =
  | { type: "refine" }
  | { type: "transition" }
  | { type: "searching" }
  | { type: "results" };

const SEARCH_DELAY_MS = 800;
const FADE_DURATION = 200;
const TRANSITION_DELAY = 1600;

export const PinnedQueriesCheckModal: FC<CheckModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { pinnedQueries } = usePinnedQueries();
  const { postTorrentMagnet } = useTorrentSearch();

  // Refine state
  const [editableQueries, setEditableQueries] = useState<string[]>([]);
  const [newQuery, setNewQuery] = useState("");

  // Search state
  const [viewState, setViewState] = useState<ViewState>({ type: "refine" });
  const [hits, setHits] = useState<TorrentHit[]>([]);
  const [currentQuery, setCurrentQuery] = useState("");
  const [progress, setProgress] = useState(0);
  const [totalQueries, setTotalQueries] = useState(0);
  const searchAbortRef = useRef(false);

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen && pinnedQueries.length > 0) {
      setEditableQueries([...pinnedQueries]);
      setNewQuery("");
      setHits([]);
      setViewState({ type: "refine" });
      searchAbortRef.current = false;
    }
    if (!isOpen) {
      searchAbortRef.current = false;
    }
  }, [isOpen, pinnedQueries]);

  // Refine actions
  const updateQuery = useCallback((index: number, value: string) => {
    setEditableQueries((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const removeQuery = useCallback((index: number) => {
    setEditableQueries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addQuery = useCallback(() => {
    const trimmed = newQuery.trim();
    if (trimmed) {
      setEditableQueries((prev) => [...prev, trimmed]);
      setNewQuery("");
    }
  }, [newQuery]);

  const handleNewQueryKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addQuery();
      }
    },
    [addQuery]
  );

  // Start the search flow
  const startSearch = useCallback(() => {
    const active = editableQueries.filter((q) => q.trim() !== "");
    if (active.length === 0) return;

    setTotalQueries(active.length);
    setHits([]);
    setProgress(0);
    searchAbortRef.current = false;

    // Phase 1: Transition
    setViewState({ type: "transition" });

    setTimeout(() => {
      // Phase 2: Searching
      setViewState({ type: "searching" });
      runSearch(active);
    }, TRANSITION_DELAY);
  }, [editableQueries]);

  // Run through queries sequentially
  const runSearch = useCallback(
    async (queries: string[]) => {
      for (let i = 0; i < queries.length; i++) {
        if (searchAbortRef.current) break;

        const query = queries[i];
        setCurrentQuery(query);
        setProgress(i + 1);

        try {
          const response = await fetch(
            `${serverBaseUrl}/torrents/search/scrape?query=${encodeURIComponent(query)}`
          );
          if (!response.ok) continue;

          const data = await response.json();
          if (!data?.results?.filter) continue;

          // Filter: has seeds, not porn
          const valid = data.results.filter(
            (r: TorrentHit) =>
              parseInt(r.seeds, 10) > 0 &&
              !r.category.toLowerCase().includes("porn")
          );

          if (valid.length > 0) {
            setHits((prev) => [...prev, ...valid]);
          }
        } catch {
          // skip
        }

        await new Promise((resolve) => setTimeout(resolve, SEARCH_DELAY_MS));
      }

      // Done
      setViewState({ type: "results" });
    },
    []
  );

  const cancelSearch = useCallback(() => {
    searchAbortRef.current = true;
  }, []);

  const handleMagnetClick = useCallback(
    async (name: string, magnet_link: string) => {
      await postTorrentMagnet(name, magnet_link);
    },
    [postTorrentMagnet]
  );

  // ─── Refine View ───────────────────────────────────────────
  if (viewState.type === "refine") {
    return (
      <ModalOverlay isOpen={isOpen} onClose={onClose}>
        <ModalHeader icon={<Search className="w-5 h-5" />} title="Did it show up yet?">
          <div className="text-sm text-muted-foreground ml-auto">
            {editableQueries.filter((q) => q.trim()).length} queries
          </div>
        </ModalHeader>

        <div className="grid gap-2 p-2 rounded-lg bg-background inset-shadow-sm max-h-[80vh] overflow-y-auto">
          {editableQueries.map((query, index) => (
            <div
              key={index}
              className="flex flex-row items-center gap-2 p-2 border border-foreground/10 rounded-lg bg-card"
            >
              <CircleDashed className="w-4 h-4 text-muted-foreground/30 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => updateQuery(index, e.target.value)}
                className="flex-1 min-w-0 text-sm bg-transparent border-none outline-none focus:ring-0 truncate"
              />
              <button
                onClick={() => removeQuery(index)}
                className="shrink-0 p-1 hover:bg-background rounded-full transition-colors"
              >
                <Trash2 className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))}

          {/* Add new query */}
          <div className="flex flex-row items-center gap-2 p-2 border border-dashed border-foreground/20 rounded-lg">
            <Plus className="w-4 h-4 text-muted-foreground/30 shrink-0" />
            <input
              type="text"
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              onKeyDown={handleNewQueryKeyDown}
              placeholder="Add a query..."
              className="flex-1 min-w-0 text-sm bg-transparent border-none outline-none focus:ring-0 truncate placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={startSearch}
            disabled={editableQueries.filter((q) => q.trim()).length === 0}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-full hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            What's out there?
          </button>
        </div>
      </ModalOverlay>
    );
  }

  // ─── Transition View ───────────────────────────────────────
  if (viewState.type === "transition") {
    return (
      <ModalOverlay isOpen={isOpen} onClose={onClose}>
        <div
          className="flex items-center justify-center h-[60vh]"
          style={{
            opacity: 1,
            transition: `opacity ${FADE_DURATION}ms ease-in-out`,
          }}
        >
          <div className="text-2xl font-light tracking-tight text-muted-foreground">
            What's out there?
          </div>
        </div>
      </ModalOverlay>
    );
  }

  // ─── Searching View ────────────────────────────────────────
  if (viewState.type === "searching") {
    return (
      <ModalOverlay isOpen={isOpen} onClose={onClose}>
        <ModalHeader icon={<Loader2 className="w-5 h-5 animate-spin" />} title="Searching">
          <button
            onClick={cancelSearch}
            className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80 transition-colors"
          >
            Cancel
          </button>
        </ModalHeader>

        {/* Progress bar */}
        <div className="px-2 pb-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(progress / totalQueries) * 100}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center truncate max-w-[80vw]">
            {currentQuery}
          </div>
        </div>

        {/* Blank area — results will fade in below */}
        <div className="grid gap-2 p-2 rounded-lg bg-background inset-shadow-sm max-h-[80vh] overflow-y-auto">
          {hits.length > 0 && (
            <div
              className="grid gap-2"
              style={{
                opacity: 1,
                transition: `opacity ${FADE_DURATION}ms ease-in`,
              }}
            >
              {hits.map((hit, index) => (
                <div
                  key={`${hit.magnet_link}-${index}`}
                  className="flex flex-col md:flex-row justify-between py-2 border-b border-secondary-foreground/10"
                >
                  <div className="flex flex-row gap-2 items-center justify-start">
                    <div className="truncate max-w-[75vw]">{hit.name}</div>
                    <a href={hit.magnet_link} target="_blank">
                      <Search className="w-4 h-4 text-muted-foreground" />
                    </a>
                  </div>
                  <div className="flex flex-row gap-3 items-center justify-between mt-1 md:mt-0">
                    <div className="text-xs text-muted-foreground">{hit.size}</div>
                    <div className="text-xs">{hit.seeds} seeds</div>
                    <button
                      onClick={() => handleMagnetClick(hit.name, hit.magnet_link)}
                      className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full hover:bg-primary/80 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalOverlay>
    );
  }

  // ─── Results View ──────────────────────────────────────────
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <ModalHeader icon={<Search className="w-5 h-5" />} title="Results">
        <div className="text-sm text-muted-foreground ml-auto">
          {hits.length} hits from {totalQueries} queries
        </div>
      </ModalHeader>

      <div className="grid gap-2 p-2 rounded-lg bg-background inset-shadow-sm max-h-[80vh] overflow-y-auto">
        {hits.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Nothing found
          </div>
        ) : (
          hits.map((hit, index) => (
            <div
              key={`${hit.magnet_link}-${index}`}
              className="flex flex-col md:flex-row justify-between py-2 border-b border-secondary-foreground/10"
            >
              <div className="flex flex-row gap-2 items-center justify-start">
                <div className="truncate max-w-[75vw]">{hit.name}</div>
                <a href={hit.magnet_link} target="_blank">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>
              <div className="flex flex-row gap-3 items-center justify-between mt-1 md:mt-0">
                <div className="text-xs text-muted-foreground">{hit.size}</div>
                <div className="text-xs">{hit.seeds} seeds</div>
                <button
                  onClick={() => handleMagnetClick(hit.name, hit.magnet_link)}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full hover:bg-primary/80 transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </ModalOverlay>
  );
};
