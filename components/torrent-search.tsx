import { serverBaseUrl } from "@/app/config"
import { IndeterminateProgress } from "@/components/indeterminate-progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CircleX, Download, SearchIcon } from "lucide-react"
import React, { useState } from "react"
import canAutoplay from 'can-autoplay'
import { toast } from "sonner"
import { FloatBox } from "@/components/float-box"
import { LongPressFloatButton } from "@/components/long-press-float-button"

interface TorrentSearchResult {
  magnet_link: string
  name: string
  seeds: string
  size: string
  category: string
}

interface TorrentSearchResultWithFetchTorrents extends TorrentSearchResult {
  fetchTorrents: () => void
}

function TorrentSearchResultRow(props: TorrentSearchResultWithFetchTorrents) {
  const {
    magnet_link,
    name,
    seeds,
    size,
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

  async function getTorrentMagnet(name: string, magnet_link: string) {
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
        addedTorrent()
        toast(`Added: ${name}`)
        fetchTorrents()
      } else {
        console.error(`TorrentBox: Failed to add magnet link for ${name}`)
      }
    } catch {
      toast(`Error adding ${name}`)
    }
  }

  return (
    <div className="flex justify-between items-center border-b-2 border-secondary-foreground/10">
      <div className="font-medium">
        {name}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-xs text-muted-foreground">
          {size}
        </div>
        <FloatBox hAlign='center' vAlign='top' body='Seeds' >
          <div className="text-xs w-10">
            {seeds}
          </div>
        </FloatBox>
        <LongPressFloatButton
          fillColor="bg-emerald-500"
          hAlign='left'
          vAlign='top'
          title={`Download ${name}`}
          onLongPress={() => getTorrentMagnet(name, magnet_link)}
          icon={<Download className="h-4 w-4" />} />
      </div>
    </div>
  )
}

interface TorrentSearchProps {
  fetchTorrents: (...args: unknown[]) => void
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
          className="rounded-full"
          value={searchQuery}
          placeholder="Search Torrents..."
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={(e) => (e.code == "Enter") && torrentSearch()}
          type="search"
        />
        <Button
          className="rounded-full"
          onClick={torrentSearch}><SearchIcon className="mr-2 w-4 h-4" /> Search</Button>
        <CircleX className="mt-1 size-8 cursor-pointer" onClick={resetSearch} />
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
