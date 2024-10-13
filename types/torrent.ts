
class Torrent {
    id: string;
    name: string;
    percent: number;
    files: [string, number, number, number, boolean, number][];
    softDeleted: number[];

    constructor({
        id,
        name,
        percent,
        files,
    }: {
        id: string;
        name: string;
        percent: number;
        files: [string, number, number, number, boolean, number][];
    }) {
        this.id = id;
        this.name = name;
        this.percent = percent;
        this.files = files;
        this.softDeleted = []
    }
}

type TorrentData = {
    downloaded: string[]
    downloading: Torrent[]
}

export {
    Torrent,
    TorrentData
}
