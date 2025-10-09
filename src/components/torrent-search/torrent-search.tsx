import { IndeterminateProgress } from "@/components/indeterminate-progress"
import { Input } from "@/components/ui/input"
import { CircleX, Pin, SearchIcon } from "lucide-react"
import type { FC } from "react"
import { thinIconStyle } from "@/lib/styling"
import { TooltipCompact } from "@/components/tooltip-compact"
import { usePinnedQueries } from "@/contexts/pinned-queries-context"
import type { TorrentSearchResult } from "@/contexts/torrent-search-provider"
import { useTorrentSearch } from "@/contexts/torrent-search-context"
import { PinnedSearchQueries } from "@/components/torrent-search/pinned-search-queries"
import { TorrentSearchResultRow } from "@/components/torrent-search/torrent-search-result-row"

export const TorrentSearch: FC = () => {

  const {
    pinnedQueries,
    pinQuery
  } = usePinnedQueries()

  const {
    searchQuery,
    setSearchQuery,
    torrentSearch,
    resetSearch,
    searchResults,
    searching
  } = useTorrentSearch()

  return (
    <section>
      <div className="flex space-x-4">
        <Input
          className="rounded-full border-foreground/20"
          value={searchQuery}
          placeholder="Search Torrents..."
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={(e) => (e.code == "Enter") && torrentSearch()}
          type="search"
        />
        <div
          className={
            `
            cursor-pointer
            flex flex-row
            items-center
            justify-center
            rounded-full
            px-4
            bg-primary
            hover:bg-primary/70
            text-primary-foreground
            transition-colors
            duration-[1s]
            `
          }
          onClick={torrentSearch}>
          <SearchIcon
            style={thinIconStyle}
            className="mr-2 w-4 h-4"
          />
          Search
        </div>
        {searchQuery != '' && !pinnedQueries
          .map(e => e.toLocaleLowerCase())
          .includes(searchQuery.toLocaleLowerCase()) &&
          <TooltipCompact tooltipChildren={'Pin Query'}>
            <Pin
              onClick={() => pinQuery(searchQuery)}
              className="mt-1 size-6 cursor-pointer"
              style={thinIconStyle} />
          </TooltipCompact>
        }
        <CircleX
          className="mt-1 size-8 cursor-pointer"
          style={thinIconStyle}
          onClick={resetSearch} />
      </div>
      {
        pinnedQueries.length > 0 &&
        <PinnedSearchQueries />
      }

      {
        searchResults.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            <div className="grid grid-cols-1">
              {
                searchResults
                  .map(
                    (row: TorrentSearchResult) => (
                      <TorrentSearchResultRow
                        key={row.magnet_link}
                        {...row}
                      />
                    )
                  )
              }
            </div>
          </div>
        ) : searching ? (
          <div style={{ padding: '1em 0 0 0' }}>
            <IndeterminateProgress />
          </div>
        ) : ''
      }
    </section>
  )
}

