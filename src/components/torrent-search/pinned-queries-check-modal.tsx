import { ModalHeader } from "@/components/modal/modal-header";
import { ModalOverlay } from "@/components/modal/modal-overlay";
import { usePinnedQueries } from "@/contexts/pinned-queries-context";
import { useTransmissionContext } from "@/contexts/transmission-provider";
import { Check, Search, X } from "lucide-react";
import { type FC, useEffect, useState } from "react";

interface CheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CheckResult {
  query: string;
  matched: boolean;
  torrentName?: string;
}

export const PinnedQueriesCheckModal: FC<CheckModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { pinnedQueries } = usePinnedQueries();
  const { torrents } = useTransmissionContext();
  const [results, setResults] = useState<CheckResult[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setChecking(true);
    setResults([]);

    // Small delay so the modal renders before we start checking
    const timer = setTimeout(() => {
      const checked: CheckResult[] = pinnedQueries.map((query) => {
        const lower = query.toLowerCase();
        const match = torrents.find((t) => t.name.toLowerCase().includes(lower));
        return {
          query,
          matched: !!match,
          torrentName: match?.name,
        };
      });
      setResults(checked);
      setChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, pinnedQueries, torrents]);

  const matchedCount = results.filter((r) => r.matched).length;

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <ModalHeader icon={<Search className="w-5 h-5" />} title="Did it show up yet?">
        <div className="text-sm text-muted-foreground ml-auto">
          {matchedCount}/{pinnedQueries.length} found
        </div>
      </ModalHeader>

      {checking ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full" />
        </div>
      ) : (
        <div className="grid gap-2 p-2 rounded-lg bg-background inset-shadow-sm max-h-[80vh] overflow-y-auto">
          {results.map((result) => (
            <div
              key={result.query}
              className={`flex flex-row items-center gap-3 p-3 border rounded-lg ${
                result.matched
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-foreground/10 bg-card"
              }`}
            >
              {result.matched ? (
                <Check className="w-4 h-4 text-green-500 shrink-0" />
              ) : (
                <X className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{result.query}</div>
                {result.matched && result.torrentName && (
                  <div className="text-xs text-muted-foreground truncate">
                    → {result.torrentName}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalOverlay>
  );
};
