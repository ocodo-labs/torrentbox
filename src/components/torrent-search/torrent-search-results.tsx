import { TorrentSearchResultRow } from "@/components/torrent-search/torrent-search-result-row";
import type { TorrentSearchResult } from "@/contexts/torrent-search-provider";
import type { FC } from "react";

interface TorrentSearchResultsProps {
  searchResults: TorrentSearchResult[];
}

export const TorrentSearchResults: FC<TorrentSearchResultsProps> = ({ searchResults }) => (
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
)
