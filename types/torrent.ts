type Torrent = {
    id: string
    name: string
    percent: number
    files: [string, number, number, number, boolean, number][]
}

type TorrentData = {
    downloaded: string[]
    downloading: Torrent[]
}

export {
    Torrent,
    TorrentData
}
