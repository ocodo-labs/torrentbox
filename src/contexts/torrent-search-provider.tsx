import { serverBaseUrl } from '@/config';
import { useTransmissionContext } from '@/contexts/transmission-provider';
import { playSound } from '@/lib/play-sound';
import type { MediaListingItem } from '@/types/media-listing-interfaces';
import { createContext, useEffect, useState } from 'react';
import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';

export interface TorrentSearchResult extends MediaListingItem {
  magnet_link: string;
  seeds: string;
  size: string;
  category: string;
}

export interface TorrentSearchContextType {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  searchResults: TorrentSearchResult[];
  setSearchResults: Dispatch<SetStateAction<TorrentSearchResult[]>>;
  searching: boolean;
  setSearching: Dispatch<SetStateAction<boolean>>;
  torrentSearch: () => Promise<void>;
  resetSearch: () => void;
  postTorrentMagnet: (name: string, magnet_link: string) => Promise<void>;
  resultsFilter: string;
  setResultsFilter: (filter: string) => void;
  filteredSearchResults: TorrentSearchResult[]
}

export const TorrentSearchContext = createContext<TorrentSearchContextType | undefined>(undefined);

export const TorrentSearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<TorrentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [resultsFilter, setResultsFilter] = useState('');
  const [filteredSearchResults, setFilteredSearchResults] = useState<TorrentSearchResult[]>([]);

  // This implementation is ok for personal use,
  // it's not user friendly.
  // It's also a little janky i.e.
  //   (a group should work, but when there's more than two
  //   items in the capture group it doesn't match anything)
  useEffect(() => {
    if (resultsFilter != '') {
      try {
        const filterRegex = new RegExp(`^(?!.*${resultsFilter}).*$`, 'i')
        setFilteredSearchResults(
          searchResults.filter((e) => filterRegex.test(e.name))
        )
      } catch {

      }
    }
  }, [searchResults, resultsFilter])

  const noResultsMessage = `No Torrents Found for ${searchQuery}`

  const { fetchTorrents } = useTransmissionContext()

  async function torrentSearch() {
    setResultsFilter('')
    if (searchQuery != "") {
      setSearchResults([])
      setSearching(true)
      const query = encodeURIComponent(searchQuery)
      const response = await fetch(
        `${serverBaseUrl}/torrents/search/scrape?query=${query}`
      )
      const data = await response.json()
      if (!response.ok) {
        setSearching(false)
        if (data.detail) { toast(data.detail) }
        return
      }
      if (searchQuery.startsWith('magnet:')) {
        setSearching(false)
        if (data.info) { toast(data.info) }
        return
      }
      if (data?.results?.filter) {
        const filtered = data.results.filter((e: TorrentSearchResult) => {
          const hasSeeds = parseInt(e.seeds, 10) > 0
          const isNotPorn = !e.category
            .toLowerCase()
            .includes("porn")
          return hasSeeds && isNotPorn
        })
        setSearchResults(filtered)
        if (filtered.length == 0) {
          toast.warning(noResultsMessage)
        }
      } else {
        toast.warning(noResultsMessage)
      }
      setSearching(false)
    }
  }

  function resetSearch() {
    setSearchQuery('')
    setResultsFilter('')
    setSearchResults([])
    setSearching(false)
  }

  function addedTorrent() {
    console.log('added torrent to transmission')
    playSound("sounds/torrent-add.mp3")
  }

  async function postTorrentMagnet(name: string, magnet_link: string) {
    try {
      const response = await fetch(
        `${serverBaseUrl}/torrents/magnet/new`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          magnet_url: magnet_link
        })
      })
      if (response.status == 200) {
        await response.json()
        addedTorrent()
        toast(`Added: ${name}`)
        await fetchTorrents()
        return
      } else {
        console.error(`TorrentBox: Failed to add magnet link for ${name}`)
      }
    } catch {
      toast(`Error adding ${name}`)
    } finally {
      return
    }
  }

  return (
    <TorrentSearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        searching,
        setSearching,
        torrentSearch,
        resetSearch,
        postTorrentMagnet,
        resultsFilter,
        setResultsFilter,
        filteredSearchResults,
      }}
    >
      {children}
    </TorrentSearchContext.Provider>
  );
};

