import { useState } from "react"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download, XIcon } from "lucide-react"
import { serverBaseUrl } from "@/app/config"
import { IndeterminateProgress } from "./indeterminate-progress"

interface TorrentSearchResult {
    magnet_link: string
    name: string
    seeds: number
}

function TorrentSearchResultRow(props: TorrentSearchResult) {
    const {
        magnet_link,
        name,
        seeds,
    } = props

    function addedTorrent() {
        console.log('added torrent to transmission')
        const sound = new Audio("/sounds/ding.mp3")
        sound.play()
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
            setSearchResults(data.results)
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
                    <div style={{padding: '1em 0 0 0'}}>
                        <IndeterminateProgress />
                    </div>
                ) : ''
            }
        </section>
    )
}

export { TorrentSearch }