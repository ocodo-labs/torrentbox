import { usePinnedQueries } from "@/contexts/pinned-queries-context";
import { useTorrentSearch } from "@/contexts/torrent-search-context";
import { pinnedSearchQueryClasses } from "@/lib/styling";
import { CircleX } from "lucide-react";
import { forwardRef, type HTMLAttributes } from "react";

interface ItemProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
  query: string;
}

export const PinnedQueryDragItem = forwardRef<HTMLDivElement, ItemProps>((
  {
    id,
    query,
    ...props
  },
  ref) => {

  const { unpinQuery } = usePinnedQueries()
  const { setSearchQuery } = useTorrentSearch()

  return (
    <div {...props} ref={ref}>
      <div className={pinnedSearchQueryClasses}>
        <div onClick={() => setSearchQuery(query)}>
          {query}
        </div>
        <div className="absolute top-[-5px] right-[-6px]">
          <CircleX
            size={16}
            className="bg-background rounded-full p-[1px]"
            onClick={() => unpinQuery(query)} />
        </div>
      </div>
    </div>
  );
});