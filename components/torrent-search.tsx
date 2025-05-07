import { serverBaseUrl } from "@/app/config"
import { IndeterminateProgress } from "@/components/indeterminate-progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { CircleX, Download, SearchIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

interface TorrentSearchResult {
    magnet_link: string
    name: string
    seeds: string
    size: string
    category: string
}

function TorrentSearchResultRow(props: TorrentSearchResult) {
    const {
        magnet_link,
        name,
        seeds,
        size,
        category,
    } = props

    function addedTorrent() {
        console.log('added torrent to transmission')
        try {
            const sound = new Audio("/sounds/torrent-download.mp3")
            sound.play()
        } catch (e) {
            console.log("Could not play added torrent sound")
        }
    }

    async function getTorrentMagnet(magnet_link: string) {
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
        } else {
            console.error('TorrentBox: Failed to add magnet link from search')
        }
    }

    return (
        <TableRow>
            <TableCell className="font-medium text-lg">
                {name}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
                {size}
            </TableCell>
            <TableCell className="font-medium">
                {seeds}
            </TableCell>
            <TableCell>
                <Button variant="ghost" size="icon" onClick={() => getTorrentMagnet(magnet_link)}>
                    <Download className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    )
}

function TorrentSearch() {
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)

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
            console.dir(data)
            const filtered = data.results.filter((e: TorrentSearchResult) => {
                const hasSeeds = parseInt(e.seeds, 10) > 0
                const isNotPorn = !e.category.toLowerCase().includes("porn")
                return hasSeeds && isNotPorn
            })
            setSearchResults(filtered)
            if (filtered.length == 0) {
                toast({
                    title: "No Torrents Found",
                    description: `No results for ${searchQuery}`
                  })
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
                    onClick={torrentSearch}><SearchIcon className="mr-2 w-4 h-4"/> Search</Button>
                <CircleX className="mt-1 size-8 cursor-pointer" onClick={resetSearch} />
            </div>
            {
                searchResults.length > 0 ? (
                    <div className="mt-4 overflow-x-auto">
                        <h2 className="text-xl font-semibold mb-4">Search Results</h2>
                        <Table>
                            <TableBody>
                                {
                                    searchResults
                                        .map(
                                            (row: TorrentSearchResult) => (
                                                <TorrentSearchResultRow key={row.magnet_link} {...row} />
                                            )
                                        )
                                }
                            </TableBody>
                        </Table>
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
