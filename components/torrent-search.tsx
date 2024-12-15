import { serverBaseUrl } from "@/app/config"
import { IndeterminateProgress } from "@/components/indeterminate-progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { useState } from "react"

interface TorrentSearchResult {
    magnet_link: string
    name: string
    seeds: string
}

function TorrentSearchResultRow(props: TorrentSearchResult) {
    const {
        magnet_link,
        name,
        seeds,
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
            <TableCell className="font-medium">
                {name}
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
            const filtered = data.results.filter((e: TorrentSearchResult) => parseInt(e.seeds, 10) > 0)
            setSearchResults(filtered)
            setSearching(false)
        }
    }

    return (
        <section>
            <h2 className="text-xl font-semibold mb-4">Search</h2>
            <div className="flex space-x-4">
                <Input
                    value={searchQuery}
                    placeholder="Search Torrents..."
                    onChange={e => setSearchQuery(e.target.value)}
                    type="search"
                />
                <Button onClick={torrentSearch}>Search</Button>
                <Button onClick={resetSearch}>Clear</Button>
            </div>
            {
                searchResults.length > 0 ? (
                    <div className="mt-4 overflow-x-auto">
                        <Table>
                            <TableBody>
                                {
                                    searchResults
                                        .map(
                                            (row: TorrentSearchResult) => (<TorrentSearchResultRow {...row} />)
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
