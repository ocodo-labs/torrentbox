import { serverBaseUrl } from "@/app/config"
import { IndeterminateProgress } from "@/components/indeterminate-progress"
import { Input } from "@/components/ui/input"
import { Circle, CircleX, SearchIcon } from "lucide-react"
import React, { useState } from "react"
import canAutoplay from 'can-autoplay'
import { toast } from "sonner"
import { AsycJobLongPressTooltipButton } from "@/components/long-press-float-button"
import { LineMdDownloadIcon } from "@/components/line-md-download-icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { thinIconStyle } from "@/lib/styling"


interface TorrentSearchResult {
  magnet_link: string
  name: string
  seeds: string
  size: string
  category: string
  existing: string[]
}

interface TorrentSearchResultWithFetchTorrents extends TorrentSearchResult {
  fetchTorrents: () => Promise<void>
}

function TorrentSearchResultRow(props: TorrentSearchResultWithFetchTorrents) {
  const {
    magnet_link,
    name,
    seeds,
    size,
    existing,
    fetchTorrents,
  } = props

  function addedTorrent() {
    console.log('added torrent to transmission')

    canAutoplay.audio().then(({ result }: { result: boolean }) => {
      if (result === true) {
        const sound = new Audio("/sounds/torrent-download.mp3")
        sound.play()
      }
    })
  }

  const getTorrentMagnet = async (name: string, magnet_link: string) => {
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
    <div className="flex justify-between items-center border-b-2 border-secondary-foreground/10">
      <div className="text-sm w-30 truncate mr-2 md:w-fit md:text-base">
        <div className="flex flex-row gap-2 items-center justify-start">
          {
            existing.length > 0 &&
            <Tooltip>
              <TooltipTrigger>
                <Circle className="w-4 h-4" stroke="#AA6600" strokeWidth={3} />
              </TooltipTrigger>
              <TooltipContent>
                Existing Download: {existing}
              </TooltipContent>
            </Tooltip>
          }
          {
            existing.length == 0 &&
            <Circle className="w-4 h-4" />
          }
          <div>
            {name}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 select-none">
        <div className="text-xs text-muted-foreground">
          {size}
        </div>
        <Tooltip>
          <TooltipTrigger>
            <div className="text-xs w-3">
              {seeds}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Seeds
          </TooltipContent>
        </Tooltip>
        <div className="ml-4 my-[3px]">
          <AsycJobLongPressTooltipButton
            fillColor="bg-primary"
            title={`Download ${name}`}
            onLongPress={() => getTorrentMagnet(name, magnet_link)}
            icon={<LineMdDownloadIcon className="h-4 w-4" style={thinIconStyle} />} />
        </div>
      </div>
    </div>
  )
}

interface TorrentSearchProps {
  fetchTorrents: (...args: unknown[]) => Promise<void>
}

const TorrentSearch: React.FC<TorrentSearchProps> = (props) => {
  const { fetchTorrents } = props
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const noResultsMessage = `No Torrents Found for ${searchQuery}`

  function resetSearch() {
    setSearchQuery('')
    setSearchResults([])
    setSearching(false)
  }

  async function torrentSearch() {
    if (searchQuery != "") {
      setSearchResults([])
      setSearching(true)
      const response = await fetch(`${serverBaseUrl}/torrents/search/scrape?query=${encodeURIComponent(searchQuery)}`)
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
          const isNotPorn = !e.category.toLowerCase().includes("porn")
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
          className="flex flex-row px-4 items-center justify-center cursor-pointer hover:bg-primary/70 rounded-full bg-primary text-primary-foreground transition-colors duration-[1s]"
          onClick={torrentSearch}>
          <SearchIcon
            style={thinIconStyle}
            className="mr-2 w-4 h-4"
          />
          Search
        </div>
        <CircleX
          className="mt-1 size-8 cursor-pointer"
          style={thinIconStyle}
          onClick={resetSearch} />
      </div>
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
                        fetchTorrents={fetchTorrents}
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

export { TorrentSearch }
