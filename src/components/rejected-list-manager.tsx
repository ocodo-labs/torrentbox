import { Ban, Search, Trash2, X } from "lucide-react";
import { type FC, useCallback, useEffect, useState } from "react";
import { thinIconStyle } from "@/lib/styling";
import { Input } from "@/components/ui/input";

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

export const RejectedListManager: FC = () => {
  const [rejected, setRejected] = useState<string[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setRejected(loadRejectedQueries());
  }, []);

  const removeItem = useCallback((name: string) => {
    const next = rejected.filter((r) => r !== name);
    setRejected(next);
    saveRejectedQueries(next);
  }, [rejected]);

  const clearAll = useCallback(() => {
    setRejected([]);
    saveRejectedQueries([]);
  }, []);

  const filtered = rejected.filter((r) =>
    r.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-row items-center gap-2">
        <Ban className="w-5 h-5 text-destructive" />
        <div className="text-lg font-bold">Rejected Items</div>
        <div className="text-sm text-muted-foreground ml-auto">
          {rejected.length} item{rejected.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 rounded-full border-foreground/20"
          value={filter}
          placeholder="Filter rejected items..."
          onChange={(e) => setFilter(e.target.value)}
        />
        {filter && (
          <X
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground"
            style={thinIconStyle}
            onClick={() => setFilter("")}
          />
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          {rejected.length === 0
            ? "No rejected items yet"
            : "No matches"}
        </div>
      ) : (
        <div className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto rounded-lg border border-foreground/10 bg-background p-1">
          {filtered.map((name) => (
            <div
              key={name}
              className="flex flex-row items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="truncate flex-1 text-sm">{name}</div>
              <button
                onClick={() => removeItem(name)}
                className="shrink-0 p-1 rounded-full hover:bg-background transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" style={thinIconStyle} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Clear all */}
      {rejected.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={clearAll}
            className="px-4 py-2 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-full hover:bg-destructive/20 transition-colors cursor-pointer"
          >
            Clear All ({rejected.length})
          </button>
        </div>
      )}
    </div>
  );
};
