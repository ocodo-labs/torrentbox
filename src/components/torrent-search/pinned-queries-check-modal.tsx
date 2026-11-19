import { serverBaseUrl } from "@/config";
import { ModalHeader } from "@/components/modal/modal-header";
import { ModalOverlay } from "@/components/modal/modal-overlay";
import { LineMdDownloadIcon } from "@/components/line-md-download-icon";
import { usePinnedQueries } from "@/contexts/pinned-queries-context";
import { useTorrentSearch } from "@/contexts/torrent-search-context";
import { thinIconStyle } from "@/lib/styling";
import {
  CircleDashed,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  X,
  CircleX,
  Ban,
  Check,
} from "lucide-react";
import { type FC, useCallback, useEffect, useRef, useState } from "react";

const REJECTED_QUERIES_STORAGE_KEY = "torrentbox:rejected-pinned-queries";

function loadRejectedQueries(): string[] {
  try {
    const raw = localStorage.getItem(REJECTED_QUERIES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function saveRejectedQueries(rejected: string[]) {
  localStorage.setItem(REJECTED_QUERIES_STORAGE_KEY, JSON.stringify(rejected));
}

interface CheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TorrentHit {
  name: string;
  magnet_link: string;
  href: string;
  seeds: string;
  size: string;
  category: string;
}

type ViewState =
  | { type: "refine" }
  | { type: "transition" }
  | { type: "searching" }
  | { type: "results" };

type RejectModeState =
  | { mode: "idle" }
  | { mode: "active"; selected: Set<string> };

function hitKey(hit: TorrentHit): string {
  return `${hit.name}::${hit.magnet_link}`;
}

const SEARCH_DELAY_MS = 800;
const FADE_DURATION = 200;

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
  const [filteredCount, setFilteredCount] = useState(0);
  const searchAbortRef = useRef(false);

  // Reject mode state
  const [rejectMode, setRejectMode] = useState<RejectModeState>({ mode: "idle" });
  const [persistedRejected, setPersistedRejected] = useState<Set<string>>(() => {
    return new Set(loadRejectedQueries());
  });

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen && pinnedQueries.length > 0) {
      setEditableQueries([...pinnedQueries]);
      setNewQuery("");
      setHits([]);
      setFilteredCount(0);
      setViewState({ type: "refine" });
      searchAbortRef.current = false;
      setRejectMode({ mode: "idle" });
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

    setViewState({ type: "searching" });
    runSearch(active);
  }, [editableQueries]);

  // Run through queries sequentially
  const runSearch = useCallback(
    async (queries: string[]) => {
      const allHits: TorrentHit[] = [];

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

          // Filter: has seeds, not porn, max 5 per query
          const valid = data.results.filter(
            (r: TorrentHit) =>
              parseInt(r.seeds, 10) > 0 &&
              !r.category.toLowerCase().includes("porn")
          ).slice(0, 5);

          if (valid.length > 0) {
            allHits.push(...valid);
          }
        } catch {
          // skip
        }

        await new Promise((resolve) => setTimeout(resolve, SEARCH_DELAY_MS));
      }

      // Filter out previously rejected items before showing results
      const filtered = allHits.filter((h) => !persistedRejected.has(h.name));
      const countFiltered = allHits.length - filtered.length;

      setHits(filtered);
      setFilteredCount(countFiltered);

      // Done
      setViewState({ type: "results" });
    },
    [persistedRejected]
  );

  const cancelSearch = useCallback(() => {
    searchAbortRef.current = true;
  }, []);

  // ─── Reject Mode Handlers ──────────────────────────────────
  const toggleRejectMode = useCallback(() => {
    setRejectMode((prev) => {
      if (prev.mode === "idle") {
        return { mode: "active", selected: new Set() };
      }
      return { mode: "idle", selected: new Set() };
    });
  }, []);

  const toggleHitSelection = useCallback((hit: TorrentHit) => {
    setRejectMode((prev) => {
      if (prev.mode !== "active") return prev;
      const next = new Set(prev.selected);
      const key = hitKey(hit);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return { mode: "active", selected: next };
    });
  }, []);

  const cancelRejectMode = useCallback(() => {
    setRejectMode({ mode: "idle" });
  }, []);

  const completeRejectMode = useCallback(() => {
    // Capture current state synchronously before any updates
    const selectedKeys = rejectMode.selected;
    const rejectedNames: string[] = [];
    for (const hit of hits) {
      if (selectedKeys.has(hitKey(hit))) {
        rejectedNames.push(hit.name);
      }
    }

    // Persist to localStorage
    const currentPersisted = loadRejectedQueries();
    const merged = Array.from(
      new Set([...currentPersisted, ...rejectedNames])
    );
    saveRejectedQueries(merged);

    // Update all state at once
    setRejectMode({ mode: "idle" });
    setPersistedRejected(new Set(merged));
    setHits((prev) => prev.filter((h) => !selectedKeys.has(hitKey(h))));
    setFilteredCount((prev) => prev + rejectedNames.length);
  }, [hits, rejectMode]);

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

        <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-background inset-shadow-sm flex-1 min-h-0 overflow-y-auto">
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
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))}

          {/* Add new query */}
          <div className="col-span-2 flex flex-row items-center gap-2 p-2 border border-dashed border-foreground/20 rounded-lg">
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
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-full hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Search
          </button>
        </div>
      </ModalOverlay>
    );
  }

  // ─── Searching View ────────────────────────────────────────
  if (viewState.type === "searching") {
    return (
      <ModalOverlay isOpen={isOpen} onClose={onClose}>
        <ModalHeader icon={<Loader2 className="w-5 h-5 animate-spin" />} title="Searching">
          <button onClick={cancelSearch}>
            <CircleX className="w-4 h-4 text-muted-foreground" />
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
                    <a href={hit.href} target="_blank">
                      <ExternalLink style={thinIconStyle} className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="flex flex-row gap-3 items-center justify-between mt-1 md:mt-0">
                    <div className="text-xs text-muted-foreground">{hit.size}</div>
                    <div className="text-xs">{hit.seeds} seeds</div>
                    <button
                      onClick={() => handleMagnetClick(hit.name, hit.magnet_link)}
                    >
                      <LineMdDownloadIcon className="h-4 w-4" style={thinIconStyle} />
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
  const isRejectMode = rejectMode.mode === "active";
  const selectedCount = isRejectMode ? rejectMode.selected.size : 0;

  // hits is already filtered at search time; visibleHits is the same set
  const visibleHits = hits;

  const isHitSelected = (hit: TorrentHit): boolean => {
    if (!isRejectMode) return false;
    return rejectMode.selected.has(hitKey(hit));
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <ModalHeader icon={<Search className="w-5 h-5" />} title="Results">
        <div className="flex items-center gap-2">
          {isRejectMode && (
            <>
              <span className="text-sm text-destructive font-medium">
                {selectedCount} selected
              </span>
              <button
                onClick={cancelRejectMode}
                className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-full hover:bg-muted/80 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={completeRejectMode}
                disabled={selectedCount === 0}
                className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                OK
              </button>
            </>
          )}
          <div className="text-sm text-muted-foreground ml-auto">
            {visibleHits.length} hits from {totalQueries} queries
            {filteredCount > 0 && (
              <span className="ml-1 text-muted-foreground/60">
                ({filteredCount} filtered)
              </span>
            )}
          </div>
        </div>
      </ModalHeader>

      <div className="grid gap-2 p-2 rounded-lg bg-background inset-shadow-sm max-h-[80vh] overflow-y-auto">
        {visibleHits.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Nothing found
          </div>
        ) : (
          visibleHits.map((hit, index) => {
            const selected = isHitSelected(hit);

            return (
              <div
                key={`${hit.magnet_link}-${index}`}
                onClick={() => {
                  if (isRejectMode) {
                    toggleHitSelection(hit);
                  }
                }}
                className={
                  isRejectMode
                    ? `flex flex-col md:flex-row justify-between py-2 border-b cursor-pointer transition-colors duration-200 ${
                        selected
                          ? "bg-destructive/15 border-destructive/40 text-destructive"
                          : "border-secondary-foreground/10 hover:bg-muted/30"
                      }`
                    : "flex flex-col md:flex-row justify-between py-2 border-b border-secondary-foreground/10"
                }
              >
                <div className="flex flex-row gap-2 items-center justify-start flex-1">
                  {isRejectMode && (
                    <div
                      className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        selected
                          ? "bg-destructive border-destructive"
                          : "border-foreground/30"
                      }`}
                    >
                      {selected && (
                        <Check className="w-3 h-3 text-destructive-foreground" />
                      )}
                    </div>
                  )}
                  <div className="truncate max-w-[75vw]">{hit.name}</div>
                  <a
                    href={hit.href}
                    target="_blank"
                    onClick={(e) => {
                      if (isRejectMode) e.stopPropagation();
                    }}
                  >
                    <ExternalLink style={thinIconStyle} className="w-4 h-4 shrink-0" />
                  </a>
                </div>
                <div className="flex flex-row gap-3 items-center justify-between mt-1 md:mt-0">
                  <div className="text-xs text-muted-foreground">{hit.size}</div>
                  <div className="text-xs">{hit.seeds} seeds</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isRejectMode) return;
                      handleMagnetClick(hit.name, hit.magnet_link);
                    }}
                    className={isRejectMode ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    <LineMdDownloadIcon className="h-4 w-4" style={thinIconStyle} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject mode toggle — only shown when not in reject mode */}
      {!isRejectMode && hits.length > 0 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={toggleRejectMode}
            className="px-4 py-2 text-sm bg-background border border-foreground/20 rounded-full hover:bg-muted transition-colors cursor-pointer flex items-center gap-2"
          >
            <Ban className="w-4 h-4" />
            Reject Results
          </button>
        </div>
      )}
    </ModalOverlay>
  );
};
