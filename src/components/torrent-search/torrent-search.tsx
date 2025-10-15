import type { FC } from "react"
import { Input } from "@/components/ui/input"
import { IndeterminateProgress } from "@/components/indeterminate-progress"
import { CircleX, Pin, SearchIcon } from "lucide-react"
import { thinIconStyle } from "@/lib/styling"
import { TooltipCompact } from "@/components/tooltip-compact"
import { PinnedSearchQueries } from "@/components/torrent-search/pinned-search-queries"
import { useTorrentSearch } from "@/contexts/torrent-search-context"
import { usePinnedQueries } from "@/contexts/pinned-queries-context"
import { TorrentSearchResults } from "@/components/torrent-search/torrent-search-results"

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
    searching,
    resultsFilter,
    setResultsFilter,
    filteredSearchResults,
  } = useTorrentSearch()

  return (
    <div>
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
            select-none
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
        searchResults.length > 0 &&
        <div className="flex flex-row gap-2">
          <Input
            className="rounded-full border-foreground/20"
            value={resultsFilter}
            placeholder="Filter out word (or regex capture group of words)"
            onChange={(e) => setResultsFilter(e.target.value)}
          />
          <CircleX
            className="mt-1 size-8 cursor-pointer"
            style={thinIconStyle}
            onClick={() => setResultsFilter('')}
          />
        </div>
      }

      {resultsFilter == '' || filteredSearchResults.length == 0 ?
        searchResults.length > 0
          ?
          <TorrentSearchResults
            searchResults={searchResults}
          />
          : searching && (
            <div style={{ padding: '1em 0 0 0' }}>
              <IndeterminateProgress />
            </div>
          )
        :
        <TorrentSearchResults
          searchResults={filteredSearchResults}
        />
      }
    </div>
  )
}

